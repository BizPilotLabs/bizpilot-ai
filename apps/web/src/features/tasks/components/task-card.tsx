import { motion } from "framer-motion";
import { CalendarClock, UserRound } from "lucide-react";
import { type KeyboardEvent, type ReactElement } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cardHover, slideUp } from "@/lib";
import type { Task, TaskPriority, TaskStatus } from "../types";

export interface TaskCardProps {
  task: Task;
}

const statusVariantMap: Record<TaskStatus, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  TODO: "neutral",
  IN_PROGRESS: "primary",
  IN_REVIEW: "secondary",
  DONE: "success",
  CANCELLED: "danger"
};

const priorityVariantMap: Record<TaskPriority, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "secondary",
  HIGH: "warning",
  CRITICAL: "danger"
};

const formatEnum = (value: string): string => value.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());

const formatDate = (value: string | null): string => {
  if (value === null) {
    return "No due date";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));
};

const shortenIdentifier = (value: string): string => (value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value);

const handleKeyboardActivation = (event: KeyboardEvent<HTMLElement>): void => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
};

export function TaskCard({ task }: TaskCardProps): ReactElement {
  return (
    <motion.article variants={slideUp} {...cardHover}>
      <Card
        aria-label={`Task: ${task.title}`}
        className="min-h-64 cursor-pointer transition-all duration-200 ease-premium hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => undefined}
        onKeyDown={handleKeyboardActivation}
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <div className="grid gap-3">
            <CardTitle className="line-clamp-2 leading-snug">{task.title}</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Badge variant={statusVariantMap[task.status]}>{formatEnum(task.status)}</Badge>
              <Badge variant={priorityVariantMap[task.priority]}>{formatEnum(task.priority)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <p className="[display:-webkit-box] min-h-12 overflow-hidden text-sm leading-6 text-muted-foreground [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {task.description ?? "No description provided."}
          </p>
          <dl className="grid gap-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock aria-hidden="true" className="h-4 w-4" />
                Due date
              </dt>
              <dd className="text-right font-medium text-foreground">{formatDate(task.dueDate)}</dd>
            </div>
            {task.assigneeId !== null ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <UserRound aria-hidden="true" className="h-4 w-4" />
                  Assignee
                </dt>
                <dd className="text-right font-medium text-foreground" title={task.assigneeId}>{shortenIdentifier(task.assigneeId)}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>
    </motion.article>
  );
}

