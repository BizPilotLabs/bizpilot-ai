export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export type UserStatus = "INVITED" | "ACTIVE" | "SUSPENDED" | "DISABLED";
export type UserSortDirection = "asc" | "desc";

export interface UserRoleSummary {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
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
