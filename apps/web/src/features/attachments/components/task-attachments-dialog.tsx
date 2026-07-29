import { Copy, Download, Eye, FileSearch, FileText, Paperclip, RotateCcw, Trash2, Upload } from "lucide-react";
import { useState, type ChangeEvent, type ReactElement } from "react";
import { Alert, Badge, Button, ConfirmationDialog, Modal, Skeleton } from "@/components/ui";
import { useToast } from "@/hooks";
import { useAuthStore } from "@/store";
import { getAttachmentErrorMessage, useDeleteAttachment, useDownloadAttachment, useExtractedAttachmentText, useRequestAttachmentExtraction, useRetryAttachmentExtraction, useTaskAttachments, useUploadTaskAttachment } from "../hooks";
import type { Attachment, AttachmentExtractionStatus } from "../types";
import { formatAttachmentDate, formatFileSize, validateAttachmentFile } from "../utils";

export interface TaskAttachmentsDialogProps {
  open: boolean;
  taskId: string | null;
  taskTitle: string;
  onOpenChange: (open: boolean) => void;
}

const hasElevatedRole = (roleNames: string[]): boolean => roleNames.includes("Owner") || roleNames.includes("Admin");
const hasPermission = (permissionKeys: string[], permissionKey: string): boolean => permissionKeys.includes(permissionKey);

const extractionVariantMap: Record<AttachmentExtractionStatus, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  NOT_REQUESTED: "neutral",
  PENDING: "secondary",
  PROCESSING: "primary",
  COMPLETED: "success",
  FAILED: "danger",
  UNSUPPORTED: "warning"
};

const extractionLabelMap: Record<AttachmentExtractionStatus, string> = {
  NOT_REQUESTED: "Not extracted",
  PENDING: "Pending",
  PROCESSING: "Processing",
  COMPLETED: "Ready",
  FAILED: "Failed",
  UNSUPPORTED: "Unsupported"
};

const isExtractionBusy = (status: AttachmentExtractionStatus): boolean => status === "PENDING" || status === "PROCESSING";
const isExtractableMimeType = (mimeType: string): boolean => ["text/plain", "application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"].includes(mimeType);

function AttachmentRow({ attachment, canDelete, canExtract, isExtracting, isRetrying, onDelete, onDownload, onExtract, onRetry, onViewText }: { attachment: Attachment; canDelete: boolean; canExtract: boolean; isExtracting: boolean; isRetrying: boolean; onDelete: (attachment: Attachment) => void; onDownload: (attachment: Attachment) => void; onExtract: (attachment: Attachment) => void; onRetry: (attachment: Attachment) => void; onViewText: (attachment: Attachment) => void }): ReactElement {
  const canRequestExtraction = canExtract && isExtractableMimeType(attachment.mimeType) && attachment.extractionStatus === "NOT_REQUESTED";
  const canRetryExtraction = canExtract && (attachment.extractionStatus === "FAILED" || attachment.extractionStatus === "UNSUPPORTED");
  const canViewText = attachment.extractionStatus === "COMPLETED";

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border/60 bg-background/45 p-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-primary">
          <FileText aria-hidden="true" className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground" title={attachment.originalName}>{attachment.originalName}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.fileSize)} - {formatAttachmentDate(attachment.createdAt)}</p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <Badge variant={extractionVariantMap[attachment.extractionStatus] ?? "neutral"}>{extractionLabelMap[attachment.extractionStatus] ?? "Unknown"}</Badge>
            {attachment.extractionStatus === "COMPLETED" && attachment.extractedCharacterCount !== null ? <span className="text-xs text-muted-foreground">{attachment.extractedCharacterCount.toLocaleString()} chars{attachment.extractionTruncated ? " truncated" : ""}</span> : null}
            {attachment.extractionStatus === "FAILED" && attachment.extractionErrorCode !== null ? <span className="text-xs text-danger">{attachment.extractionErrorCode.replace(/_/gu, " ").toLowerCase()}</span> : null}
          </div>
        </div>
      </div>
      <div className="flex shrink-0 flex-wrap items-center justify-end gap-1">
        {canRequestExtraction ? (
          <Button aria-label={`Extract text from ${attachment.originalName}`} size="icon" variant="ghost" isLoading={isExtracting} disabled={isExtractionBusy(attachment.extractionStatus)} onClick={() => onExtract(attachment)}>
            <FileSearch aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : null}
        {canRetryExtraction ? (
          <Button aria-label={`Retry text extraction for ${attachment.originalName}`} size="icon" variant="ghost" isLoading={isRetrying} onClick={() => onRetry(attachment)}>
            <RotateCcw aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : null}
        {canViewText ? (
          <Button aria-label={`View extracted text for ${attachment.originalName}`} size="icon" variant="ghost" onClick={() => onViewText(attachment)}>
            <Eye aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : null}
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
  const [attachmentToDelete, setAttachmentToDelete] = useState<Attachment | null>(null);
  const [textAttachment, setTextAttachment] = useState<Attachment | null>(null);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const roleNames = roles.map((role) => role.name);
  const permissionKeys = permissions.map((permission) => permission.key);
  const elevated = hasElevatedRole(roleNames);
  const canUpload = elevated || hasPermission(permissionKeys, "attachments.create");
  const canDelete = elevated || hasPermission(permissionKeys, "attachments.delete");
  const canExtract = canUpload;
  const attachmentsQuery = useTaskAttachments(taskId, { limit: 20, sort: "desc" });
  const uploadMutation = useUploadTaskAttachment();
  const downloadMutation = useDownloadAttachment();
  const requestExtractionMutation = useRequestAttachmentExtraction(taskId ?? "");
  const retryExtractionMutation = useRetryAttachmentExtraction(taskId ?? "");
  const extractedTextQuery = useExtractedAttachmentText(textAttachment?.id ?? null, textAttachment !== null);
  const deleteMutation = useDeleteAttachment(taskId ?? "");
  const { addToast } = useToast();
  const attachments = attachmentsQuery.data?.attachments ?? [];

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>): void => {
    const file = event.target.files?.[0] ?? null;
    event.target.value = "";
    setFileError(null);

    if (file === null || taskId === null) return;

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
      onSuccess: (download) => window.location.assign(download.downloadUrl),
      onError: (error) => addToast({ title: "Download unavailable", description: getAttachmentErrorMessage(error), variant: "danger" })
    });
  };

  const handleRequestExtraction = (attachment: Attachment): void => {
    requestExtractionMutation.mutate(attachment.id, {
      onSuccess: () => addToast({ title: "Extraction queued", description: "Text extraction has started in the background.", variant: "success" }),
      onError: (error) => addToast({ title: "Extraction unavailable", description: getAttachmentErrorMessage(error), variant: "danger" })
    });
  };

  const handleRetryExtraction = (attachment: Attachment): void => {
    retryExtractionMutation.mutate(attachment.id, {
      onSuccess: () => addToast({ title: "Extraction retried", description: "Text extraction has been queued again.", variant: "success" }),
      onError: (error) => addToast({ title: "Retry unavailable", description: getAttachmentErrorMessage(error), variant: "danger" })
    });
  };

  const handleCopyText = (): void => {
    const text = extractedTextQuery.data?.text ?? "";
    if (text.length === 0) return;
    void navigator.clipboard.writeText(text).then(() => addToast({ title: "Text copied", description: "Extracted text was copied to the clipboard.", variant: "success" }));
  };

  const handleDelete = (): void => {
    if (attachmentToDelete === null) return;

    deleteMutation.mutate(attachmentToDelete.id, {
      onSuccess: () => {
        addToast({ title: "Attachment deleted", description: `${attachmentToDelete.originalName} was removed.`, variant: "success" });
        setAttachmentToDelete(null);
      },
      onError: (error) => addToast({ title: "Attachment was not deleted", description: getAttachmentErrorMessage(error), variant: "danger" })
    });
  };

  return (
    <>
      <Modal open={open} onOpenChange={onOpenChange} title="Task attachments" description={taskTitle}>
        <div className="grid gap-5">
          {canUpload ? (
            <div className="grid gap-3 rounded-2xl border border-dashed border-border bg-background/45 p-4">
              <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-xs transition hover:bg-primary/90 focus-within:ring-2 focus-within:ring-ring">
                <Upload aria-hidden="true" className="h-4 w-4" />
                Select file
                <input className="sr-only" type="file" onChange={handleFileChange} disabled={uploadMutation.isPending} />
              </label>
              <p className="text-xs leading-5 text-muted-foreground">PDF, Office documents, plain text, PNG, JPG, or JPEG up to 25 MB. Text extraction supports TXT, PDF, and DOCX only.</p>
              {progress !== null ? (
                <div className="grid gap-2">
                  <div className="h-2 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${progress}%` }} /></div>
                  <p className="text-xs text-muted-foreground">Uploading {progress}%</p>
                </div>
              ) : null}
              {fileError ? <Alert variant="danger" title="Upload failed">{fileError}</Alert> : null}
            </div>
          ) : (
            <Alert variant="warning" title="Read-only attachments">You can view attachments, but upload and extraction access require attachment create permission.</Alert>
          )}

          {attachmentsQuery.isLoading ? <div className="grid gap-3"><Skeleton className="h-20 rounded-2xl" /><Skeleton className="h-20 rounded-2xl" /></div> : null}
          {attachmentsQuery.isError ? <Alert variant="danger" title="Unable to load attachments">{getAttachmentErrorMessage(attachmentsQuery.error)}</Alert> : null}
          {attachmentsQuery.isSuccess && attachments.length === 0 ? <div className="grid justify-items-center gap-2 rounded-2xl border border-border/60 bg-background/45 p-6 text-center"><Paperclip aria-hidden="true" className="h-5 w-5 text-muted-foreground" /><p className="text-sm font-medium">No attachments yet</p><p className="text-xs text-muted-foreground">Files attached to this task will appear here.</p></div> : null}
          {attachmentsQuery.isSuccess && attachments.length > 0 ? (
            <div className="grid gap-3">
              <div className="flex items-center justify-between"><p className="text-sm font-medium">Files</p><Badge variant="neutral">{attachments.length}</Badge></div>
              <ul className="grid gap-2">
                {attachments.map((attachment) => (
                  <AttachmentRow
                    key={attachment.id}
                    attachment={attachment}
                    canDelete={canDelete}
                    canExtract={canExtract}
                    isExtracting={requestExtractionMutation.isPending && requestExtractionMutation.variables === attachment.id}
                    isRetrying={retryExtractionMutation.isPending && retryExtractionMutation.variables === attachment.id}
                    onDelete={setAttachmentToDelete}
                    onDownload={handleDownload}
                    onExtract={handleRequestExtraction}
                    onRetry={handleRetryExtraction}
                    onViewText={setTextAttachment}
                  />
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Modal>

      <Modal open={textAttachment !== null} onOpenChange={(nextOpen) => !nextOpen && setTextAttachment(null)} title="Extracted text" description={textAttachment?.originalName ?? "Attachment text"} className="w-[min(92vw,48rem)]" footer={<Button leftIcon={<Copy aria-hidden="true" className="h-4 w-4" />} variant="neutral" disabled={(extractedTextQuery.data?.text ?? "").length === 0} onClick={handleCopyText}>Copy text</Button>}>
        {extractedTextQuery.isLoading ? <Skeleton className="h-64 rounded-2xl" /> : null}
        {extractedTextQuery.isError ? <Alert variant="danger" title="Unable to load extracted text">{getAttachmentErrorMessage(extractedTextQuery.error)}</Alert> : null}
        {extractedTextQuery.isSuccess ? (
          <div className="grid gap-3">
            {extractedTextQuery.data.truncated ? <Alert variant="warning" title="Text was truncated">Only the stored extraction preview is shown.</Alert> : null}
            <pre className="max-h-[55vh] overflow-auto whitespace-pre-wrap break-words rounded-2xl border border-border/60 bg-background/70 p-4 text-sm leading-6 text-foreground">{extractedTextQuery.data.text ?? "No text was extracted from this attachment."}</pre>
          </div>
        ) : null}
      </Modal>

      <ConfirmationDialog open={attachmentToDelete !== null} onOpenChange={(nextOpen) => !nextOpen && setAttachmentToDelete(null)} title="Delete Attachment" description="This attachment will be soft deleted and its stored file will be removed from object storage." confirmLabel="Delete attachment" error={deleteMutation.isError ? getAttachmentErrorMessage(deleteMutation.error) : null} errorTitle="Unable to delete attachment" isPending={deleteMutation.isPending} onConfirm={handleDelete}>
        <p>{attachmentToDelete === null ? "This attachment" : attachmentToDelete.originalName} will be removed from this task.</p>
      </ConfirmationDialog>
    </>
  );
}
