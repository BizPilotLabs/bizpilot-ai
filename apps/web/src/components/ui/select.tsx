import { forwardRef, useId, type SelectHTMLAttributes } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/utils";

export interface SelectOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string | undefined;
  hint?: string | undefined;
  error?: string | undefined;
  options: SelectOption[];
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ className, label, hint, error, id, options, ...props }, ref) => {
  const generatedId = useId();
  const selectId = id ?? generatedId;
  const descriptionId = error ? `${selectId}-error` : hint ? `${selectId}-hint` : undefined;

  return (
    <div className="grid gap-2">
      {label ? <label className="text-sm font-medium text-foreground" htmlFor={selectId}>{label}</label> : null}
      <div className="relative">
        <select ref={ref} id={selectId} aria-invalid={Boolean(error)} aria-describedby={descriptionId} className={cn("h-10 w-full appearance-none rounded-lg border border-input bg-surface px-3 pr-10 text-sm text-foreground shadow-xs transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50", error && "border-danger focus-visible:ring-danger", className)} {...props}>
          {options.map((option) => <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>)}
        </select>
        <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      </div>
      {error ? <p id={descriptionId} className="text-sm text-danger">{error}</p> : null}
      {!error && hint ? <p id={descriptionId} className="text-sm text-muted-foreground">{hint}</p> : null}
    </div>
  );
});

Select.displayName = "Select";

