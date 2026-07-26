import { ChevronDown } from "lucide-react";
import { useRef, type MouseEvent, type ReactElement } from "react";
import { Badge } from "@/components/ui";
import { cn } from "@/utils";
import type { TaskStatus } from "../types";

export interface TaskStatusMenuProps {
  currentStatus: TaskStatus;
  disabled?: boolean;
  onStatusChange: (status: TaskStatus) => void;
}

const statusOptions: TaskStatus[] = ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"];

const statusVariantMap: Record<TaskStatus, "neutral" | "primary" | "secondary" | "success" | "danger"> = {
  TODO: "neutral",
  IN_PROGRESS: "primary",
  IN_REVIEW: "secondary",
  DONE: "success",
  CANCELLED: "danger"
};

const formatStatus = (status: TaskStatus): string => status.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());

export function TaskStatusMenu({ currentStatus, disabled = false, onStatusChange }: TaskStatusMenuProps): ReactElement {
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const stopCardClick = (event: MouseEvent): void => {
    event.stopPropagation();
  };

  const handleSelect = (status: TaskStatus) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    detailsRef.current?.removeAttribute("open");

    if (status !== currentStatus && !disabled) {
      onStatusChange(status);
    }
  };

  return (
    <details ref={detailsRef} className="group relative inline-block" onClick={stopCardClick}>
      <summary
        aria-label={`Change task status. Current status: ${formatStatus(currentStatus)}`}
        className={cn(
          "list-none rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <span className="inline-flex cursor-pointer items-center gap-1">
          <Badge variant={statusVariantMap[currentStatus]}>{formatStatus(currentStatus)}</Badge>
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 text-muted-foreground transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="absolute left-0 z-40 mt-2 min-w-44 rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
        {statusOptions.map((status) => (
          <button
            key={status}
            aria-current={status === currentStatus ? "true" : undefined}
            className={cn(
              "flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted",
              status === currentStatus && "text-primary"
            )}
            disabled={disabled}
            type="button"
            onClick={handleSelect(status)}
          >
            {formatStatus(status)}
            {status === currentStatus ? <span className="text-xs text-muted-foreground">Current</span> : null}
          </button>
        ))}
      </div>
    </details>
  );
}

