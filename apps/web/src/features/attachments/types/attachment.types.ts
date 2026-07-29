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
export type AttachmentExtractionStatus = "NOT_REQUESTED" | "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED" | "UNSUPPORTED";
export type AttachmentSortDirection = "asc" | "desc";

export interface AttachmentExtractionSummary {
  attachmentId: string;
  status: AttachmentExtractionStatus;
  supported: boolean;
  extractorName: string | null;
  extractorVersion: string | null;
  characterCount: number | null;
  truncated: boolean;
  errorCode: string | null;
  requestedAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
}

export interface AttachmentExtractedText extends AttachmentExtractionSummary {
  text: string | null;
}

export interface Attachment {
  id: string;
  organizationId: string;
  taskId: string;
  uploadedBy: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  provider: string;
  status: AttachmentStatus;
  uploadExpiresAt: string | null;
  finalizedAt: string | null;
  extractionStatus: AttachmentExtractionStatus;
  extractionErrorCode: string | null;
  extractionRequestedAt: string | null;
  extractionStartedAt: string | null;
  extractionCompletedAt: string | null;
  extractorName: string | null;
  extractorVersion: string | null;
  extractedCharacterCount: number | null;
  extractionTruncated: boolean;
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

export interface AttachmentExtractionResponse {
  extraction: AttachmentExtractionSummary;
}

export interface AttachmentExtractedTextResponse {
  extraction: AttachmentExtractedText;
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
