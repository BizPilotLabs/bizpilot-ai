import { FolderKanban } from "lucide-react";
import { type ReactElement } from "react";
import { Badge } from "@/components/ui";
import { getProjectErrorMessage } from "@/features/projects";
import type { Project } from "@/features/projects";
import { DashboardEmptyCard } from "./dashboard-empty-card";
import { DashboardErrorCard } from "./dashboard-error-card";
import { DashboardPanel } from "./dashboard-panel";
import { DashboardPanelSkeleton } from "./dashboard-panel-skeleton";

export interface RecentProjectsPanelProps {
  error: unknown;
  isError: boolean;
  isLoading: boolean;
  isRetrying: boolean;
  projects: Project[];
  onRetry: () => void;
}

const formatDate = (value: string): string => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
const formatStatus = (value: string): string => value.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());

export function RecentProjectsPanel({ error, isError, isLoading, isRetrying, projects, onRetry }: RecentProjectsPanelProps): ReactElement {
  if (isLoading) {
    return <DashboardPanelSkeleton />;
  }

  if (isError) {
    return <DashboardErrorCard isRetrying={isRetrying} message={getProjectErrorMessage(error)} title="Recent projects could not be loaded" onRetry={onRetry} />;
  }

  if (projects.length === 0) {
    return <DashboardEmptyCard icon={<FolderKanban aria-hidden="true" className="h-6 w-6" />} title="No projects yet" message="Recent projects will appear here once your team creates them." />;
  }

  return (
    <DashboardPanel title="Recent Projects" description="Latest projects in this organization">
      <ul className="grid gap-3" aria-label="Recent projects">
        {projects.map((project) => (
          <li key={project.id} className="rounded-xl border border-border p-4 transition-colors hover:bg-muted/50">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-medium">{project.name}</p>
                <p className="mt-1 line-clamp-2 text-sm leading-6 text-muted-foreground">{project.description ?? "No description provided."}</p>
              </div>
              <Badge variant={project.status === "ACTIVE" ? "success" : "neutral"}>{formatStatus(project.status)}</Badge>
            </div>
            <p className="mt-3 text-xs text-muted-foreground">Updated {formatDate(project.updatedAt)}</p>
          </li>
        ))}
      </ul>
    </DashboardPanel>
  );
}
