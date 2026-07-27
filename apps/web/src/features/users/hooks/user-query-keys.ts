import type { UserListQuery } from "../types";

export const userQueryKeys = {
  all: ["users"] as const,
  lists: () => [...userQueryKeys.all, "list"] as const,
  list: (query: UserListQuery = {}) => [...userQueryKeys.lists(), query] as const,
  details: () => [...userQueryKeys.all, "detail"] as const,
  detail: (userId: string) => [...userQueryKeys.details(), userId] as const,
  roles: () => [...userQueryKeys.all, "roles"] as const,
  userRoles: (userId: string) => [...userQueryKeys.detail(userId), "roles"] as const
};
