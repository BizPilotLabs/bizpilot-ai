import { useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@/components/ui";
import { useToast } from "@/hooks";
import { useAuthStore } from "@/store";
import {
  CreateProjectDialog,
  DeleteProjectDialog,
  EditProjectDialog,
  ProjectListControls,
  ProjectsEmptyState,
  ProjectsErrorState,
  ProjectsList,
  ProjectsLoadingState,
  ProjectsPageHeader
} from "../components";
import { getProjectErrorMessage, useDeleteProject, useProjects, useUpdateProject } from "../hooks";
import type { Project, ProjectListQuery } from "../types";

const defaultQuery: ProjectListQuery = { page: 1, limit: 12, sort: "desc", archived: false };

const hasPermission = (permissions: { key: string }[], key: string): boolean => permissions.some((permission) => permission.key === key);

export function ProjectsPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [query, setQuery] = useState<ProjectListQuery>(defaultQuery);
  const navigate = useNavigate();
  const updateProject = useUpdateProject();
  const deleteProject = useDeleteProject();
  const { addToast } = useToast();
  const permissions = useAuthStore((state) => state.permissions);
  const canUpdateProject = hasPermission(permissions, "projects.update");
  const canDeleteProject = hasPermission(permissions, "projects.delete");
  const projectsQuery = useProjects(query);
  const projects = projectsQuery.data?.projects ?? [];
  const pagination = projectsQuery.data?.pagination;
  const filtered = useMemo(() => Boolean(query.search) || query.status !== undefined || query.archived !== false, [query]);

  const handleArchiveProject = (project: Project): void => {
    updateProject.mutate(
      { projectId: project.id, data: { archived: !project.archived } },
      {
        onSuccess: (updatedProject) => {
          addToast({ title: updatedProject.archived ? "Project archived" : "Project restored", description: `${updatedProject.name} has been updated.`, variant: "success" });
        },
        onError: (error) => {
          addToast({ title: "Project was not updated", description: getProjectErrorMessage(error), variant: "danger" });
        }
      }
    );
  };

  const handleConfirmDelete = async (): Promise<void> => {
    if (projectToDelete === null) return;
    await deleteProject.mutateAsync(projectToDelete.id);
    addToast({ title: "Project deleted", description: `${projectToDelete.name} has been removed.`, variant: "success" });
    setProjectToDelete(null);
  };

  return (
    <div className="grid gap-6">
      <ProjectsPageHeader onCreateProject={() => setCreateDialogOpen(true)} />
      <ProjectListControls query={query} onQueryChange={setQuery} />
      {projectsQuery.isLoading ? <ProjectsLoadingState /> : null}
      {projectsQuery.isError ? <ProjectsErrorState isRetrying={projectsQuery.isFetching} message={getProjectErrorMessage(projectsQuery.error)} onRetry={() => void projectsQuery.refetch()} /> : null}
      {projectsQuery.isSuccess && projects.length === 0 ? <ProjectsEmptyState title={filtered ? "No projects match your filters" : undefined} subtitle={filtered ? "Adjust your search or filters to see more projects." : undefined} /> : null}
      {projectsQuery.isSuccess && projects.length > 0 ? (
        <>
          <ProjectsList
            canDeleteProject={canDeleteProject}
            canUpdateProject={canUpdateProject}
            projects={projects}
            onArchiveProject={handleArchiveProject}
            onDeleteProject={setProjectToDelete}
            onEditProject={setSelectedProject}
            onViewProject={(project) => void navigate(`/app/projects/${project.id}`)}
          />
          {pagination !== undefined && pagination.totalPages > 1 ? <Pagination className="justify-center" page={pagination.page} totalPages={pagination.totalPages} onPageChange={(page) => setQuery((current) => ({ ...current, page }))} /> : null}
        </>
      ) : null}
      <CreateProjectDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditProjectDialog open={selectedProject !== null} project={selectedProject} onOpenChange={(open) => !open && setSelectedProject(null)} />
      <DeleteProjectDialog isDeleting={deleteProject.isPending} open={projectToDelete !== null} project={projectToDelete} error={deleteProject.isError ? getProjectErrorMessage(deleteProject.error) : null} onConfirm={() => void handleConfirmDelete()} onOpenChange={(open) => !open && setProjectToDelete(null)} />
    </div>
  );
}