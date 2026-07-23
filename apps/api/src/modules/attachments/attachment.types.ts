import type { Attachment } from "@prisma/client";
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

export interface AttachmentCreateInput {
  originalName: string;
  storedName: string;
  mimeType: string;
  fileSize: number;
  storagePath: string;
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export type AttachmentRecord = Attachment;
export type AttachmentRequest = AuthenticatedRequest;