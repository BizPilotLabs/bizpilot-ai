import type { Attachment, AttachmentStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface AttachmentResponse {
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
  uploadExpiresAt: Date | null;
  finalizedAt: Date | null;
  createdAt: Date;
}

export interface AttachmentListQuery {
  page: number;
  limit: number;
  sort: "asc" | "desc";
}

export interface AttachmentListResult {
  attachments: AttachmentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AttachmentUploadIntentInput {
  originalName: string;
  mimeType: string;
  fileSize: number;
}

export interface AttachmentUploadAuthorization {
  attachment: AttachmentResponse;
  uploadUrl: string;
  headers: Record<string, string>;
  expiresAt: Date;
}

export interface AttachmentDownloadAuthorization {
  downloadUrl: string;
  expiresAt: Date;
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export type AttachmentRecord = Attachment;
export type AttachmentRequest = AuthenticatedRequest;
