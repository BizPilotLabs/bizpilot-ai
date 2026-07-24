import { forwardRef, useId, type TextareaHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(({ className, label, hint, error, id, ...props }, ref) => {
  const generatedId = useId();
  const textareaId = id ?? generatedId;
  const descriptionId = error ? `${textareaId}-error` : hint ? `${textareaId}-hint` : undefined;

  return (
    <div className="grid gap-2">
      {label ? <label className="text-sm font-medium text-foreground" htmlFor={textareaId}>{label}</label> : null}
      <textarea ref={ref} id={textareaId} aria-invalid={Boolean(error)} aria-describedby={descriptionId} className={cn("min-h-24 rounded-lg border border-input bg-surface px-3 py-2 text-sm text-foreground shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", error && "border-danger focus-visible:ring-danger", className)} {...props} />
      {error ? <p id={descriptionId} className="text-sm text-danger">{error}</p> : null}
      {!error && hint ? <p id={descriptionId} className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
});

Textarea.displayName = "Textarea";

