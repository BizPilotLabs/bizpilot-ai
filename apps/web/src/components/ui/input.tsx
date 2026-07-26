import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ className, label, hint, error, id, ...props }, ref) => {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const descriptionId = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="grid gap-2">
      {label ? <label className="text-sm font-medium text-foreground" htmlFor={inputId}>{label}</label> : null}
      <input ref={ref} id={inputId} aria-invalid={Boolean(error)} aria-describedby={descriptionId} className={cn("h-10 rounded-xl border border-input/80 bg-surface/80 px-3 text-sm text-foreground shadow-[0_1px_0_hsl(var(--foreground)/0.03)] transition-all placeholder:text-muted-foreground/80 hover:border-foreground/20 focus-visible:border-ring focus-visible:bg-surface focus-visible:ring-2 focus-visible:ring-ring/30 focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50", error && "border-danger focus-visible:ring-danger/30", className)} {...props} />
      {error ? <p id={descriptionId} className="text-sm text-danger">{error}</p> : null}
      {!error && hint ? <p id={descriptionId} className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
});

Input.displayName = "Input";
