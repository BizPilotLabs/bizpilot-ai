export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export interface Permission {
  id: string;
  key: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface Role {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  userCount: number;
  createdAt: string;
  updatedAt: string;
  permissions: Permission[];
}

export interface RolesResponse {
  roles: Role[];
}

export interface RoleResponse {
  role: Role;
}

export interface PermissionsResponse {
  permissions: Permission[];
}

export interface RoleDeleteResponse {
  deleted: boolean;
}

export interface CreateRoleInput {
  name: string;
  description?: string | null;
  permissionIds?: string[];
}

export interface UpdateRoleInput {
  name?: string;
  description?: string | null;
}

export interface UpdateRoleVariables {
  roleId: string;
  data: UpdateRoleInput;
}

export interface UpdateRolePermissionsVariables {
  roleId: string;
  permissionIds: string[];
}

export type RoleSort = "name" | "createdAt" | "updatedAt" | "permissions" | "users";
