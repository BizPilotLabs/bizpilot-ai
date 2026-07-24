import { type ReactElement } from "react";
import { TasksEmptyState, TasksErrorState, TasksList, TasksLoadingState } from "../components";
import { getTaskErrorMessage, useTasks } from "../hooks";

export function TasksPage(): ReactElement {
  const tasksQuery = useTasks();

  if (tasksQuery.isLoading) {
    return <TasksLoadingState />;
  }

  if (tasksQuery.isError) {
    return (
      <TasksErrorState
        isRetrying={tasksQuery.isFetching}
        message={getTaskErrorMessage(tasksQuery.error)}
        onRetry={() => {
          void tasksQuery.refetch();
        }}
      />
    );
  }

  const tasks = tasksQuery.data?.tasks ?? [];

  if (tasks.length === 0) {
    return <TasksEmptyState />;
  }

  return <TasksList tasks={tasks} />;
}

