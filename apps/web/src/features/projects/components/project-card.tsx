import { motion } from "framer-motion";
import { CalendarDays, Pencil, UserRound } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactElement } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cardHover, slideUp } from "@/lib";
import { cn } from "@/utils";
import type { Project, ProjectStatus } from "../types";

export interface ProjectCardProps {
  project: Project;
  onEditProject: (project: Project) => void;
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

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));

const shortenIdentifier = (value: string): string => (value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value);

const handleKeyboardActivation = (event: KeyboardEvent<HTMLElement>): void => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
};

export function ProjectCard({ project, onEditProject }: ProjectCardProps): ReactElement {
  const handleEdit = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onEditProject(project);
  };

  return (
    <motion.article variants={slideUp} {...cardHover}>
      <Card
        aria-label={`Project: ${project.name}`}
        className="group relative min-h-72 cursor-pointer overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-muted/35 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_22px_70px_hsl(var(--shadow-color)/0.14)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => undefined}
        onKeyDown={handleKeyboardActivation}
        role="button"
        tabIndex={0}
      >
        <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r to-transparent", statusAccentMap[project.status])} />
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <div className="grid min-w-0 gap-2">
              <CardTitle className="line-clamp-2 text-lg leading-snug">{project.name}</CardTitle>
              <Badge className="w-fit" variant={statusVariantMap[project.status]}>{formatStatus(project.status)}</Badge>
            </div>
            <Button aria-label={`Edit ${project.name}`} size="icon" type="button" variant="ghost" onClick={handleEdit}>
              <Pencil aria-hidden="true" className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <p className="[display:-webkit-box] min-h-12 overflow-hidden text-sm leading-6 text-muted-foreground [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {project.description ?? "No description provided."}
          </p>
          <dl className="grid gap-2 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Created
              </dt>
              <dd className="text-right font-medium text-foreground">{formatDate(project.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Updated
              </dt>
              <dd className="text-right font-medium text-foreground">{formatDate(project.updatedAt)}</dd>
            </div>
            {project.createdById.length > 0 ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <UserRound aria-hidden="true" className="h-4 w-4" />
                  Owner
                </dt>
                <dd className="text-right font-medium text-foreground" title={project.createdById}>{shortenIdentifier(project.createdById)}</dd>
              </div>
            ) : null}
          </dl>
        </CardContent>
      </Card>
    </motion.article>
  );
}
