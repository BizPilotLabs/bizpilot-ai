import { type AnchorHTMLAttributes, type ButtonHTMLAttributes, type ReactElement, type ReactNode } from "react";
import { cn } from "@/utils";

export interface DropdownProps {
  trigger: ReactNode;
  children: ReactNode;
  align?: "left" | "right";
  className?: string;
}

export function Dropdown({ trigger, children, align = "left", className }: DropdownProps): ReactElement {
  return (
    <details className="group relative inline-block">
      <summary className="list-none [&::-webkit-details-marker]:hidden">{trigger}</summary>
      <div role="menu" className={cn("absolute z-50 mt-2 min-w-48 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg", align === "right" ? "right-0" : "left-0", className)}>
        {children}
      </div>
    </details>
  );
}

export function DropdownButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>): ReactElement {
  return <button type="button" role="menuitem" className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted", className)} {...props} />;
}

export function DropdownLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>): ReactElement {
  return <a role="menuitem" className={cn("flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors hover:bg-muted focus-visible:bg-muted", className)} {...props} />;
}

