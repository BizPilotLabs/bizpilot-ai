import { useEffect, type ReactElement } from "react";
import { Alert, Button, Modal } from "@/components/ui";
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

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!deleteTask.isPending) {
      onOpenChange(nextOpen);
    }
  };

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
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Delete Task"
      footer={
        <>
          <Button disabled={deleteTask.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button isLoading={deleteTask.isPending} type="button" variant="danger" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Are you sure you want to delete this task?
          <br />
          This action cannot be undone.
        </p>
        {deleteTask.isError ? (
          <Alert variant="danger" title="Unable to delete task">
            {getTaskErrorMessage(deleteTask.error)}
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
