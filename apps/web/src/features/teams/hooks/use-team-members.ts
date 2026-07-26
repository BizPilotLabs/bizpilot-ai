import { useQuery } from "@tanstack/react-query";
import { teamService } from "../services";
import { teamQueryKeys } from "./team-query-keys";

export function useTeamMembers(teamId: string | null) {
  return useQuery({
    queryKey: teamQueryKeys.teamMembers(teamId ?? ""),
    queryFn: () => teamService.getTeamMembers(teamId ?? ""),
    enabled: teamId !== null && teamId.length > 0,
    staleTime: 30_000
  });
}
