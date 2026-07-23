import type { Comment, Role, User } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface CommentResponse {
  id: string;
  taskId: string;
  organizationId: string;
  authorId: string;
  content: string;
  edited: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CommentListQuery {
  page: number;
  limit: number;
  sort: "asc" | "desc";
}

export interface CommentListResult {
  comments: CommentResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CommentCreateInput {
  content: string;
}

export interface CommentUpdateInput {
  content: string;
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export interface RequesterRecord {
  id: string;
  roles: {
    role: Pick<Role, "name" | "deletedAt">;
  }[];
}

export type CommentRecord = Comment;
export type CommentAuthorRecord = Pick<User, "id" | "organizationId" | "deletedAt">;
export type CommentRequest = AuthenticatedRequest;