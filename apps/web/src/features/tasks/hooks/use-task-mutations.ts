import { useMutation, useQueryClient, type QueryClient } from "@tanstack/react-query";
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

interface TaskSnapshotContext {
  previousDetail: Task | undefined;
  previousLists: readonly (readonly [readonly unknown[], TaskListResult | undefined])[];
}

const replaceTaskInList = (current: TaskListResult | undefined, task: Task): TaskListResult | undefined => {
  if (current === undefined) {
    return current;
  }

  return {
    ...current,
    tasks: current.tasks.map((currentTask) => (currentTask.id === task.id ? task : currentTask))
  };
};

const removeTaskFromList = (current: TaskListResult | undefined, taskId: string): TaskListResult | undefined => {
  if (current === undefined) {
    return current;
  }

  const taskExists = current.tasks.some((task) => task.id === taskId);
  if (!taskExists) {
    return current;
  }

  const nextTotal = Math.max(0, current.pagination.total - 1);
  const nextTotalPages = nextTotal === 0 ? 0 : Math.ceil(nextTotal / current.pagination.limit);

  return {
    ...current,
    tasks: current.tasks.filter((task) => task.id !== taskId),
    pagination: {
      ...current.pagination,
      total: nextTotal,
      totalPages: nextTotalPages
    }
  };
};
const updateTaskCaches = (queryClient: QueryClient, task: Task): void => {
  queryClient.setQueryData(taskQueryKeys.detail(task.id), task);
  queryClient.setQueriesData<TaskListResult>({ queryKey: taskQueryKeys.lists() }, (current) => replaceTaskInList(current, task));
  void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
};

const snapshotTaskCaches = (queryClient: QueryClient, taskId: string): TaskSnapshotContext => ({
  previousDetail: queryClient.getQueryData<Task>(taskQueryKeys.detail(taskId)),
  previousLists: queryClient.getQueriesData<TaskListResult>({ queryKey: taskQueryKeys.lists() })
});

const restoreTaskCaches = (queryClient: QueryClient, taskId: string, context: TaskSnapshotContext | undefined): void => {
  if (context === undefined) {
    return;
  }

  queryClient.setQueryData(taskQueryKeys.detail(taskId), context.previousDetail);

  for (const [queryKey, data] of context.previousLists) {
    queryClient.setQueryData(queryKey, data);
  }
};

const findTaskInCaches = (queryClient: QueryClient, taskId: string): Task | undefined => {
  const detail = queryClient.getQueryData<Task>(taskQueryKeys.detail(taskId));
  if (detail !== undefined) {
    return detail;
  }

  const lists = queryClient.getQueriesData<TaskListResult>({ queryKey: taskQueryKeys.lists() });
  for (const [, list] of lists) {
    const task = list?.tasks.find((currentTask) => currentTask.id === taskId);
    if (task !== undefined) {
      return task;
    }
  }

  return undefined;
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
    onMutate: async (taskId) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });
      const snapshot = snapshotTaskCaches(queryClient, taskId);

      queryClient.removeQueries({ queryKey: taskQueryKeys.detail(taskId) });
      queryClient.setQueriesData<TaskListResult>({ queryKey: taskQueryKeys.lists() }, (current) => removeTaskFromList(current, taskId));

      return snapshot;
    },
    onError: (_error, taskId, context) => {
      restoreTaskCaches(queryClient, taskId, context);
    },
    onSuccess: (_result, taskId) => {
      queryClient.removeQueries({ queryKey: taskQueryKeys.detail(taskId) });
    },
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });
}

export function useUpdateTaskStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, status }: UpdateTaskStatusVariables) => taskService.updateTaskStatus(taskId, status),
    onMutate: async ({ taskId, status }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });
      const snapshot = snapshotTaskCaches(queryClient, taskId);
      const currentTask = findTaskInCaches(queryClient, taskId);

      if (currentTask !== undefined) {
        updateTaskCaches(queryClient, {
          ...currentTask,
          status,
          updatedAt: new Date().toISOString()
        });
      }

      return snapshot;
    },
    onError: (_error, variables, context) => {
      restoreTaskCaches(queryClient, variables.taskId, context);
    },
    onSuccess: (task) => updateTaskCaches(queryClient, task),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });
}

export function useUpdateTaskAssignee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ taskId, assigneeId }: UpdateTaskAssigneeVariables) => taskService.updateTaskAssignee(taskId, assigneeId),
    onMutate: async ({ taskId, assigneeId }) => {
      await queryClient.cancelQueries({ queryKey: taskQueryKeys.all });
      const snapshot = snapshotTaskCaches(queryClient, taskId);
      const currentTask = findTaskInCaches(queryClient, taskId);

      if (currentTask !== undefined) {
        updateTaskCaches(queryClient, {
          ...currentTask,
          assigneeId,
          updatedAt: new Date().toISOString()
        });
      }

      return snapshot;
    },
    onError: (_error, variables, context) => {
      restoreTaskCaches(queryClient, variables.taskId, context);
    },
    onSuccess: (task) => updateTaskCaches(queryClient, task),
    onSettled: () => {
      void queryClient.invalidateQueries({ queryKey: taskQueryKeys.lists() });
    }
  });
}

