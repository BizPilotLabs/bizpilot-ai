import { useState, type ReactElement } from "react";
import { TaskAttachmentsDialog } from "@/features/attachments";
import { useUsers } from "@/features/users";
import {
  CreateTaskDialog,
  DeleteTaskDialog,
  EditTaskDialog,
  TasksEmptyState,
  TasksErrorState,
  TasksList,
  TasksLoadingState,
  TasksPageHeader
} from "../components";
import { getTaskErrorMessage, useTasks } from "../hooks";
import type { Task } from "../types";

export function TasksPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [attachmentTask, setAttachmentTask] = useState<Task | null>(null);
  const tasksQuery = useTasks();
  const usersQuery = useUsers({ limit: 100 });
  const tasks = tasksQuery.data?.tasks ?? [];
  const users = usersQuery.data?.users ?? [];

  const handleEditTask = (task: Task): void => {
    setSelectedTask(task);
  };

  const handleDeleteTask = (task: Task): void => {
    setTaskToDelete(task);
  };

  const handleViewAttachments = (task: Task): void => {
    setAttachmentTask(task);
  };

  const handleEditDialogOpenChange = (open: boolean): void => {
    if (!open) {
      setSelectedTask(null);
    }
  };

  const handleDeleteDialogOpenChange = (open: boolean): void => {
    if (!open) {
      setTaskToDelete(null);
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
      {tasksQuery.isSuccess && tasks.length > 0 ? (
        <TasksList
          hasUsersError={usersQuery.isError}
          isLoadingUsers={usersQuery.isLoading}
          tasks={tasks}
          users={users}
          onDeleteTask={handleDeleteTask}
          onEditTask={handleEditTask}
          onViewAttachments={handleViewAttachments}
        />
      ) : null}
      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditTaskDialog open={selectedTask !== null} task={selectedTask} onOpenChange={handleEditDialogOpenChange} />
      <DeleteTaskDialog open={taskToDelete !== null} task={taskToDelete} onOpenChange={handleDeleteDialogOpenChange} />
      <TaskAttachmentsDialog open={attachmentTask !== null} taskId={attachmentTask?.id ?? null} taskTitle={attachmentTask?.title ?? ""} onOpenChange={(open) => !open && setAttachmentTask(null)} />
    </div>
  );
}

