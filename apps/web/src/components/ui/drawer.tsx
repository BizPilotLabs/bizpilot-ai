import { X } from "lucide-react";
import { useEffect, useId, useRef, type ReactElement, type ReactNode, type RefObject } from "react";
import { Button } from "./button";
import { cn } from "@/utils";

export interface DrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  side?: "left" | "right" | "bottom";
  children: ReactNode;
  className?: string;
  closeLabel?: string;
  initialFocusRef?: RefObject<HTMLElement>;
}

const sideClass = { left: "mr-auto h-dvh max-h-none w-[min(92vw,28rem)]", right: "ml-auto h-dvh max-h-none w-[min(92vw,28rem)]", bottom: "mt-auto h-auto max-h-[85dvh] w-full max-w-none" } as const;

export function Drawer({ open, onOpenChange, title, description, side = "right", children, className, closeLabel = "Close drawer", initialFocusRef }: DrawerProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);
  const generatedId = useId();
  const titleId = `${generatedId}-title`;
  const descriptionId = description !== undefined && description.trim().length > 0 ? `${generatedId}-description` : undefined;

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
    }
  }, [initialFocusRef, open]);

  const handleClose = (): void => {
    onOpenChange(false);
    requestAnimationFrame(() => previousFocusRef.current?.focus());
  };

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      onCancel={() => handleClose()}
      onClose={() => handleClose()}
      className={cn("border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-background/70 backdrop:backdrop-blur-sm", sideClass[side], className)}
    >
      <div className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div className="grid gap-1">
          <h2 id={titleId} className="text-lg font-semibold">{title}</h2>
          {descriptionId ? <p id={descriptionId} className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button ref={closeButtonRef} aria-label={closeLabel} size="icon" variant="ghost" onClick={() => handleClose()}><X aria-hidden="true" className="h-4 w-4" /></Button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}
