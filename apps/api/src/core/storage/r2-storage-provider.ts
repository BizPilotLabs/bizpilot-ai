import { DeleteObjectCommand, GetObjectCommand, HeadObjectCommand, PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { Readable } from "node:stream";

import { env } from "../../config/index.js";
import { AppError } from "../errors/index.js";
import type { CreateDownloadUrlInput, CreateUploadUrlInput, GetObjectContentInput, StorageObjectContent, StorageObjectMetadata, StorageProvider } from "./storage.types.js";

const contentDispositionFilename = (filename: string): string => {
  const safeFilename = filename.replace(/["\r\n\\]/gu, "_");
  return `attachment; filename="${safeFilename}"`;
};

const streamToBuffer = async (stream: Readable, maxBytes: number): Promise<Buffer> => {
  const chunks: Buffer[] = [];
  let totalBytes = 0;

  for await (const chunk of stream) {
    const buffer = Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk as Uint8Array);
    totalBytes += buffer.byteLength;

    if (totalBytes > maxBytes) {
      stream.destroy();
      throw new AppError({ statusCode: 413, message: "Stored object is too large to process.", code: "STORAGE_OBJECT_TOO_LARGE" });
    }

    chunks.push(buffer);
  }

  return Buffer.concat(chunks, totalBytes);
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;
  const timeoutPromise = new Promise<never>((_resolve, reject) => {
    timeout = setTimeout(() => reject(new AppError({ statusCode: 504, message: "Storage object retrieval timed out.", code: "STORAGE_RETRIEVAL_TIMEOUT" })), timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
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

  public async getObjectContent(input: GetObjectContentInput): Promise<StorageObjectContent | null> {
    try {
      const result = await withTimeout(this.client.send(new GetObjectCommand({ Bucket: this.bucketName, Key: input.key })), input.timeoutMs);

      if (result.ContentLength !== undefined && result.ContentLength > input.maxBytes) {
        throw new AppError({ statusCode: 413, message: "Stored object is too large to process.", code: "STORAGE_OBJECT_TOO_LARGE" });
      }

      if (!(result.Body instanceof Readable)) {
        throw new AppError({ statusCode: 502, message: "Stored object could not be read.", code: "STORAGE_OBJECT_UNREADABLE" });
      }

      return {
        body: await withTimeout(streamToBuffer(result.Body, input.maxBytes), input.timeoutMs),
        metadata: {
          contentLength: result.ContentLength ?? null,
          contentType: result.ContentType ?? null
        }
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
