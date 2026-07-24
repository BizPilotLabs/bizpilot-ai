import { useId, type ReactElement, type ReactNode } from "react";
import { cn } from "@/utils";

export interface TooltipProps {
  content: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Tooltip({ content, children, className }: TooltipProps): ReactElement {
  const id = useId();

  return (
    <span className="group relative inline-flex" aria-describedby={id}>
      {children}
      <span id={id} role="tooltip" className={cn("pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 hidden -translate-x-1/2 whitespace-nowrap rounded-md border border-border bg-popover px-2.5 py-1.5 text-xs text-popover-foreground shadow-md group-focus-within:block group-hover:block", className)}>
        {content}
      </span>
    </span>
  );
}

