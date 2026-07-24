import { useQuery } from "@tanstack/react-query";
import { taskService } from "../services";
import type { TaskListQuery } from "../types";
import { taskQueryKeys } from "./task-query-keys";

export function useTasks(query: TaskListQuery = {}) {
  return useQuery({
    queryKey: taskQueryKeys.list(query),
    queryFn: () => taskService.getTasks(query),
    staleTime: 30_000
  });
}

