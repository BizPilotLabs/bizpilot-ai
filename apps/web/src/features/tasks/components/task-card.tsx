import { motion } from "framer-motion";
import { CalendarClock, Paperclip, Pencil, Trash2, UserRound } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactElement } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { useToast } from "@/hooks";
import { cardHover, slideUp } from "@/lib";
import { cn } from "@/utils";
import type { UserProfile } from "@/features/users";
import { getTaskErrorMessage, useUpdateTaskAssignee, useUpdateTaskStatus } from "../hooks";
import { TaskAssigneeMenu } from "./task-assignee-menu";
import { TaskStatusMenu } from "./task-status-menu";
import type { Task, TaskPriority, TaskStatus } from "../types";

export interface TaskCardProps {
  hasUsersError?: boolean;
  isLoadingUsers?: boolean;
  task: Task;
  users: UserProfile[];
  onDeleteTask: (task: Task) => void;
  onEditTask: (task: Task) => void;
  onViewAttachments: (task: Task) => void;
}

const priorityVariantMap: Record<TaskPriority, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  LOW: "neutral",
  MEDIUM: "secondary",
  HIGH: "warning",
  CRITICAL: "danger"
};

const statusAccentMap: Record<TaskStatus, string> = {
  TODO: "from-muted-foreground/30 via-muted-foreground/10",
  IN_PROGRESS: "from-primary/70 via-primary/20",
  IN_REVIEW: "from-secondary/70 via-secondary/20",
  DONE: "from-success/70 via-success/20",
  CANCELLED: "from-danger/70 via-danger/20"
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

const getUserDisplayName = (user: UserProfile): string => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name.length > 0 ? name : user.email;
};

const handleKeyboardActivation = (event: KeyboardEvent<HTMLElement>): void => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
};

export function TaskCard({ hasUsersError = false, isLoadingUsers = false, task, users, onDeleteTask, onEditTask, onViewAttachments }: TaskCardProps): ReactElement {
  const updateAssignee = useUpdateTaskAssignee();
  const updateStatus = useUpdateTaskStatus();
  const { addToast } = useToast();
  const assignee = task.assigneeId === null ? null : users.find((user) => user.id === task.assigneeId) ?? null;

  const handleEdit = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onEditTask(task);
  };

  const handleDelete = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onDeleteTask(task);
  };

  const handleAttachments = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onViewAttachments(task);
  };

  const handleStatusChange = (status: TaskStatus): void => {
    updateStatus.mutate(
      { taskId: task.id, status },
      {
        onSuccess: (updatedTask) => {
          addToast({
            title: "Task status updated",
            description: `${updatedTask.title} is now ${formatEnum(updatedTask.status)}.`,
            variant: "success"
          });
        },
        onError: (error) => {
          addToast({
            title: "Status was not updated",
            description: getTaskErrorMessage(error),
            variant: "danger"
          });
        }
      }
    );
  };

  const handleAssigneeChange = (assigneeId: string | null): void => {
    const nextAssignee = assigneeId === null ? null : users.find((user) => user.id === assigneeId) ?? null;

    updateAssignee.mutate(
      { taskId: task.id, assigneeId },
      {
        onSuccess: (updatedTask) => {
          addToast({
            title: assigneeId === null ? "Task unassigned" : "Task assigned",
            description:
              assigneeId === null
                ? `${updatedTask.title} is now unassigned.`
                : `${updatedTask.title} is assigned to ${nextAssignee === null ? "the selected user" : getUserDisplayName(nextAssignee)}.`,
            variant: "success"
          });
        },
        onError: (error) => {
          addToast({
            title: "Assignee was not updated",
            description: getTaskErrorMessage(error),
            variant: "danger"
          });
        }
      }
    );
  };

  return (
    <motion.article variants={slideUp} {...cardHover}>
      <Card
        aria-label={`Task: ${task.title}`}
        className="group relative min-h-72 cursor-pointer overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-muted/35 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_22px_70px_hsl(var(--shadow-color)/0.14)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => undefined}
        onKeyDown={handleKeyboardActivation}
        role="button"
        tabIndex={0}
      >
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent", statusAccentMap[task.status])} />
        <CardHeader>
          <div className="grid gap-3">
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="line-clamp-2 text-lg leading-snug">{task.title}</CardTitle>
              <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
                <Button aria-label={`View attachments for ${task.title}`} size="icon" type="button" variant="ghost" onClick={handleAttachments}>
                  <Paperclip aria-hidden="true" className="h-4 w-4" />
                </Button>
                <Button aria-label={`Edit ${task.title}`} size="icon" type="button" variant="ghost" onClick={handleEdit}>
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                </Button>
                <Button aria-label={`Delete ${task.title}`} size="icon" type="button" variant="ghost" onClick={handleDelete}>
                  <Trash2 aria-hidden="true" className="h-4 w-4 text-danger" />
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <TaskStatusMenu currentStatus={task.status} disabled={updateStatus.isPending} onStatusChange={handleStatusChange} />
              <Badge variant={priorityVariantMap[task.priority]}>{formatEnum(task.priority)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="[display:-webkit-box] min-h-12 overflow-hidden text-sm leading-6 text-muted-foreground [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {task.description ?? "No description provided."}
          </p>
          <dl className="grid gap-2 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarClock aria-hidden="true" className="h-4 w-4" />
                Due date
              </dt>
              <dd className="text-right font-medium text-foreground">{formatDate(task.dueDate)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <UserRound aria-hidden="true" className="h-4 w-4" />
                Assignee
              </dt>
              <dd className="min-w-0 text-right">
                <TaskAssigneeMenu
                  assignee={assignee}
                  currentAssigneeId={task.assigneeId}
                  disabled={updateAssignee.isPending}
                  hasUsersError={hasUsersError}
                  isLoadingUsers={isLoadingUsers}
                  users={users}
                  onAssigneeChange={handleAssigneeChange}
                />
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </motion.article>
  );
}

