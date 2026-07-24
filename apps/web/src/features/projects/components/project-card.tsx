import { motion } from "framer-motion";
import { CalendarDays, Pencil, UserRound } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactElement } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import { cardHover, slideUp } from "@/lib";
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
        className="min-h-64 cursor-pointer transition-all duration-200 ease-premium hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => undefined}
        onKeyDown={handleKeyboardActivation}
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="line-clamp-2 leading-snug">{project.name}</CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              <Badge variant={statusVariantMap[project.status]}>{formatStatus(project.status)}</Badge>
              <Button aria-label={`Edit ${project.name}`} size="icon" type="button" variant="ghost" onClick={handleEdit}>
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <p className="[display:-webkit-box] min-h-12 overflow-hidden text-sm leading-6 text-muted-foreground [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {project.description ?? "No description provided."}
          </p>
          <dl className="grid gap-3 text-sm">
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

