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
      <div role="menu" className={cn("absolute z-50 mt-2 min-w-52 rounded-2xl border border-border/70 bg-popover/95 p-1.5 text-popover-foreground shadow-[0_18px_60px_hsl(var(--shadow-color)/0.18)] backdrop-blur-xl", align === "right" ? "right-0" : "left-0", className)}>
        {children}
      </div>
    </details>
  );
}

export function DropdownButton({ className, ...props }: ButtonHTMLAttributes<HTMLButtonElement>): ReactElement {
  return <button type="button" role="menuitem" className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm transition-colors hover:bg-muted/80 focus-visible:bg-muted", className)} {...props} />;
}

export function DropdownLink({ className, ...props }: AnchorHTMLAttributes<HTMLAnchorElement>): ReactElement {
  return <a role="menuitem" className={cn("flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors hover:bg-muted/80 focus-visible:bg-muted", className)} {...props} />;
}
