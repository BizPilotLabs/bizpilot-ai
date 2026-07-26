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
