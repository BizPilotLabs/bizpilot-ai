import { type ReactElement, type ReactNode, useRef } from "react";
import { Alert } from "./alert";
import { Button } from "./button";
import { Modal } from "./modal";

export interface ConfirmationDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel: string;
  onConfirm: () => void;
  onOpenChange: (open: boolean) => void;
  cancelLabel?: string;
  children?: ReactNode;
  error?: string | null;
  errorTitle?: string;
  isPending?: boolean;
  variant?: "danger" | "warning" | "primary";
}

const confirmVariant = {
  danger: "danger",
  warning: "warning",
  primary: "primary"
} as const;

export function ConfirmationDialog({
  open,
  title,
  description,
  confirmLabel,
  onConfirm,
  onOpenChange,
  cancelLabel = "Cancel",
  children,
  error,
  errorTitle = "Action failed",
  isPending = false,
  variant = "danger"
}: ConfirmationDialogProps): ReactElement {
  const cancelButtonRef = useRef<HTMLButtonElement>(null);

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!isPending) {
      onOpenChange(nextOpen);
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title={title}
      {...(description === undefined ? {} : { description })}
      initialFocusRef={cancelButtonRef}
      footer={
        <>
          <Button ref={cancelButtonRef} disabled={isPending} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
            {cancelLabel}
          </Button>
          <Button isLoading={isPending} type="button" variant={confirmVariant[variant]} onClick={onConfirm}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 text-sm leading-6 text-muted-foreground">
        {children}
        {error ? <Alert variant="danger" title={errorTitle}>{error}</Alert> : null}
      </div>
    </Modal>
  );
}
