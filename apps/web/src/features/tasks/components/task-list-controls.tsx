import { X } from "lucide-react";
import { type ReactElement } from "react";
import { Button, Input, Select } from "@/components/ui";
import type { Project } from "@/features/projects";
import type { UserProfile } from "@/features/users";
import type { TaskListQuery, TaskPriority, TaskStatus } from "../types";

export interface TaskListControlsProps {
  projects: Project[];
  query: TaskListQuery;
  users: UserProfile[];
  onQueryChange: (query: TaskListQuery) => void;
}

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "To do", value: "TODO" },
  { label: "In progress", value: "IN_PROGRESS" },
  { label: "In review", value: "IN_REVIEW" },
  { label: "Done", value: "DONE" },
  { label: "Cancelled", value: "CANCELLED" }
];

const priorityOptions = [
  { label: "All priorities", value: "" },
  { label: "Low", value: "LOW" },
  { label: "Medium", value: "MEDIUM" },
  { label: "High", value: "HIGH" },
  { label: "Critical", value: "CRITICAL" }
];

const overdueOptions = [
  { label: "All due dates", value: "" },
  { label: "Overdue only", value: "true" }
];

const sortOptions = [
  { label: "Newest first", value: "desc" },
  { label: "Oldest first", value: "asc" }
];

const getUserName = (user: UserProfile): string => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name.length > 0 ? name : user.email;
};

export function TaskListControls({ projects, query, users, onQueryChange }: TaskListControlsProps): ReactElement {
  const hasFilters = Boolean(query.search) || query.status !== undefined || query.priority !== undefined || query.projectId !== undefined || query.assigneeId !== undefined || query.overdue === true || query.sort !== "desc";
  const projectOptions = [{ label: "All projects", value: "" }, ...projects.map((project) => ({ label: project.name, value: project.id }))];
  const userOptions = [{ label: "All assignees", value: "" }, ...users.map((user) => ({ label: getUserName(user), value: user.id }))];

  return (
    <section aria-label="Task filters" className="grid gap-3 rounded-2xl border border-border/70 bg-surface/75 p-4 shadow-xs backdrop-blur md:grid-cols-2 xl:grid-cols-[minmax(0,1fr)_150px_150px_180px_180px_150px_auto]">
      <Input
        aria-label="Search tasks"
        placeholder="Search tasks"
        value={query.search ?? ""}
        onChange={(event) => onQueryChange({ ...query, page: 1, search: event.target.value.trim().length > 0 ? event.target.value : undefined })}
      />
      <Select aria-label="Filter tasks by status" options={statusOptions} value={query.status ?? ""} onChange={(event) => onQueryChange({ ...query, page: 1, status: event.target.value.length > 0 ? event.target.value as TaskStatus : undefined })} />
      <Select aria-label="Filter tasks by priority" options={priorityOptions} value={query.priority ?? ""} onChange={(event) => onQueryChange({ ...query, page: 1, priority: event.target.value.length > 0 ? event.target.value as TaskPriority : undefined })} />
      <Select aria-label="Filter tasks by project" options={projectOptions} value={query.projectId ?? ""} onChange={(event) => onQueryChange({ ...query, page: 1, projectId: event.target.value.length > 0 ? event.target.value : undefined })} />
      <Select aria-label="Filter tasks by assignee" options={userOptions} value={query.assigneeId ?? ""} onChange={(event) => onQueryChange({ ...query, page: 1, assigneeId: event.target.value.length > 0 ? event.target.value : undefined })} />
      <Select aria-label="Filter overdue tasks" options={overdueOptions} value={query.overdue === true ? "true" : ""} onChange={(event) => onQueryChange({ ...query, page: 1, overdue: event.target.value === "true" ? true : undefined })} />
      <div className="flex gap-2 md:col-span-2 xl:col-span-1">
        <Select aria-label="Sort tasks" className="min-w-36" options={sortOptions} value={query.sort ?? "desc"} onChange={(event) => onQueryChange({ ...query, page: 1, sort: event.target.value === "asc" ? "asc" : "desc" })} />
        <Button disabled={!hasFilters} type="button" variant="neutral" onClick={() => onQueryChange({ page: 1, limit: query.limit, sort: "desc" })}>
          <X aria-hidden="true" className="h-4 w-4" />
          Clear
        </Button>
      </div>
    </section>
  );
}