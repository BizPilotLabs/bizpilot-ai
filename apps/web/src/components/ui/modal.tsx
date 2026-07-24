import { X } from "lucide-react";
import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
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
}

export function Modal({ open, onOpenChange, title, description, children, footer, className }: ModalProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} onCancel={() => onOpenChange(false)} onClose={() => onOpenChange(false)} className={cn("w-[min(92vw,32rem)] rounded-xl border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-background/70 backdrop:backdrop-blur-sm", className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button aria-label="Close modal" size="icon" variant="ghost" onClick={() => onOpenChange(false)}><X aria-hidden="true" className="h-4 w-4" /></Button>
      </div>
      <div className="p-6">{children}</div>
      {footer ? <div className="flex justify-end gap-3 border-t border-border p-6">{footer}</div> : null}
    </dialog>
  );
}

