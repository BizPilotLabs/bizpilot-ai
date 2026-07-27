import { useQuery } from "@tanstack/react-query";
import { userService } from "../services";
import type { UserListQuery } from "../types";
import { userQueryKeys } from "./user-query-keys";

export function useUsers(query: UserListQuery = {}) {
  return useQuery({
    queryKey: userQueryKeys.list(query),
    queryFn: () => userService.getUsers(query),
    staleTime: 60_000
  });
}

export function useUser(userId: string | null) {
  return useQuery({
    queryKey: userId === null ? userQueryKeys.details() : userQueryKeys.detail(userId),
    queryFn: () => {
      if (userId === null) {
        throw new Error("User id is required.");
      }

      return userService.getUserById(userId);
    },
    enabled: userId !== null,
    staleTime: 60_000
  });
}

export function useRoles() {
  return useQuery({
    queryKey: userQueryKeys.roles(),
    queryFn: () => userService.getRoles(),
    staleTime: 120_000
  });
}

export function useUserRoles(userId: string | null) {
  return useQuery({
    queryKey: userId === null ? userQueryKeys.details() : userQueryKeys.userRoles(userId),
    queryFn: () => {
      if (userId === null) {
        throw new Error("User id is required.");
      }

      return userService.getUserRoles(userId);
    },
    enabled: userId !== null,
    staleTime: 60_000
  });
}
