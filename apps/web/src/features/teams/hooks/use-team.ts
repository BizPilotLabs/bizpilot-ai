import { useQuery } from "@tanstack/react-query";
import { teamService } from "../services";
import { teamQueryKeys } from "./team-query-keys";

export function useTeam(teamId: string | null) {
  return useQuery({
    queryKey: teamQueryKeys.detail(teamId ?? ""),
    queryFn: () => teamService.getTeamById(teamId ?? ""),
    enabled: teamId !== null && teamId.length > 0,
    staleTime: 30_000
  });
}
