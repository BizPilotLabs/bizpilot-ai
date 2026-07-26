import { useQuery } from "@tanstack/react-query";
import { teamService } from "../services";
import type { TeamListQuery } from "../types";
import { teamQueryKeys } from "./team-query-keys";

export function useTeams(query: TeamListQuery = {}) {
  return useQuery({
    queryKey: teamQueryKeys.list(query),
    queryFn: () => teamService.getTeams(query),
    staleTime: 30_000
  });
}
