import { useMutation, useQueryClient } from "@tanstack/react-query";
import { taskService } from "../services";
import type {
  CreateTaskInput,
  Task,
  TaskListResult,
  UpdateTaskAssigneeVariables,
  UpdateTaskStatusVariables,
  UpdateTaskVariables
} from "../types";
import { taskQueryKeys } from "./task-query-keys";

const replaceTaskInList = (current: TaskListResult | undefined, task: Task): TaskListResult | undefined => {
  if (current === undefined) {
    return current;
  }

  return {
    ...current,
    tasks: current.tasks.map((currentTask) => (currentTask.id === task.id ? task : currentTask))
  };
};

const updateTaskCaches = (queryClient: ReturnType<typeof useQueryClient>, task: Task): void => {
  queryClient.setQueryData(taskQueryKeys.detail(task.id), task);
  queryClient.setQueriesData<TaskListResult>({ queryKey: taskQueryKeys.lists() }, (current) => replaceTaskInList(current, task));
  void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
};

export function useCreateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTaskInput) => taskService.createTask(input),
    onSuccess: (task) => {
      queryClient.setQueryData(taskQueryKeys.detail(task.id), task);
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });
}

export function useUpdateTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, data }: UpdateTaskVariables) => taskService.updateTask(taskId, data),
    onSuccess: (task) => updateTaskCaches(queryClient, task)
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (taskId: string) => taskService.deleteTask(taskId),
    onSuccess: (_result, taskId) => {
      queryClient.removeQueries({ queryKey: taskQueryKeys.detail(taskId) });
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: UpdateTaskStatusVariables) => taskService.updateTaskStatus(taskId, status),
    onSuccess: (task) => updateTaskCaches(queryClient, task)
  });
}

export function useUpdateTaskAssignee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, assigneeId }: UpdateTaskAssigneeVariables) => taskService.updateTaskAssignee(taskId, assigneeId),
    onSuccess: (task) => updateTaskCaches(queryClient, task)
  });
}

