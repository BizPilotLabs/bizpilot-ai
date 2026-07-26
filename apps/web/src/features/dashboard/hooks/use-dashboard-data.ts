import { FolderKanban, ListChecks, PlayCircle, Timer, UsersRound, CheckCircle2, AlertTriangle } from "lucide-react";
import { useProjects } from "@/features/projects";
import { useTasks } from "@/features/tasks";
import { useUsers } from "@/features/users";
import type { DashboardMetric } from "../types";

const retry = (refetch: () => Promise<unknown>): (() => void) => {
  return () => {
    void refetch();
  };
};

export function useDashboardData() {
  const recentProjectsQuery = useProjects({ limit: 5, sort: "desc" });
  const activeProjectsQuery = useProjects({ limit: 1, status: "ACTIVE" });
  const recentTasksQuery = useTasks({ limit: 5, sort: "desc" });
  const completedTasksQuery = useTasks({ limit: 1, status: "DONE" });
  const inProgressTasksQuery = useTasks({ limit: 1, status: "IN_PROGRESS" });
  const overdueTasksQuery = useTasks({ limit: 1, overdue: true });
  const usersQuery = useUsers({ limit: 1 });

  const metrics: DashboardMetric[] = [
    {
      id: "total-projects",
      label: "Total Projects",
      value: recentProjectsQuery.data?.pagination.total ?? null,
      description: "Projects in your organization",
      icon: FolderKanban,
      isError: recentProjectsQuery.isError,
      isLoading: recentProjectsQuery.isLoading,
      onRetry: retry(recentProjectsQuery.refetch)
    },
    {
      id: "active-projects",
      label: "Active Projects",
      value: activeProjectsQuery.data?.pagination.total ?? null,
      description: "Projects currently in motion",
      icon: PlayCircle,
      isError: activeProjectsQuery.isError,
      isLoading: activeProjectsQuery.isLoading,
      onRetry: retry(activeProjectsQuery.refetch)
    },
    {
      id: "total-tasks",
      label: "Total Tasks",
      value: recentTasksQuery.data?.pagination.total ?? null,
      description: "Tasks across all projects",
      icon: ListChecks,
      isError: recentTasksQuery.isError,
      isLoading: recentTasksQuery.isLoading,
      onRetry: retry(recentTasksQuery.refetch)
    },
    {
      id: "completed-tasks",
      label: "Completed Tasks",
      value: completedTasksQuery.data?.pagination.total ?? null,
      description: "Tasks marked done",
      icon: CheckCircle2,
      isError: completedTasksQuery.isError,
      isLoading: completedTasksQuery.isLoading,
      onRetry: retry(completedTasksQuery.refetch)
    },
    {
      id: "in-progress-tasks",
      label: "In Progress Tasks",
      value: inProgressTasksQuery.data?.pagination.total ?? null,
      description: "Tasks actively being worked",
      icon: Timer,
      isError: inProgressTasksQuery.isError,
      isLoading: inProgressTasksQuery.isLoading,
      onRetry: retry(inProgressTasksQuery.refetch)
    },
    {
      id: "overdue-tasks",
      label: "Overdue Tasks",
      value: overdueTasksQuery.data?.pagination.total ?? null,
      description: "Tasks past their due date",
      icon: AlertTriangle,
      isError: overdueTasksQuery.isError,
      isLoading: overdueTasksQuery.isLoading,
      onRetry: retry(overdueTasksQuery.refetch)
    },
    {
      id: "team-members",
      label: "Team Members",
      value: usersQuery.data?.pagination.total ?? null,
      description: "People in your organization",
      icon: UsersRound,
      isError: usersQuery.isError,
      isLoading: usersQuery.isLoading,
      onRetry: retry(usersQuery.refetch)
    }
  ];

  return {
    metrics,
    recentProjectsQuery,
    recentTasksQuery
  };
}
