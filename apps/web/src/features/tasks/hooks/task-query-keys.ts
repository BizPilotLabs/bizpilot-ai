import type { TaskListQuery } from "../types";

export const taskQueryKeys = {
  all: ["tasks"] as const,
  lists: () => [...taskQueryKeys.all, "list"] as const,
  list: (query: TaskListQuery = {}) => [...taskQueryKeys.lists(), query] as const,
  details: () => [...taskQueryKeys.all, "detail"] as const,
  detail: (taskId: string) => [...taskQueryKeys.details(), taskId] as const
};

