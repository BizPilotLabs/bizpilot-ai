import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactElement, type ReactNode, type RefObject } from "react";
import { Button } from "./button";
import { cn } from "@/utils";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  closeLabel?: string;
  initialFocusRef?: RefObject<HTMLElement | null>;
}

export function Modal({ open, onOpenChange, title, description, children, footer, className, closeLabel = "Close modal", initialFocusRef }: ModalProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = description !== undefined && description.trim().length > 0 ? `${generatedId}-description` : undefined;

  const restorePreviousFocus = (): void => {
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      previousFocusRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      requestAnimationFrame(() => {
        const focusTarget = initialFocusRef?.current ?? closeButtonRef.current;
        focusTarget?.focus();
      });
      return;
    }

    if (!open && dialog.open) {
      dialog.close();
      restorePreviousFocus();
    }
  }, [initialFocusRef, open]);

  const handleClose = (): void => {
    onOpenChange(false);
    restorePreviousFocus();
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={() => handleClose()}
      onClose={() => handleClose()}
      className={cn("w-[min(92vw,34rem)] overflow-hidden rounded-2xl border border-border/70 bg-surface/95 p-0 text-foreground shadow-[0_24px_80px_hsl(var(--shadow-color)/0.26)] backdrop:bg-background/70 backdrop:backdrop-blur-xl", className)}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border/70 bg-surface-raised/55 p-6">
        <div className="grid gap-1">
          <h2 id={titleId} className="text-lg font-semibold tracking-normal">{title}</h2>
          {descriptionId ? <p id={descriptionId} className="text-sm leading-6 text-muted-foreground">{description}</p> : null}
        </div>
        <Button ref={closeButtonRef} aria-label={closeLabel} size="icon" variant="ghost" onClick={() => handleClose()}><X aria-hidden="true" className="h-4 w-4" /></Button>
      </div>
      <div className="p-6">{children}</div>
      {footer ? <div className="flex justify-end gap-3 border-t border-border/70 bg-surface-raised/40 p-6">{footer}</div> : null}
    </dialog>
  );
}
