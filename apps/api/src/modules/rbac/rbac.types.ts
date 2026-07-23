import type { Permission, Role } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface PermissionCatalogItem {
  key: string;
  name: string;
  resource: string;
  action: string;
  description: string;
}

export interface PermissionResponse {
  id: string;
  key: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface RoleResponse {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
  permissions: PermissionResponse[];
}

export interface UserRoleResponse {
  userId: string;
  roles: RoleResponse[];
}

export interface RoleCreateInput {
  name: string;
  description?: string | null | undefined;
  permissionIds?: string[] | undefined;
}

export interface RoleUpdateInput {
  name?: string | undefined;
  description?: string | null | undefined;
}

export interface PermissionAssignmentInput {
  permissionIds: string[];
}

export interface UserRoleAssignmentInput {
  roleIds: string[];
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export interface RoleWithPermissions extends Role {
  permissions: {
    permission: Permission;
  }[];
}

export interface RbacUserRoleRecord {
  role: RoleWithPermissions;
}

export interface RbacUserRecord {
  id: string;
  organizationId: string;
  status: "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
  deletedAt: Date | null;
  roles: RbacUserRoleRecord[];
}

export type RbacRequest = AuthenticatedRequest;