import { useState, type ReactElement } from "react";
import { getProjectErrorMessage, useProjects } from "../hooks";
import { CreateProjectDialog, EditProjectDialog, ProjectsEmptyState, ProjectsErrorState, ProjectsList, ProjectsLoadingState, ProjectsPageHeader } from "../components";
import type { Project } from "../types";

export function ProjectsPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const projectsQuery = useProjects();
  const projects = projectsQuery.data?.projects ?? [];

  const handleEditProject = (project: Project): void => {
    setSelectedProject(project);
  };

  const handleEditDialogOpenChange = (open: boolean): void => {
    if (!open) {
      setSelectedProject(null);
    }
  };

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
      {projectsQuery.isSuccess && projects.length > 0 ? <ProjectsList projects={projects} onEditProject={handleEditProject} /> : null}
      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditProjectDialog open={selectedProject !== null} project={selectedProject} onOpenChange={handleEditDialogOpenChange} />
    </div>
  );
}

