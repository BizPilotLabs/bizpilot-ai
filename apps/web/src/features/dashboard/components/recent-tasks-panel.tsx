import { SquareCheckBig } from "lucide-react";
import { type ReactElement } from "react";
import { Badge } from "@/components/ui";
import { getTaskErrorMessage } from "@/features/tasks";
import type { Task, TaskPriority, TaskStatus } from "@/features/tasks";
import { DashboardEmptyCard } from "./dashboard-empty-card";
import { DashboardErrorCard } from "./dashboard-error-card";
import { DashboardPanel } from "./dashboard-panel";
import { DashboardPanelSkeleton } from "./dashboard-panel-skeleton";

export interface RecentTasksPanelProps {
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  isRetrying: boolean;
  tasks: Task[];
  onRetry: () => void;
}

const statusVariantMap: Record<TaskStatus, "neutral" | "primary" | "secondary" | "success" | "danger"> = {
  TODO: "neutral",
  IN_PROGRESS: "primary",
  IN_REVIEW: "secondary",
  DONE: "success",
  CANCELLED: "danger"
};

const priorityVariantMap: Record<TaskPriority, "neutral" | "secondary" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "secondary",
  HIGH: "warning",
  CRITICAL: "danger"
};

const formatDate = (value: string | null): string => {
  if (value === null) {
    return "No due date";
  }

  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

const formatEnum = (value: string): string => value.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());

export function RecentTasksPanel({ error, isError, isLoading, isRetrying, tasks, onRetry }: RecentTasksPanelProps): ReactElement {
  if (isLoading) {
    return <DashboardPanelSkeleton />;
  }

  if (isError) {
    return <DashboardErrorCard isRetrying={isRetrying} message={getTaskErrorMessage(error)} title="Recent tasks could not be loaded" onRetry={onRetry} />;
  }

  if (tasks.length === 0) {
    return <DashboardEmptyCard icon={<SquareCheckBig aria-hidden="true" className="h-6 w-6" />} title="No tasks yet" message="Recent tasks will appear here once work is created." />;
  }

  return (
    <DashboardPanel title="Recent Tasks" description="Latest task updates across projects">
      <ul className="grid gap-2" aria-label="Recent tasks">
        {tasks.map((task) => (
          <li key={task.id} className="group rounded-2xl border border-border/60 bg-background/45 p-4 transition-all duration-200 hover:-translate-y-0.5 hover:border-foreground/20 hover:bg-surface/80">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{task.title}</p>
                <p className="mt-1 line-clamp-1 text-sm leading-6 text-muted-foreground">{task.description ?? "No description provided."}</p>
              </div>
              <Badge variant={statusVariantMap[task.status]}>{formatEnum(task.status)}</Badge>
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant={priorityVariantMap[task.priority]}>{formatEnum(task.priority)}</Badge>
              <span className="h-px min-w-4 flex-1 bg-border/60" />
              <span>Due {formatDate(task.dueDate)}</span>
            </div>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}
