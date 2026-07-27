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

export type UserStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
export type UserSortDirection = "asc" | "desc";

export interface UserRoleSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface PermissionSummary {
  id: string;
  key: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}

export interface RoleSummary extends UserRoleSummary {
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  permissions: PermissionSummary[];
}

export interface UserProfile {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  status: UserStatus;
  emailVerified: boolean;
  lastLoginAt: string | null;
  organizationId: string;
  createdAt: string;
  updatedAt: string;
  roles: UserRoleSummary[];
}

export interface UserListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: UserSortDirection;
}

export interface UserPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface UserListResult {
  users: UserProfile[];
  pagination: UserPagination;
}

export interface UserMutationResponse {
  user: UserProfile;
}

export interface UserDeleteResponse {
  deleted: boolean;
}

export interface RoleListResponse {
  roles: RoleSummary[];
}

export interface UserRolesResponse {
  userId: string;
  roles: RoleSummary[];
}

export interface CreateUserInput {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  roleIds: string[];
}

export interface UpdateUserInput {
  firstName?: string;
  lastName?: string;
  avatar?: string | null;
}

export interface UpdateUserVariables {
  userId: string;
  data: UpdateUserInput;
}

export interface UpdateUserRolesVariables {
  userId: string;
  roleIds: string[];
}
