import { type ReactElement } from "react";
import { Button, Modal } from "@/components/ui";
import type { Project } from "../types";

export interface DeleteProjectDialogProps {
  error: string | null;
  isDeleting: boolean;
  open: boolean;
  project: Project | null;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
}

export function DeleteProjectDialog({ error, isDeleting, open, project, onConfirm, onOpenChange }: DeleteProjectDialogProps): ReactElement {
  return (
    <Modal
      open={open}
      onOpenChange={(nextOpen) => !isDeleting && onOpenChange(nextOpen)}
      title="Delete Project"
      description="Are you sure you want to delete this project? This action cannot be undone."
      footer={
        <>
          <Button disabled={isDeleting} type="button" variant="neutral" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button isLoading={isDeleting} type="button" variant="danger" onClick={onConfirm}>Delete project</Button>
        </>
      }
    >
      <div className="grid gap-3 text-sm text-muted-foreground">
        <p>{project === null ? "This project" : project.name} will be soft deleted and hidden from active project lists.</p>
        {error ? <div className="rounded-lg border border-danger/20 bg-danger/10 px-3 py-2 text-sm text-danger" role="alert">{error}</div> : null}
      </div>
    </Modal>
  );
}