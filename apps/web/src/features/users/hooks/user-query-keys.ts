import type { UserListQuery } from "../types";

export const userQueryKeys = {
  all: ["users"] as const,
  lists: () => [...userQueryKeys.all, "list"] as const,
  list: (query: UserListQuery = {}) => [...userQueryKeys.lists(), query] as const
};
