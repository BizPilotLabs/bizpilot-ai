import { useState, type ReactElement } from "react";
import { CreateTaskDialog, TasksEmptyState, TasksErrorState, TasksList, TasksLoadingState, TasksPageHeader } from "../components";
import { getTaskErrorMessage, useTasks } from "../hooks";

export function TasksPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const tasksQuery = useTasks();
  const tasks = tasksQuery.data?.tasks ?? [];

  return (
    <div className="grid gap-6">
      <TasksPageHeader onCreateTask={() => setCreateDialogOpen(true)} />
      {tasksQuery.isLoading ? <TasksLoadingState /> : null}
      {tasksQuery.isError ? (
        <TasksErrorState
          isRetrying={tasksQuery.isFetching}
          message={getTaskErrorMessage(tasksQuery.error)}
          onRetry={() => {
            void tasksQuery.refetch();
          }}
        />
      ) : null}
      {tasksQuery.isSuccess && tasks.length === 0 ? <TasksEmptyState /> : null}
      {tasksQuery.isSuccess && tasks.length > 0 ? <TasksList tasks={tasks} /> : null}
      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}

