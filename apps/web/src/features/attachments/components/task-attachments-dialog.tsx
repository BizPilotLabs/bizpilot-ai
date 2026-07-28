import { Download, FileText, Paperclip, Trash2, Upload } from "lucide-react";
import { useState, type ChangeEvent, type ReactElement } from "react";
import { Alert, Badge, Button, Modal, Skeleton } from "@/components/ui";
import { useToast } from "@/hooks";
import { useAuthStore } from "@/store";
import { getAttachmentErrorMessage, useDeleteAttachment, useDownloadAttachment, useTaskAttachments, useUploadTaskAttachment } from "../hooks";
import type { Attachment } from "../types";
import { formatAttachmentDate, formatFileSize, validateAttachmentFile } from "../utils";

export interface TaskAttachmentsDialogProps {
  open: boolean;
  taskId: string | null;
  taskTitle: string;
  onOpenChange: (open: boolean) => void;
}

const hasElevatedRole = (roleNames: string[]): boolean => roleNames.includes("Owner") || roleNames.includes("Admin");
const hasPermission = (permissionKeys: string[], permissionKey: string): boolean => permissionKeys.includes(permissionKey);

function AttachmentRow({ attachment, canDelete, onDelete, onDownload }: { attachment: Attachment; canDelete: boolean; onDelete: (attachment: Attachment) => void; onDownload: (attachment: Attachment) => void }): ReactElement {
  return (
    <li className="flex items-center justify-between gap-3 rounded-2xl border border-border/60 bg-background/45 p-3">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-primary">
          <FileText aria-hidden="true" className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground" title={attachment.originalName}>{attachment.originalName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)} · {formatAttachmentDate(attachment.createdAt)}</p>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <Button aria-label={`Download ${attachment.originalName}`} size="icon" variant="ghost" onClick={() => onDownload(attachment)}>
          <Download aria-hidden="true" className="h-4 w-4" />
        </Button>
        {canDelete ? (
          <Button aria-label={`Delete ${attachment.originalName}`} size="icon" variant="ghost" onClick={() => onDelete(attachment)}>
            <Trash2 aria-hidden="true" className="h-4 w-4 text-danger" />
          </Button>
        ) : null}
      </div>
    </li>
  );
}

export function TaskAttachmentsDialog({ open, taskId, taskTitle, onOpenChange }: TaskAttachmentsDialogProps): ReactElement {
  const [fileError, setFileError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const roleNames = roles.map((role) => role.name);
  const permissionKeys = permissions.map((permission) => permission.key);
  const elevated = hasElevatedRole(roleNames);
  const canUpload = elevated || hasPermission(permissionKeys, "attachments.create");
  const canDelete = elevated || hasPermission(permissionKeys, "attachments.delete");
  const attachmentsQuery = useTaskAttachments(taskId, { limit: 20, sort: "desc" });
  const uploadMutation = useUploadTaskAttachment();
  const downloadMutation = useDownloadAttachment();
  const deleteMutation = useDeleteAttachment(taskId ?? "");
  const { addToast } = useToast();
  const attachments = attachmentsQuery.data?.attachments ?? [];

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setFileError(null);

    if (file === null || taskId === null) {
      return;
    }

    const validationError = validateAttachmentFile(file);
    if (validationError !== null) {
      setFileError(validationError);
      return;
    }

    setProgress(0);
    uploadMutation.mutate(
      { taskId, file, onProgress: setProgress },
      {
        onSuccess: () => {
          setProgress(null);
          addToast({ title: "Attachment uploaded", description: `${file.name} is now attached to the task.`, variant: "success" });
        },
        onError: (error) => {
          setProgress(null);
          setFileError(getAttachmentErrorMessage(error));
        }
      }
    );
  };

  const handleDownload = (attachment: Attachment): void => {
    downloadMutation.mutate(attachment.id, {
      onSuccess: (download) => {
        window.location.assign(download.downloadUrl);
      },
      onError: (error) => {
        addToast({ title: "Download unavailable", description: getAttachmentErrorMessage(error), variant: "danger" });
      }
    });
  };

  const handleDelete = (attachment: Attachment): void => {
    deleteMutation.mutate(attachment.id, {
      onSuccess: () => {
        addToast({ title: "Attachment deleted", description: `${attachment.originalName} was removed.`, variant: "success" });
      },
      onError: (error) => {
        addToast({ title: "Attachment was not deleted", description: getAttachmentErrorMessage(error), variant: "danger" });
      }
    });
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Task attachments" description={taskTitle}>
      <div className="grid gap-5">
        {canUpload ? (
          <div className="grid gap-3 rounded-2xl border border-dashed border-border bg-background/45 p-4">
            <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-within:ring-2 focus-within:ring-ring">
              <Upload aria-hidden="true" className="h-4 w-4" />
              Select file
              <input className="sr-only" type="file" onChange={handleFileChange} disabled={uploadMutation.isPending} />
            </label>
            <p className="text-xs leading-5 text-muted-foreground">PDF, Office documents, plain text, PNG, JPG, or JPEG up to 25 MB.</p>
            {progress !== null ? (
              <div className="grid gap-2">
                <div className="h-2 overflow-hidden rounded-full bg-muted">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-muted-foreground">Uploading {progress}%</p>
              </div>
            ) : null}
            {fileError ? <Alert variant="danger" title="Upload failed">{fileError}</Alert> : null}
          </div>
        ) : (
          <Alert variant="warning" title="Read-only attachments">You can view attachments, but upload access requires attachment create permission.</Alert>
        )}

        {attachmentsQuery.isLoading ? (
          <div className="grid gap-3">
            <Skeleton className="h-16 rounded-2xl" />
            <Skeleton className="h-16 rounded-2xl" />
          </div>
        ) : null}

        {attachmentsQuery.isError ? (
          <Alert variant="danger" title="Unable to load attachments">{getAttachmentErrorMessage(attachmentsQuery.error)}</Alert>
        ) : null}

        {attachmentsQuery.isSuccess && attachments.length === 0 ? (
          <div className="grid justify-items-center gap-2 rounded-2xl border border-border/60 bg-background/45 p-6 text-center">
            <Paperclip aria-hidden="true" className="h-5 w-5 text-muted-foreground" />
            <p className="text-sm font-medium">No attachments yet</p>
            <p className="text-xs text-muted-foreground">Files attached to this task will appear here.</p>
          </div>
        ) : null}

        {attachmentsQuery.isSuccess && attachments.length > 0 ? (
          <div className="grid gap-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">Files</p>
              <Badge variant="neutral">{attachments.length}</Badge>
            </div>
            <ul className="grid gap-2">
              {attachments.map((attachment) => <AttachmentRow key={attachment.id} attachment={attachment} canDelete={canDelete} onDelete={handleDelete} onDownload={handleDownload} />)}
            </ul>
          </div>
        ) : null}
      </div>
    </Modal>
  );
}
