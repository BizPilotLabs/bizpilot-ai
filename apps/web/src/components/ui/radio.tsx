import { type ReactElement } from "react";
import { cn } from "@/utils";

export interface RadioOption {
  label: string;
  value: string;
  disabled?: boolean;
}

export interface RadioGroupProps {
  name: string;
  options: RadioOption[];
  value?: string;
  legend?: string;
  onValueChange?: (value: string) => void;
  className?: string;
}

export function RadioGroup({ name, options, value, legend, onValueChange, className }: RadioGroupProps): ReactElement {
  return (
    <fieldset className={cn("grid gap-3", className)}>
      {legend ? <legend className="mb-1 text-sm font-medium text-foreground">{legend}</legend> : null}
      {options.map((option) => (
        <label key={option.value} className="flex items-center gap-3 text-sm text-foreground">
          <input type="radio" name={name} value={option.value} checked={value === option.value} disabled={option.disabled} onChange={() => onValueChange?.(option.value)} className="h-4 w-4 border-input text-primary focus-visible:ring-ring" />
          {option.label}
        </label>
      ))}
    </fieldset>
  );
}

