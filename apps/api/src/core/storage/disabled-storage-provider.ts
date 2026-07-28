import { AppError } from "../errors/index.js";
import type { CreateDownloadUrlInput, CreateUploadUrlInput, StorageObjectMetadata, StorageProvider } from "./storage.types.js";

export class DisabledStorageProvider implements StorageProvider {
  public readonly providerName = "disabled";
  public readonly enabled = false;

  public createUploadUrl(_input: CreateUploadUrlInput): Promise<{ url: string; headers: Record<string, string> }> {
    throw new AppError({ statusCode: 503, message: "Attachment storage is not configured.", code: "STORAGE_NOT_CONFIGURED" });
  }

  public createDownloadUrl(_input: CreateDownloadUrlInput): Promise<{ url: string }> {
    throw new AppError({ statusCode: 503, message: "Attachment storage is not configured.", code: "STORAGE_NOT_CONFIGURED" });
  }

  public getObjectMetadata(_key: string): Promise<StorageObjectMetadata | null> {
    throw new AppError({ statusCode: 503, message: "Attachment storage is not configured.", code: "STORAGE_NOT_CONFIGURED" });
  }

  public deleteObject(_key: string): Promise<void> {
    throw new AppError({ statusCode: 503, message: "Attachment storage is not configured.", code: "STORAGE_NOT_CONFIGURED" });
  }
}
