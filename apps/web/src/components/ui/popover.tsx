import { type ReactElement, type ReactNode } from "react";
import { cn } from "@/utils";

export interface PopoverProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function Popover({ trigger, children, align = "left", className }: PopoverProps): ReactElement {
  return (
    <details className="group relative inline-block">
      <summary className="list-none [&::-webkit-details-marker]:hidden">{trigger}</summary>
      <div className={cn("absolute z-50 mt-2 w-72 rounded-xl border border-border bg-popover p-4 text-popover-foreground shadow-lg", align === "right" ? "right-0" : "left-0", className)}>
        {children}
      </div>
    </details>
  );
}

