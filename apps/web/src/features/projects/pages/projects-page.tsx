import { useState, type ReactElement } from "react";
import { getProjectErrorMessage, useProjects } from "../hooks";
import { CreateProjectDialog, ProjectsEmptyState, ProjectsErrorState, ProjectsList, ProjectsLoadingState, ProjectsPageHeader } from "../components";

export function ProjectsPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const projectsQuery = useProjects();
  const projects = projectsQuery.data?.projects ?? [];

  return (
    <div className="grid gap-6">
      <ProjectsPageHeader onCreateProject={() => setCreateDialogOpen(true)} />
      {projectsQuery.isLoading ? <ProjectsLoadingState /> : null}
      {projectsQuery.isError ? (
        <ProjectsErrorState
          isRetrying={projectsQuery.isFetching}
          message={getProjectErrorMessage(projectsQuery.error)}
          onRetry={() => {
            void projectsQuery.refetch();
          }}
        />
      ) : null}
      {projectsQuery.isSuccess && projects.length === 0 ? <ProjectsEmptyState /> : null}
      {projectsQuery.isSuccess && projects.length > 0 ? <ProjectsList projects={projects} /> : null}
      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}

