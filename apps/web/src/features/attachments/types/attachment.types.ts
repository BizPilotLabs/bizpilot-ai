export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
}

export type AttachmentStatus = "PENDING" | "READY";
export type AttachmentSortDirection = "asc" | "desc";

export interface Attachment {
  id: string;
  organizationId: string;
  taskId: string;
  uploadedBy: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
  provider: string;
  status: AttachmentStatus;
  uploadExpiresAt: string | null;
  finalizedAt: string | null;
  createdAt: string;
}

export interface AttachmentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface AttachmentListQuery {
  page?: number;
  limit?: number;
  sort?: AttachmentSortDirection;
}

export interface AttachmentListResult {
  attachments: Attachment[];
  pagination: AttachmentPagination;
}

export interface InitializeAttachmentUploadInput {
  originalName: string;
  mimeType: string;
  fileSize: number;
}

export interface AttachmentUploadAuthorization {
  attachment: Attachment;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: string;
}

export interface AttachmentUploadResponse {
  upload: AttachmentUploadAuthorization;
}

export interface AttachmentMutationResponse {
  attachment: Attachment;
}

export interface AttachmentDownloadResponse {
  downloadUrl: string;
  expiresAt: string;
}

export interface AttachmentDeleteResponse {
  deleted: boolean;
}

export interface UploadAttachmentVariables {
  taskId: string;
  file: File;
  onProgress?: (progress: number) => void;
}
