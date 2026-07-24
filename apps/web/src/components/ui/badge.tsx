import { cva } from "class-variance-authority";
import { type HTMLAttributes, type ReactElement } from "react";
import { cn } from "@/utils";

const badgeVariants = cva("inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium", {
  variants: {
    variant: {
      neutral: "border-border bg-muted text-muted-foreground",
      primary: "border-primary/20 bg-primary/10 text-primary",
      secondary: "border-secondary/20 bg-secondary/10 text-secondary",
      success: "border-success/20 bg-success/10 text-success",
      warning: "border-warning/20 bg-warning/10 text-warning",
      danger: "border-danger/20 bg-danger/10 text-danger",
      accent: "border-accent/20 bg-accent/10 text-accent"
    }
  },
  defaultVariants: { variant: "neutral" }
});

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: "neutral" | "primary" | "secondary" | "success" | "warning" | "danger" | "accent";
}

export function Badge({ className, variant, ...props }: BadgeProps): ReactElement {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

