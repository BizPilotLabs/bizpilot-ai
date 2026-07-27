import { useEffect, type ReactElement } from "react";
import { Alert, Button, Modal } from "@/components/ui";
import { useToast } from "@/hooks";
import { getUserErrorMessage, useDeleteUser } from "../hooks";
import type { UserProfile } from "../types";

export interface DeleteUserDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getDisplayName = (user: UserProfile): string => `${user.firstName} ${user.lastName}`.trim() || user.email;

export function DeleteUserDialog({ user, open, onOpenChange }: DeleteUserDialogProps): ReactElement {
  const deleteUser = useDeleteUser();
  const { addToast } = useToast();

  useEffect(() => {
    if (open) {
      deleteUser.reset();
    }
  }, [deleteUser, open]);

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!deleteUser.isPending) {
      onOpenChange(nextOpen);
    }
  };

  const handleDelete = async (): Promise<void> => {
    if (user === null) {
      return;
    }

    try {
      await deleteUser.mutateAsync(user.id);
      addToast({
        title: "User deleted",
        description: `${getDisplayName(user)} has been removed from the active user list.`,
        variant: "success"
      });
      onOpenChange(false);
    } catch (error) {
      addToast({
        title: "User was not deleted",
        description: getUserErrorMessage(error),
        variant: "danger"
      });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Delete User"
      footer={
        <>
          <Button disabled={deleteUser.isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            Cancel
          </Button>
          <Button isLoading={deleteUser.isPending} type="button" variant="danger" onClick={() => void handleDelete()}>
            Delete
          </Button>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">
          Are you sure you want to delete this user?
          <br />
          This action cannot be undone.
        </p>
        {deleteUser.isError ? (
          <Alert variant="danger" title="Unable to delete user">
            {getUserErrorMessage(deleteUser.error)}
          </Alert>
        ) : null}
      </div>
    </Modal>
  );
}
