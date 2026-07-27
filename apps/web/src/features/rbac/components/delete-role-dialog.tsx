import { useEffect, type ReactElement } from "react";
import { Alert, Button, Modal } from "@/components/ui";
import { useToast } from "@/hooks";
import { getRbacErrorMessage, useDeleteRole } from "../hooks";
import type { Role } from "../types";

export interface DeleteRoleDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function DeleteRoleDialog({ role, open, onOpenChange }: DeleteRoleDialogProps): ReactElement {
  const deleteRole = useDeleteRole();
  const { addToast } = useToast();

  useEffect(() => {
    if (open) deleteRole.reset();
  }, [deleteRole, open]);

  const handleDelete = async (): Promise<void> => {
    if (role === null) return;
    await deleteRole.mutateAsync(role.id);
    addToast({ title: "Role deleted", description: `${role.name} has been deleted.`, variant: "success" });
    onOpenChange(false);
  };

  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => !deleteRole.isPending && onOpenChange(nextOpen)}
      title="Delete Role"
      footer={
        <>
          <Button disabled={deleteRole.isPending} type="button" variant="neutral" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={role?.isSystem === true || (role?.userCount ?? 0) > 0} isLoading={deleteRole.isPending} type="button" variant="danger" onClick={() => void handleDelete()}>Delete role</Button>
        </>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm leading-6 text-muted-foreground">Are you sure you want to delete this role? This action cannot be undone.</p>
        {role?.isSystem ? <Alert variant="warning" title="System role">System roles cannot be deleted.</Alert> : null}
        {(role?.userCount ?? 0) > 0 ? <Alert variant="warning" title="Assigned role">This role is assigned to users and cannot be deleted until those assignments are removed.</Alert> : null}
        {deleteRole.isError ? <Alert variant="danger" title="Unable to delete role">{getRbacErrorMessage(deleteRole.error)}</Alert> : null}
      </div>
    </Modal>
  );
}
