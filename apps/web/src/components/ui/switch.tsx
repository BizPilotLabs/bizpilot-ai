import { type ReactElement } from "react";
import { cn } from "@/utils";

export interface SwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  label?: string;
  disabled?: boolean;
  className?: string;
}

export function Switch({ checked, onCheckedChange, label, disabled = false, className }: SwitchProps): ReactElement {
  return (
    <label className={cn("inline-flex items-center gap-3 text-sm text-foreground", disabled && "cursor-not-allowed opacity-50", className)}>
      <button type="button" role="switch" aria-checked={checked} disabled={disabled} onClick={() => onCheckedChange(!checked)} className={cn("relative h-6 w-10 rounded-full border border-transparent transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2", checked ? "bg-primary" : "bg-muted")}>
        <span className={cn("absolute top-1 h-4 w-4 rounded-full bg-white shadow-sm transition-transform", checked ? "translate-x-4" : "translate-x-1")} />
      </button>
      {label ? <span>{label}</span> : null}
    </label>
  );
}

