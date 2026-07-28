import { ArrowLeft, CalendarDays, ListChecks, Pencil } from "lucide-react";
import { useState, type ReactElement } from "react";
import { Link, useParams } from "react-router-dom";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { getTaskErrorMessage, useTasks } from "@/features/tasks";
import { getProjectErrorMessage, useProject } from "../hooks";
import { EditProjectDialog, ProjectsErrorState } from "../components";
import type { ProjectStatus } from "../types";

const statusVariantMap: Record<ProjectStatus, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  ACTIVE: "primary",
  ON_HOLD: "warning",
  COMPLETED: "success",
  CANCELLED: "danger"
};

const formatEnum = (value: string): string => value.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());
const formatDate = (value: string | null): string => value === null ? "Not set" : new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function ProjectDetailsPage(): ReactElement {
  const { projectId } = useParams();
  const [editOpen, setEditOpen] = useState(false);
  const projectQuery = useProject(projectId);
  const tasksQuery = useTasks(projectId === undefined ? {} : { projectId, limit: 6, sort: "desc" });
  const project = projectQuery.data;
  const tasks = tasksQuery.data?.tasks ?? [];

  if (projectQuery.isLoading) {
    return <div className="grid gap-5"><Skeleton className="h-10 w-40" /><Skeleton className="h-72" /><Skeleton className="h-60" /></div>;
  }

  if (projectQuery.isError) {
    return <ProjectsErrorState isRetrying={projectQuery.isFetching} message={getProjectErrorMessage(projectQuery.error)} onRetry={() => void projectQuery.refetch()} />;
  }

  if (project === undefined) {
    return <ProjectsErrorState isRetrying={false} message="Project was not found." onRetry={() => void projectQuery.refetch()} />;
  }

  const ownerName = `${project.createdBy.firstName} ${project.createdBy.lastName}`.trim() || project.createdBy.email;

  return (
    <div className="grid gap-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="grid gap-3">
          <Link className="inline-flex w-fit items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-foreground transition hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring" to="/app/projects"><ArrowLeft aria-hidden="true" className="h-4 w-4" />Back to projects</Link>
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-2"><Badge variant={statusVariantMap[project.status]}>{formatEnum(project.status)}</Badge>{project.archived ? <Badge variant="warning">Archived</Badge> : null}</div>
            <h2 className="text-h2">{project.name}</h2>
            <p className="max-w-3xl text-sm leading-6 text-muted-foreground">{project.description ?? "No description provided."}</p>
          </div>
        </div>
        <Button leftIcon={<Pencil aria-hidden="true" className="h-4 w-4" />} variant="neutral" onClick={() => setEditOpen(true)}>Edit project</Button>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-primary/5">
          <CardHeader><CardTitle>Project Progress</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="flex items-end justify-between gap-4"><span className="text-display font-semibold">{project.progressPercentage}%</span><span className="text-sm text-muted-foreground">{project.completedTaskCount} of {project.taskCount} tasks complete</span></div>
            <div className="h-3 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progressPercentage}%` }} /></div>
            {project.taskCount === 0 ? <p className="text-sm text-muted-foreground">Progress starts once tasks are added to this project.</p> : null}
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Project Details</CardTitle></CardHeader>
          <CardContent>
            <dl className="grid gap-3 text-sm">
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" />Start</dt><dd className="font-medium">{formatDate(project.startDate)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays className="h-4 w-4" />Due</dt><dd className="font-medium">{formatDate(project.endDate)}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Owner</dt><dd className="font-medium">{ownerName}</dd></div>
              <div className="flex items-center justify-between gap-4"><dt className="text-muted-foreground">Updated</dt><dd className="font-medium">{formatDate(project.updatedAt)}</dd></div>
            </dl>
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><ListChecks aria-hidden="true" className="h-5 w-5" />Recent Tasks</CardTitle></CardHeader>
        <CardContent className="grid gap-3">
          {tasksQuery.isLoading ? <><Skeleton className="h-16" /><Skeleton className="h-16" /></> : null}
          {tasksQuery.isError ? <p className="text-sm text-danger">{getTaskErrorMessage(tasksQuery.error)}</p> : null}
          {tasksQuery.isSuccess && tasks.length === 0 ? <p className="text-sm text-muted-foreground">No tasks have been added to this project yet.</p> : null}
          {tasks.map((task) => <Link key={task.id} className="rounded-xl border border-border/70 bg-surface/70 p-4 transition hover:border-foreground/20 hover:bg-surface focus-visible:ring-2 focus-visible:ring-ring" to={`/app/tasks/${task.id}`}><div className="flex items-center justify-between gap-4"><span className="font-medium">{task.title}</span><Badge variant={task.status === "DONE" ? "success" : "neutral"}>{formatEnum(task.status)}</Badge></div></Link>)}
        </CardContent>
      </Card>
      <EditProjectDialog open={editOpen} project={project} onOpenChange={setEditOpen} />
    </div>
  );
}