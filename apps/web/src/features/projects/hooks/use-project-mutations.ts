import { useMutation, useQueryClient } from "@tanstack/react-query";
import { projectService } from "../services";
import type { CreateProjectInput, Project, UpdateProjectVariables } from "../types";
import { projectQueryKeys } from "./project-query-keys";

export function useCreateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateProjectInput) => projectService.createProject(input),
    onSuccess: (project) => {
      queryClient.setQueryData(projectQueryKeys.detail(project.id), project);
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    }
  });
}

export function useUpdateProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }: UpdateProjectVariables) => projectService.updateProject(projectId, data),
    onSuccess: (project: Project) => {
      queryClient.setQueryData(projectQueryKeys.detail(project.id), project);
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    }
  });
}

export function useDeleteProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (projectId: string) => projectService.deleteProject(projectId),
    onSuccess: (_result, projectId) => {
      queryClient.removeQueries({ queryKey: projectQueryKeys.detail(projectId) });
      void queryClient.invalidateQueries({ queryKey: projectQueryKeys.lists() });
    }
  });
}

