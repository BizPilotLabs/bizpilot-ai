import { httpClient } from "@/services";
import type {
  ApiSuccessResponse,
  CreateRoleInput,
  PermissionsResponse,
  Role,
  RoleDeleteResponse,
  RoleResponse,
  RolesResponse,
  UpdateRoleInput
} from "../types";

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

const toRolePayload = (input: CreateRoleInput | UpdateRoleInput): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  return payload;
};

export const rbacService = {
  async getRoles(): Promise<Role[]> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<RolesResponse>>("/roles"));
    return result.roles;
  },

  async getRole(roleId: string): Promise<Role> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<RoleResponse>>(`/roles/${roleId}`));
    return result.role;
  },

  async createRole(input: CreateRoleInput): Promise<Role> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<RoleResponse>>("/roles", toRolePayload(input)));
    return result.role;
  },

  async updateRole(roleId: string, input: UpdateRoleInput): Promise<Role> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<RoleResponse>>(`/roles/${roleId}`, toRolePayload(input)));
    return result.role;
  },

  async deleteRole(roleId: string): Promise<RoleDeleteResponse> {
    return unwrap(await httpClient.delete<ApiSuccessResponse<RoleDeleteResponse>>(`/roles/${roleId}`));
  },

  async getPermissions(): Promise<PermissionsResponse> {
    return unwrap(await httpClient.get<ApiSuccessResponse<PermissionsResponse>>("/permissions"));
  },

  async updateRolePermissions(roleId: string, permissionIds: string[]): Promise<Role> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<RoleResponse>>(`/roles/${roleId}/permissions`, { permissionIds }));
    return result.role;
  }
};
