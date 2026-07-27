export const rbacQueryKeys = {
  all: ["rbac"] as const,
  roles: () => [...rbacQueryKeys.all, "roles"] as const,
  role: (roleId: string) => [...rbacQueryKeys.roles(), roleId] as const,
  permissions: () => [...rbacQueryKeys.all, "permissions"] as const
};
