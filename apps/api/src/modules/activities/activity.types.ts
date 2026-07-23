import type { AuditLog, Prisma, User } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface ActivityActor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
}

export interface ActivityResponse {
  id: string;
  organizationId: string | null;
  userId: string | null;
  action: string;
  type: string;
  resource: string;
  ipAddress: string | null;
  userAgent: string | null;
  metadata: Prisma.JsonValue | null;
  createdAt: Date;
  updatedAt: Date;
  actor: ActivityActor | null;
}

export interface ActivityListQuery {
  page: number;
  limit: number;
  search?: string | undefined;
  action?: string | undefined;
  resource?: string | undefined;
  userId?: string | undefined;
  startDate?: Date | undefined;
  endDate?: Date | undefined;
  sort: "asc" | "desc";
}

export interface ActivityListResult {
  activities: ActivityResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export type ActivityRecord = AuditLog & {
  user: Pick<User, "id" | "email" | "firstName" | "lastName" | "avatar"> | null;
};

export type ActivityRequest = AuthenticatedRequest;