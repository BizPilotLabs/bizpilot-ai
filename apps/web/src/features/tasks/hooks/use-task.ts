import { useQuery } from "@tanstack/react-query";
import { taskService } from "../services";
import { taskQueryKeys } from "./task-query-keys";

export function useTask(taskId: string | undefined) {
  return useQuery({
    queryKey: taskId ? taskQueryKeys.detail(taskId) : taskQueryKeys.detail(""),
    queryFn: () => taskService.getTaskById(taskId ?? ""),
    enabled: taskId !== undefined && taskId.length > 0,
    staleTime: 30_000
  });
}

