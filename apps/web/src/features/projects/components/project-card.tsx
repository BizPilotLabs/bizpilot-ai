import { motion } from "framer-motion";
import { Archive, CalendarDays, CheckCircle2, Eye, Pencil, RotateCcw, Trash2, UserRound } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactElement } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cardHover, slideUp } from "@/lib";
import { cn } from "@/utils";
import type { Project, ProjectStatus } from "../types";

export interface ProjectCardProps {
  canDeleteProject?: boolean;
  canUpdateProject?: boolean;
  project: Project;
  onArchiveProject: (project: Project) => void;
  onDeleteProject: (project: Project) => void;
  onEditProject: (project: Project) => void;
  onViewProject: (project: Project) => void;
}

const statusVariantMap: Record<ProjectStatus, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  PLANNED: "neutral",
  ACTIVE: "primary",
  ON_HOLD: "warning",
  COMPLETED: "success",
  CANCELLED: "danger"
};

const statusAccentMap: Record<ProjectStatus, string> = {
  PLANNED: "from-muted-foreground/30 via-muted-foreground/10",
  ACTIVE: "from-primary/70 via-primary/20",
  ON_HOLD: "from-warning/70 via-warning/20",
  COMPLETED: "from-success/70 via-success/20",
  CANCELLED: "from-danger/70 via-danger/20"
};

const formatStatus = (status: ProjectStatus): string => status.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());

const formatDate = (value: string | null): string => {
  if (value === null) return "Not set";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};

const getUserDisplayName = (project: Project): string => {
  const name = `${project.createdBy.firstName} ${project.createdBy.lastName}`.trim();
  return name.length > 0 ? name : project.createdBy.email;
};

const handleKeyboardActivation = (event: KeyboardEvent<HTMLElement>): void => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
};

export function ProjectCard({ canDeleteProject = true, canUpdateProject = true, project, onArchiveProject, onDeleteProject, onEditProject, onViewProject }: ProjectCardProps): ReactElement {
  const handleAction = (event: MouseEvent<HTMLButtonElement>, action: (project: Project) => void): void => {
    event.stopPropagation();
    action(project);
  };

  return (
    <motion.article variants={slideUp} {...cardHover}>
      <Card
        aria-label={`Project: ${project.name}`}
        className="group relative min-h-80 cursor-pointer overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-muted/35 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_22px_70px_hsl(var(--shadow-color)/0.14)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => onViewProject(project)}
        onKeyDown={handleKeyboardActivation}
        role="button"
        tabIndex={0}
      >
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent", statusAccentMap[project.status])} />
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="grid min-w-0 gap-2">
              <CardTitle className="line-clamp-2 text-lg leading-snug">{project.name}</CardTitle>
              <div className="flex flex-wrap gap-2">
                <Badge className="w-fit" variant={statusVariantMap[project.status]}>{formatStatus(project.status)}</Badge>
                {project.archived ? <Badge variant="warning">Archived</Badge> : null}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1 opacity-80 transition-opacity group-hover:opacity-100">
              <Button aria-label={`View ${project.name}`} size="icon" type="button" variant="ghost" onClick={(event) => handleAction(event, onViewProject)}>
                <Eye aria-hidden="true" className="h-4 w-4" />
              </Button>
              {canUpdateProject ? (
                <>
                  <Button aria-label={`Edit ${project.name}`} size="icon" type="button" variant="ghost" onClick={(event) => handleAction(event, onEditProject)}>
                    <Pencil aria-hidden="true" className="h-4 w-4" />
                  </Button>
                  <Button aria-label={project.archived ? `Restore ${project.name}` : `Archive ${project.name}`} size="icon" type="button" variant="ghost" onClick={(event) => handleAction(event, onArchiveProject)}>
                    {project.archived ? <RotateCcw aria-hidden="true" className="h-4 w-4" /> : <Archive aria-hidden="true" className="h-4 w-4" />}
                  </Button>
                </>
              ) : null}
              {canDeleteProject ? (
                <Button aria-label={`Delete ${project.name}`} size="icon" type="button" variant="ghost" onClick={(event) => handleAction(event, onDeleteProject)}>
                  <Trash2 aria-hidden="true" className="h-4 w-4 text-danger" />
                </Button>
              ) : null}
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="[display:-webkit-box] min-h-12 overflow-hidden text-sm leading-6 text-muted-foreground [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {project.description ?? "No description provided."}
          </p>
          <div className="grid gap-2 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <span className="flex items-center gap-2 text-muted-foreground"><CheckCircle2 aria-hidden="true" className="h-4 w-4" />Progress</span>
              <span className="font-medium text-foreground">{project.progressPercentage}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${project.progressPercentage}%` }} />
            </div>
            <p className="text-xs text-muted-foreground">{project.completedTaskCount} of {project.taskCount} tasks complete</p>
          </div>
          <dl className="grid gap-2 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays aria-hidden="true" className="h-4 w-4" />Start</dt>
              <dd className="text-right font-medium text-foreground">{formatDate(project.startDate)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays aria-hidden="true" className="h-4 w-4" />Due</dt>
              <dd className="text-right font-medium text-foreground">{formatDate(project.endDate)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground"><UserRound aria-hidden="true" className="h-4 w-4" />Owner</dt>
              <dd className="min-w-0 truncate text-right font-medium text-foreground">{getUserDisplayName(project)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </motion.article>
  );
}