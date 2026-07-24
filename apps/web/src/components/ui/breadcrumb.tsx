import { ChevronRight } from "lucide-react";
import { type ReactElement } from "react";
import { cn } from "@/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
}

export interface BreadcrumbProps {
  items: BreadcrumbItem[];
  className?: string;
}

export function Breadcrumb({ items, className }: BreadcrumbProps): ReactElement {
  return (
    <nav aria-label="Breadcrumb" className={cn("text-sm text-muted-foreground", className)}>
      <ol className="flex flex-wrap items-center gap-2">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-2">
              {item.href && !isLast ? <a className="transition-colors hover:text-foreground" href={item.href}>{item.label}</a> : <span aria-current={isLast ? "page" : undefined} className={isLast ? "text-foreground" : undefined}>{item.label}</span>}
              {!isLast ? <ChevronRight aria-hidden="true" className="h-4 w-4" /> : null}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

