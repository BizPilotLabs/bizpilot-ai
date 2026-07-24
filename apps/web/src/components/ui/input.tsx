import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  hint?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, hint, error, id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="grid gap-2">
      {label ? <label className="text-sm font-medium text-foreground" htmlFor={inputId}>{label}</label> : null}
      <input ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-describedby={descriptionId} className={cn("h-10 rounded-lg border border-input bg-surface px-3 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", error && "border-danger focus-visible:ring-danger", className)} {...props} />
      {error ? <p id={descriptionId} className="text-sm text-danger">{error}</p> : null}
      {!error && hint ? <p id={descriptionId} className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
});

Input.displayName = "Input";

