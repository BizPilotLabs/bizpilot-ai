import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react";
import { type HTMLAttributes, type ReactElement, type ReactNode } from "react";
import { cn } from "@/utils";

export interface AlertProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "info" | "success" | "warning" | "danger";
  title?: string;
  children: ReactNode;
}

const styles = {
  info: "border-primary/20 bg-primary/10 text-primary",
  success: "border-success/20 bg-success/10 text-success",
  warning: "border-warning/20 bg-warning/10 text-warning",
  danger: "border-danger/20 bg-danger/10 text-danger"
} as const;

const icons = { info: Info, success: CheckCircle2, warning: TriangleAlert, danger: AlertCircle } as const;

export function Alert({ className, variant = "info", title, children, ...props }: AlertProps): ReactElement {
  const Icon = icons[variant];

  return (
    <div role="alert" className={cn("flex gap-3 rounded-xl border p-4", styles[variant], className)} {...props}>
      <Icon aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
      <div className="grid gap-1">
        {title ? <p className="font-medium">{title}</p> : null}
        <div className="text-sm">{children}</div>
      </div>
    </div>
  );
}

