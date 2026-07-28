import { RotateCcw } from "lucide-react";
import { type ReactElement } from "react";
import { Button, Card, Input, Select } from "@/components/ui";
import type { ActivitySortDirection } from "../types";

export interface ActivityFilterValues {
  search: string;
  action: string;
  resource: string;
  startDate: string;
  endDate: string;
  sort: ActivitySortDirection;
}

export interface ActivityFiltersProps {
  values: ActivityFilterValues;
  onChange: (values: ActivityFilterValues) => void;
  onClear: () => void;
}

const resourceOptions = [
  { label: "All resources", value: "" },
  { label: "Authentication", value: "auth" },
  { label: "Organization", value: "organization" },
  { label: "Users", value: "user" },
  { label: "Roles", value: "role" },
  { label: "Projects", value: "project" },
  { label: "Tasks", value: "task" },
  { label: "Teams", value: "team" },
  { label: "Comments", value: "comment" },
  { label: "Attachments", value: "attachment" }
];

const actionOptions = [
  { label: "All actions", value: "" },
  { label: "User created", value: "user.create" },
  { label: "User updated", value: "user.update" },
  { label: "User deleted", value: "user.delete" },
  { label: "User roles updated", value: "user.roles.update" },
  { label: "Organization updated", value: "organization.update" },
  { label: "Organization settings updated", value: "organization.settings.update" },
  { label: "Role created", value: "role.create" },
  { label: "Role updated", value: "role.update" },
  { label: "Role deleted", value: "role.delete" },
  { label: "Permissions updated", value: "role.permissions.update" },
  { label: "Project created", value: "project.create" },
  { label: "Project updated", value: "project.update" },
  { label: "Project deleted", value: "project.delete" },
  { label: "Task created", value: "task.create" },
  { label: "Task updated", value: "task.update" },
  { label: "Task deleted", value: "task.delete" },
  { label: "Task status changed", value: "task.status.change" },
  { label: "Task assignee changed", value: "task.assignee.change" },
  { label: "Team created", value: "team.create" },
  { label: "Team updated", value: "team.update" },
  { label: "Team deleted", value: "team.delete" },
  { label: "Team member added", value: "team.member.add" },
  { label: "Team member removed", value: "team.member.remove" },
  { label: "Comment created", value: "comment.create" },
  { label: "Comment updated", value: "comment.update" },
  { label: "Comment deleted", value: "comment.delete" },
  { label: "Attachment uploaded", value: "attachment.upload" },
  { label: "Attachment deleted", value: "attachment.delete" },
  { label: "Signed in", value: "auth.login" },
  { label: "Signed out", value: "auth.logout" }
];

const sortOptions = [
  { label: "Newest first", value: "desc" },
  { label: "Oldest first", value: "asc" }
];

export function ActivityFilters({ values, onChange, onClear }: ActivityFiltersProps): ReactElement {
  const update = (key: keyof ActivityFilterValues, value: string): void => {
    onChange({ ...values, [key]: value });
  };

  return (
    <Card className="border-border/60 bg-surface/80 p-4">
      <div className="grid gap-3 lg:grid-cols-[minmax(12rem,1fr)_repeat(5,minmax(9rem,12rem))_auto] lg:items-end">
        <Input label="Search" value={values.search} placeholder="Action, resource, or actor" onChange={(event) => update("search", event.target.value)} />
        <Select label="Action" value={values.action} options={actionOptions} onChange={(event) => update("action", event.target.value)} />
        <Select label="Resource" value={values.resource} options={resourceOptions} onChange={(event) => update("resource", event.target.value)} />
        <Input label="From" type="date" value={values.startDate} onChange={(event) => update("startDate", event.target.value)} />
        <Input label="To" type="date" value={values.endDate} onChange={(event) => update("endDate", event.target.value)} />
        <Select label="Sort" value={values.sort} options={sortOptions} onChange={(event) => update("sort", event.target.value)} />
        <Button className="lg:mb-0.5" leftIcon={<RotateCcw aria-hidden="true" className="h-4 w-4" />} type="button" variant="neutral" onClick={onClear}>
          Clear
        </Button>
      </div>
    </Card>
  );
}

