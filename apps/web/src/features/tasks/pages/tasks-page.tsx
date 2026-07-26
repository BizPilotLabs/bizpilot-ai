import { useState, type ReactElement } from "react";
import { CreateTaskDialog, EditTaskDialog, TasksEmptyState, TasksErrorState, TasksList, TasksLoadingState, TasksPageHeader } from "../components";
import { getTaskErrorMessage, useTasks } from "../hooks";
import type { Task } from "../types";

export function TasksPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const tasksQuery = useTasks();
  const tasks = tasksQuery.data?.tasks ?? [];

  const handleEditTask = (task: Task): void => {
    setSelectedTask(task);
  };

  const handleEditDialogOpenChange = (open: boolean): void => {
    if (!open) {
      setSelectedTask(null);
    }
  };

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
      {tasksQuery.isSuccess && tasks.length > 0 ? <TasksList tasks={tasks} onEditTask={handleEditTask} /> : null}
      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditTaskDialog open={selectedTask !== null} task={selectedTask} onOpenChange={handleEditDialogOpenChange} />
    </div>
  );
}

