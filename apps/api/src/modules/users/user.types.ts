import type { Permission, Role } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
  emailVerified: boolean;
  lastLoginAt: Date | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  roles: UserRoleSummary[];
}

export interface UserRoleSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface UserListQuery {
  page: number;
  limit: number;
  search?: string | undefined;
  sort: "asc" | "desc";
}

export interface UserListResult {
  users: UserProfile[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface UserUpdateInput {
  firstName?: string | undefined;
  lastName?: string | undefined;
  avatar?: string | null | undefined;
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export interface UserRecord {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
  emailVerified: boolean;
  lastLoginAt: Date | null;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
  roles: {
    role: Role & {
      permissions: {
        permission: Permission;
      }[];
    };
  }[];
}

export type UserRequest = AuthenticatedRequest;