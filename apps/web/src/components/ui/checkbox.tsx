import { Check } from "lucide-react";
import { forwardRef, useId, type InputHTMLAttributes } from "react";
import { cn } from "@/utils";

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, "type"> {
  label?: string | undefined;
  error?: string | undefined;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(({ className, label, error, id, ...props }, ref) => {
  const generatedId = useId();
  const checkboxId = id ?? generatedId;

  return (
    <div className="grid gap-2">
      <label className="flex items-center gap-3 text-sm text-foreground" htmlFor={checkboxId}>
        <span className="relative inline-flex h-4 w-4 shrink-0">
          <input ref={ref} id={checkboxId} type="checkbox" aria-invalid={Boolean(error)} className={cn("peer h-4 w-4 appearance-none rounded-sm border border-input bg-surface transition-colors checked:border-primary checked:bg-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", className)} {...props} />
          <Check aria-hidden="true" className="pointer-events-none absolute left-0 top-0 hidden h-4 w-4 p-0.5 text-primary-foreground peer-checked:block" />
        </span>
        {label ? <span>{label}</span> : null}
      </label>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </div>
  );
});

Checkbox.displayName = "Checkbox";

