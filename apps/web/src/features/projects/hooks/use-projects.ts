import { useQuery } from "@tanstack/react-query";
import { projectService } from "../services";
import type { ProjectListQuery } from "../types";
import { projectQueryKeys } from "./project-query-keys";

export function useProjects(query: ProjectListQuery = {}) {
  return useQuery({
    queryKey: projectQueryKeys.list(query),
    queryFn: () => projectService.getProjects(query),
    staleTime: 30_000
  });
}

