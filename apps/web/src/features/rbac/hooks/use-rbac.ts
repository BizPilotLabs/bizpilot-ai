import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { userQueryKeys } from "@/features/users";
import { rbacService } from "../services";
import type { CreateRoleInput, Role, UpdateRolePermissionsVariables, UpdateRoleVariables } from "../types";
import { rbacQueryKeys } from "./rbac-query-keys";

const replaceRole = (roles: Role[] | undefined, role: Role): Role[] | undefined => {
  if (roles === undefined) {
    return roles;
  }

  return roles.map((currentRole) => (currentRole.id === role.id ? role : currentRole));
};

export function useRoles() {
  return useQuery({
    queryKey: rbacQueryKeys.roles(),
    queryFn: () => rbacService.getRoles(),
    staleTime: 60_000
  });
}

export function useRole(roleId: string | null) {
  return useQuery({
    queryKey: roleId === null ? rbacQueryKeys.roles() : rbacQueryKeys.role(roleId),
    queryFn: () => {
      if (roleId === null) {
        throw new Error("Role id is required.");
      }

      return rbacService.getRole(roleId);
    },
    enabled: roleId !== null,
    staleTime: 60_000
  });
}

export function usePermissions() {
  return useQuery({
    queryKey: rbacQueryKeys.permissions(),
    queryFn: () => rbacService.getPermissions(),
    staleTime: 120_000
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateRoleInput) => rbacService.createRole(input),
    onSuccess: (role) => {
      queryClient.setQueryData(rbacQueryKeys.role(role.id), role);
      void queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.roles() });
    }
  });
}

export function useUpdateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, data }: UpdateRoleVariables) => rbacService.updateRole(roleId, data),
    onSuccess: (role) => {
      queryClient.setQueryData(rbacQueryKeys.role(role.id), role);
      queryClient.setQueryData<Role[]>(rbacQueryKeys.roles(), (roles) => replaceRole(roles, role));
      void queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.roles() });
    }
  });
}

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (roleId: string) => rbacService.deleteRole(roleId),
    onSuccess: (_result, roleId) => {
      queryClient.removeQueries({ queryKey: rbacQueryKeys.role(roleId) });
      void queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.roles() });
    }
  });
}

export function useUpdateRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, permissionIds }: UpdateRolePermissionsVariables) => rbacService.updateRolePermissions(roleId, permissionIds),
    onSuccess: (role) => {
      queryClient.setQueryData(rbacQueryKeys.role(role.id), role);
      queryClient.setQueryData<Role[]>(rbacQueryKeys.roles(), (roles) => replaceRole(roles, role));
      void queryClient.invalidateQueries({ queryKey: rbacQueryKeys.roles() });
      void queryClient.invalidateQueries({ queryKey: userQueryKeys.roles() });
    }
  });
}
