import { useMemo, useState, type ReactElement } from "react";
import { useNavigate } from "react-router-dom";
import { Pagination } from "@/components/ui";
import { TaskAttachmentsDialog } from "@/features/attachments";
import { useProjects } from "@/features/projects";
import { useUsers } from "@/features/users";
import { useAuthStore } from "@/store";
import {
  CreateTaskDialog,
  DeleteTaskDialog,
  EditTaskDialog,
  TaskListControls,
  TasksEmptyState,
  TasksErrorState,
  TasksList,
  TasksLoadingState,
  TasksPageHeader
} from "../components";
import { getTaskErrorMessage, useTasks } from "../hooks";
import type { Task, TaskListQuery } from "../types";

const defaultQuery: TaskListQuery = { page: 1, limit: 12, sort: "desc" };
const hasPermission = (permissions: { key: string }[], key: string): boolean => permissions.some((permission) => permission.key === key);

export function TasksPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);
  const [attachmentTask, setAttachmentTask] = useState<Task | null>(null);
  const [query, setQuery] = useState<TaskListQuery>(defaultQuery);
  const navigate = useNavigate();
  const permissions = useAuthStore((state) => state.permissions);
  const canUpdateTask = hasPermission(permissions, "tasks.update");
  const canDeleteTask = hasPermission(permissions, "tasks.delete");
  const tasksQuery = useTasks(query);
  const usersQuery = useUsers({ limit: 100 });
  const projectsQuery = useProjects({ limit: 100, archived: false });
  const tasks = tasksQuery.data?.tasks ?? [];
  const users = usersQuery.data?.users ?? [];
  const projects = projectsQuery.data?.projects ?? [];
  const pagination = tasksQuery.data?.pagination;
  const filtered = useMemo(() => Boolean(query.search) || query.status !== undefined || query.priority !== undefined || query.projectId !== undefined || query.assigneeId !== undefined || query.overdue === true, [query]);

  return (
    <div className="grid gap-6">
      <TasksPageHeader onCreateTask={() => setCreateDialogOpen(true)} />
      <TaskListControls projects={projects} query={query} users={users} onQueryChange={setQuery} />
      {tasksQuery.isLoading ? <TasksLoadingState /> : null}
      {tasksQuery.isError ? <TasksErrorState isRetrying={tasksQuery.isFetching} message={getTaskErrorMessage(tasksQuery.error)} onRetry={() => void tasksQuery.refetch()} /> : null}
      {tasksQuery.isSuccess && tasks.length === 0 ? <TasksEmptyState title={filtered ? "No tasks match your filters" : undefined} subtitle={filtered ? "Adjust your search or filters to see more tasks." : undefined} /> : null}
      {tasksQuery.isSuccess && tasks.length > 0 ? (
        <>
          <TasksList
            canDeleteTask={canDeleteTask}
            canUpdateTask={canUpdateTask}
            hasUsersError={usersQuery.isError}
            isLoadingUsers={usersQuery.isLoading}
            tasks={tasks}
            users={users}
            onDeleteTask={setTaskToDelete}
            onEditTask={setSelectedTask}
            onViewAttachments={setAttachmentTask}
            onViewTask={(task) => void navigate(`/app/tasks/${task.id}`)}
          />
          {pagination !== undefined && pagination.totalPages > 1 ? <Pagination className="justify-center" page={pagination.page} totalPages={pagination.totalPages} onPageChange={(page) => setQuery((current) => ({ ...current, page }))} /> : null}
        </>
      ) : null}
      <CreateTaskDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditTaskDialog open={selectedTask !== null} task={selectedTask} onOpenChange={(open) => !open && setSelectedTask(null)} />
      <DeleteTaskDialog open={taskToDelete !== null} task={taskToDelete} onOpenChange={(open) => !open && setTaskToDelete(null)} />
      <TaskAttachmentsDialog open={attachmentTask !== null} taskId={attachmentTask?.id ?? null} taskTitle={attachmentTask?.title ?? ""} onOpenChange={(open) => !open && setAttachmentTask(null)} />
    </div>
  );
}