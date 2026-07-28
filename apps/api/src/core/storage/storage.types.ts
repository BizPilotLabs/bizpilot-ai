export interface StorageObjectMetadata {
  contentLength: number | null;
  contentType: string | null;
}

export interface CreateUploadUrlInput {
  key: string;
  mimeType: string;
  expiresInSeconds: number;
}

export interface CreateDownloadUrlInput {
  key: string;
  filename: string;
  expiresInSeconds: number;
}

export interface StorageProvider {
  readonly providerName: string;
  readonly enabled: boolean;
  createUploadUrl(input: CreateUploadUrlInput): Promise<{ url: string; headers: Record<string, string> }>;
  createDownloadUrl(input: CreateDownloadUrlInput): Promise<{ url: string }>;
  getObjectMetadata(key: string): Promise<StorageObjectMetadata | null>;
  deleteObject(key: string): Promise<void>;
}
