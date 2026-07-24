import { X } from "lucide-react";
import { useEffect, useRef, type ReactElement, type ReactNode } from "react";
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
}

const sideClass = { left: "mr-auto h-dvh max-h-none w-[min(92vw,28rem)]", right: "ml-auto h-dvh max-h-none w-[min(92vw,28rem)]", bottom: "mt-auto h-auto max-h-[85dvh] w-full max-w-none" } as const;

export function Drawer({ open, onOpenChange, title, description, side = "right", children, className }: DrawerProps): ReactElement {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog ref={dialogRef} onCancel={() => onOpenChange(false)} onClose={() => onOpenChange(false)} className={cn("border border-border bg-surface p-0 text-foreground shadow-xl backdrop:bg-background/70 backdrop:backdrop-blur-sm", sideClass[side], className)}>
      <div className="flex items-start justify-between gap-4 border-b border-border p-6">
        <div className="grid gap-1">
          <h2 className="text-lg font-semibold">{title}</h2>
          {description ? <p className="text-sm text-muted-foreground">{description}</p> : null}
        </div>
        <Button aria-label="Close drawer" size="icon" variant="ghost" onClick={() => onOpenChange(false)}><X aria-hidden="true" className="h-4 w-4" /></Button>
      </div>
      <div className="p-6">{children}</div>
    </dialog>
  );
}

