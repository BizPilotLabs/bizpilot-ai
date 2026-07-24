import { type HTMLAttributes, type ReactElement } from "react";
import { cn } from "@/utils";

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>): ReactElement {
  return <div aria-hidden="true" className={cn("animate-pulse rounded-lg bg-muted", className)} {...props} />;
}

