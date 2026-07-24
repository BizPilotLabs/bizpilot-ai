import { type ReactElement, type ReactNode } from "react";
import { cn } from "@/utils";

export interface TabItem {
  value: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

export interface TabsProps {
  items: TabItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

export function Tabs({ items, value, onValueChange, className }: TabsProps): ReactElement {
  const selected = items.find((item) => item.value === value) ?? items[0];

  return (
    <div className={cn("grid gap-4", className)}>
      <div role="tablist" className="inline-flex w-fit rounded-lg border border-border bg-muted p-1">
        {items.map((item) => (
          <button key={item.value} type="button" role="tab" aria-selected={item.value === selected?.value} disabled={item.disabled} onClick={() => onValueChange(item.value)} className={cn("rounded-md px-3 py-1.5 text-sm font-medium text-muted-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50", item.value === selected?.value && "bg-surface text-foreground shadow-xs")}>
            {item.label}
          </button>
        ))}
      </div>
      <div role="tabpanel">{selected?.content}</div>
    </div>
  );
}

