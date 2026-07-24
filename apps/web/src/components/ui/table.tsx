import { type HTMLAttributes, type ReactElement, type ThHTMLAttributes, type TdHTMLAttributes } from "react";
import { cn } from "@/utils";

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>): ReactElement {
  return <div className="w-full overflow-auto rounded-xl border border-border"><table className={cn("w-full caption-bottom text-sm", className)} {...props} /></div>;
}

export function TableHeader({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>): ReactElement {
  return <thead className={cn("bg-muted/60", className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>): ReactElement {
  return <tbody className={cn("[&_tr:last-child]:border-0", className)} {...props} />;
}

export function TableRow({ className, ...props }: HTMLAttributes<HTMLTableRowElement>): ReactElement {
  return <tr className={cn("border-b border-border transition-colors hover:bg-muted/50", className)} {...props} />;
}

export function TableHead({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>): ReactElement {
  return <th className={cn("h-11 px-4 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground", className)} {...props} />;
}

export function TableCell({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>): ReactElement {
  return <td className={cn("px-4 py-3 align-middle text-foreground", className)} {...props} />;
}

