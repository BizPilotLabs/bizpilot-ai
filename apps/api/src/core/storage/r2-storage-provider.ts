import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../../config/index.js";
import type { CreateDownloadUrlInput, CreateUploadUrlInput, StorageObjectMetadata, StorageProvider } from "./storage.types.js";

const contentDispositionFilename = (filename: string): string => {
  const safeFilename = filename.replace(/["\r\n\\]/gu, "_");
  return `attachment; filename="${safeFilename}"`;
};

export class R2StorageProvider implements StorageProvider {
  public readonly providerName = "r2";
  public readonly enabled = true;

  private readonly bucketName: string;
  private readonly client: S3Client;

  public constructor() {
    const endpoint = env.R2_ENDPOINT ?? `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`;
    this.bucketName = env.R2_BUCKET_NAME ?? "";
    this.client = new S3Client({
      region: "auto",
      endpoint,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID ?? "",
        secretAccessKey: env.R2_SECRET_ACCESS_KEY ?? ""
      }
    });
  }

  public async createUploadUrl(input: CreateUploadUrlInput): Promise<{ url: string; headers: Record<string, string> }> {
    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: input.key,
      ContentType: input.mimeType
    });

    return {
      url: await getSignedUrl(this.client, command, { expiresIn: input.expiresInSeconds }),
      headers: {
        "content-type": input.mimeType
      }
    };
  }

  public async createDownloadUrl(input: CreateDownloadUrlInput): Promise<{ url: string }> {
    const command = new GetObjectCommand({
      Bucket: this.bucketName,
      Key: input.key,
      ResponseContentDisposition: contentDispositionFilename(input.filename)
    });

    return { url: await getSignedUrl(this.client, command, { expiresIn: input.expiresInSeconds }) };
  }

  public async getObjectMetadata(key: string): Promise<StorageObjectMetadata | null> {
    try {
      const result = await this.client.send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }));
      return {
        contentLength: result.ContentLength ?? null,
        contentType: result.ContentType ?? null
      };
    } catch (error) {
      const name = error instanceof Error ? error.name : "";
      if (name === "NotFound" || name === "NoSuchKey" || name === "S3ServiceException") {
        return null;
      }
      throw error;
    }
  }

  public async deleteObject(key: string): Promise<void> {
    await this.client.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
  }
}
