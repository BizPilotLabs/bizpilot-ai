import { useEffect, type ReactElement } from "react";
import { ConfirmationDialog } from "@/components/ui";
import { useToast } from "@/hooks";
import { getTaskErrorMessage, useDeleteTask } from "../hooks";
import type { Task } from "../types";

export interface DeleteTaskDialogProps {
  task: Task | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteTaskDialog({ task, open, onOpenChange }: DeleteTaskDialogProps): ReactElement {
  const deleteTask = useDeleteTask();
  const { addToast } = useToast();

  useEffect(() => {
    if (open) {
      deleteTask.reset();
    }
  }, [deleteTask, open]);

  const handleDelete = async (): Promise<void> => {
    if (task === null) {
      return;
    }

    try {
      await deleteTask.mutateAsync(task.id);
      addToast({
        title: "Task deleted",
        description: `${task.title} has been deleted.`,
        variant: "success"
      });
      onOpenChange(false);
    } catch (error) {
      addToast({
        title: "Task was not deleted",
        description: getTaskErrorMessage(error),
        variant: "danger"
      });
    }
  };

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Task"
      description="This task will be soft deleted and hidden from active task lists."
      confirmLabel="Delete task"
      error={deleteTask.isError ? getTaskErrorMessage(deleteTask.error) : null}
      errorTitle="Unable to delete task"
      isPending={deleteTask.isPending}
      onConfirm={() => void handleDelete()}
    >
      <p>{task === null ? "This task" : task.title} will be removed from active task lists. Comments and attachments remain under the existing soft-delete policy.</p>
    </ConfirmationDialog>
  );
}
