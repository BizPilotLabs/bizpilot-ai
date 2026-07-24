import { type ReactElement } from "react";
import { getProjectErrorMessage, useProjects } from "../hooks";
import { ProjectsEmptyState, ProjectsErrorState, ProjectsList, ProjectsLoadingState } from "../components";

export function ProjectsPage(): ReactElement {
  const projectsQuery = useProjects();

  if (projectsQuery.isLoading) {
    return <ProjectsLoadingState />;
  }

  if (projectsQuery.isError) {
    return (
      <ProjectsErrorState
        isRetrying={projectsQuery.isFetching}
        message={getProjectErrorMessage(projectsQuery.error)}
        onRetry={() => {
          void projectsQuery.refetch();
        }}
      />
    );
  }

  const projects = projectsQuery.data?.projects ?? [];

  if (projects.length === 0) {
    return <ProjectsEmptyState />;
  }

  return <ProjectsList projects={projects} />;
}

