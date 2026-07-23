import type { Project, ProjectStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface ProjectResponse {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: Date | null;
  endDate: Date | null;
  color: string | null;
  archived: boolean;
  createdById: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface ProjectListQuery {
  page: number;
  limit: number;
  search?: string | undefined;
  sort: "asc" | "desc";
  status?: ProjectStatus | undefined;
  archived?: boolean | undefined;
}

export interface ProjectListResult {
  projects: ProjectResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ProjectCreateInput {
  name: string;
  description?: string | null | undefined;
  status?: ProjectStatus | undefined;
  startDate?: Date | null | undefined;
  endDate?: Date | null | undefined;
  color?: string | null | undefined;
  archived?: boolean | undefined;
}

export interface ProjectUpdateInput {
  name?: string | undefined;
  description?: string | null | undefined;
  status?: ProjectStatus | undefined;
  startDate?: Date | null | undefined;
  endDate?: Date | null | undefined;
  color?: string | null | undefined;
  archived?: boolean | undefined;
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export type ProjectRecord = Project;
export type ProjectRequest = AuthenticatedRequest;