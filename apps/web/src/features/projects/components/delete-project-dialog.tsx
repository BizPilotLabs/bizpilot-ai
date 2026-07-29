import { type ReactElement } from "react";
import { ConfirmationDialog } from "@/components/ui";
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
  const projectName = project?.name ?? "This project";

  return (
    <ConfirmationDialog
      open={open}
      onOpenChange={onOpenChange}
      title="Delete Project"
      description="This project will be soft deleted and hidden from active project lists."
      confirmLabel="Delete project"
      error={error}
      errorTitle="Unable to delete project"
      isPending={isDeleting}
      onConfirm={onConfirm}
    >
      <p>{projectName} will be removed from active project lists. Related tasks remain in the database under the existing soft-delete policy.</p>
    </ConfirmationDialog>
  );
}
