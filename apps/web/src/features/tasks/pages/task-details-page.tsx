import { ArrowLeft, CalendarClock, MessageSquare, Paperclip, Pencil, UserRound } from "lucide-react";
import { useState, type ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { TaskAttachmentsDialog } from "@/features/attachments";
import { TaskCommentsSection } from "@/features/comments";
import { getTaskErrorMessage, useTask } from "../hooks";
import { EditTaskDialog, TasksErrorState } from "../components";
import type { TaskPriority, TaskStatus } from "../types";

const priorityVariantMap: Record<TaskPriority, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = { LOW: "neutral", MEDIUM: "secondary", HIGH: "warning", CRITICAL: "danger" };
const statusVariantMap: Record<TaskStatus, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = { TODO: "neutral", IN_PROGRESS: "primary", IN_REVIEW: "secondary", DONE: "success", CANCELLED: "danger" };
const formatEnum = (value: string): string => value.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());
const formatDate = (value: string | null): string => value === null ? "Not set" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
const formatUser = (user: { firstName: string; lastName: string; email: string } | null): string => user === null ? "Unassigned" : `${user.firstName} ${user.lastName}`.trim() || user.email;

export function TaskDetailsPage(): ReactElement {
  const { taskId } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const [attachmentsOpen, setAttachmentsOpen] = useState(false);
  const taskQuery = useTask(taskId);
  const task = taskQuery.data;

  if (taskQuery.isLoading) {
    return <div className="grid gap-5"><Skeleton className="h-10 w-40" /><Skeleton className="h-72" /><Skeleton className="h-52" /></div>;
  }

  if (taskQuery.isError) {
    return <TasksErrorState isRetrying={taskQuery.isFetching} message={getTaskErrorMessage(taskQuery.error)} onRetry={() => void taskQuery.refetch()} />;
  }

  if (task === undefined) {
    return <TasksErrorState isRetrying={false} message="Task was not found." onRetry={() => void taskQuery.refetch()} />;
  }

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-3">
          <Link className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" to="/app/tasks"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to tasks</Link>
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariantMap[task.status]}>{formatEnum(task.status)}</Badge><Badge variant={priorityVariantMap[task.priority]}>{formatEnum(task.priority)}</Badge>{task.archived ? <Badge variant="warning">Archived</Badge> : null}</div>
            <h2 className="text-h2">{task.title}</h2>
            <p className="text-sm text-muted-foreground">Project: <Link className="font-medium text-foreground underline-offset-4 hover:underline" to={`/app/projects/${task.projectId}`}>{task.project.name}</Link></p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button leftIcon={<Paperclip aria-hidden="true" className="h-4 w-4" />} variant="neutral" onClick={() => setAttachmentsOpen(true)}>Attachments</Button>
          <Button leftIcon={<Pencil aria-hidden="true" className="h-4 w-4" />} onClick={() => setEditOpen(true)}>Edit task</Button>
        </div>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader><CardTitle>Description</CardTitle></CardHeader>
          <CardContent><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{task.description ?? "No description provided."}</p></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Task Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><CalendarClock className="h-4 w-4" />Due</dt><dd className="font-medium">{formatDate(task.dueDate)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><UserRound className="h-4 w-4" />Assignee</dt><dd className="font-medium">{formatUser(task.assignee)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Creator</dt><dd className="font-medium">{formatUser(task.createdBy)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><MessageSquare className="h-4 w-4" />Comments</dt><dd className="font-medium">{task.commentCount}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><Paperclip className="h-4 w-4" />Attachments</dt><dd className="font-medium">{task.attachmentCount}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <TaskCommentsSection commentCount={task.commentCount} taskId={task.id} />

      <EditTaskDialog open={editOpen} task={task} onOpenChange={setEditOpen} />
      <TaskAttachmentsDialog open={attachmentsOpen} taskId={task.id} taskTitle={task.title} onOpenChange={setAttachmentsOpen} />
    </div>
  );
}