import { Prisma, type Role } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

const _commentWithAuthor = Prisma.validator<Prisma.CommentDefaultArgs>()({
  include: {
    author: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        deletedAt: true,
      },
    },
  },
});

export interface CommentAuthorSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  isDeleted: boolean;
}

export interface CommentResponse {
  id: string;
  taskId: string;
  organizationId: string;
  authorId: string;
  author: CommentAuthorSummary;
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

export type CommentRecord = Prisma.CommentGetPayload<typeof _commentWithAuthor>;
export type CommentRequest = AuthenticatedRequest;