import type { ProjectListQuery } from "../types";

export const projectQueryKeys = {
  all: ["projects"] as const,
  lists: () => [...projectQueryKeys.all, "list"] as const,
  list: (query: ProjectListQuery = {}) => [...projectQueryKeys.lists(), query] as const,
  details: () => [...projectQueryKeys.all, "detail"] as const,
  detail: (projectId: string) => [...projectQueryKeys.details(), projectId] as const
};

