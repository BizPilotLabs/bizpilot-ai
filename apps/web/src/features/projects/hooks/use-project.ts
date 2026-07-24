import { useQuery } from "@tanstack/react-query";
import { projectService } from "../services";
import { projectQueryKeys } from "./project-query-keys";

export function useProject(projectId: string | undefined) {
  return useQuery({
    queryKey: projectId ? projectQueryKeys.detail(projectId) : projectQueryKeys.detail(""),
    queryFn: () => projectService.getProjectById(projectId ?? ""),
    enabled: projectId !== undefined && projectId.length > 0,
    staleTime: 30_000
  });
}

