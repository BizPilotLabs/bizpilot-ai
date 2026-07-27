import { httpClient } from "@/services";
import type {
  ApiSuccessResponse,
  CreateUserInput,
  RoleListResponse,
  UpdateUserInput,
  UserDeleteResponse,
  UserListQuery,
  UserListResult,
  UserMutationResponse,
  UserProfile,
  UserRolesResponse
} from "../types";

const toQueryParams = (query: UserListQuery = {}): URLSearchParams => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.search !== undefined) params.set("search", query.search);
  if (query.sort !== undefined) params.set("sort", query.sort);

  return params;
};

const toUserPayload = (payload: UpdateUserInput): Record<string, unknown> => {
  const nextPayload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      nextPayload[key] = value;
    }
  }

  return nextPayload;
};

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

export const userService = {
  async getUsers(query: UserListQuery = {}): Promise<UserListResult> {
    const params = toQueryParams(query);
    return unwrap(await httpClient.get<ApiSuccessResponse<UserListResult>>("/users", { params }));
  },

  async getUserById(userId: string): Promise<UserProfile> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<UserMutationResponse>>(`/users/${userId}`));
    return result.user;
  },

  async createUser(input: CreateUserInput): Promise<UserProfile> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<UserMutationResponse>>("/users", input));
    return result.user;
  },

  async updateUser(userId: string, input: UpdateUserInput): Promise<UserProfile> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<UserMutationResponse>>(`/users/${userId}`, toUserPayload(input)));
    return result.user;
  },

  async deleteUser(userId: string): Promise<UserDeleteResponse> {
    return unwrap(await httpClient.delete<ApiSuccessResponse<UserDeleteResponse>>(`/users/${userId}`));
  },

  async getRoles(): Promise<RoleListResponse> {
    return unwrap(await httpClient.get<ApiSuccessResponse<RoleListResponse>>("/roles"));
  },

  async getUserRoles(userId: string): Promise<UserRolesResponse> {
    return unwrap(await httpClient.get<ApiSuccessResponse<UserRolesResponse>>(`/users/${userId}/roles`));
  },

  async updateUserRoles(userId: string, roleIds: string[]): Promise<UserRolesResponse> {
    return unwrap(await httpClient.patch<ApiSuccessResponse<UserRolesResponse>>(`/users/${userId}/roles`, { roleIds }));
  }
};
