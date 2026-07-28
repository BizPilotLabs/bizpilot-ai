import { X } from "lucide-react";
import { type ReactElement } from "react";
import { Button, Input, Select } from "@/components/ui";
import type { ProjectListQuery, ProjectStatus } from "../types";

export interface ProjectListControlsProps {
  query: ProjectListQuery;
  onQueryChange: (query: ProjectListQuery) => void;
}

const statusOptions = [
  { label: "All statuses", value: "" },
  { label: "Planned", value: "PLANNED" },
  { label: "Active", value: "ACTIVE" },
  { label: "On hold", value: "ON_HOLD" },
  { label: "Completed", value: "COMPLETED" },
  { label: "Cancelled", value: "CANCELLED" }
];

const archivedOptions = [
  { label: "Active projects", value: "false" },
  { label: "Archived projects", value: "true" },
  { label: "All archive states", value: "" }
];

const sortOptions = [
  { label: "Newest first", value: "desc" },
  { label: "Oldest first", value: "asc" }
];

export function ProjectListControls({ query, onQueryChange }: ProjectListControlsProps): ReactElement {
  const hasFilters = Boolean(query.search) || query.status !== undefined || query.archived !== false || query.sort !== "desc";

  return (
    <section aria-label="Project filters" className="grid gap-3 rounded-2xl border border-border/70 bg-surface/75 p-4 shadow-xs backdrop-blur sm:grid-cols-[minmax(0,1fr)_180px_180px_150px_auto]">
      <Input
        aria-label="Search projects"
        placeholder="Search projects"
        value={query.search ?? ""}
        onChange={(event) => onQueryChange({ ...query, page: 1, search: event.target.value.trim().length > 0 ? event.target.value : undefined })}
      />
      <Select
        aria-label="Filter projects by status"
        options={statusOptions}
        value={query.status ?? ""}
        onChange={(event) => onQueryChange({ ...query, page: 1, status: event.target.value.length > 0 ? event.target.value as ProjectStatus : undefined })}
      />
      <Select
        aria-label="Filter projects by archived state"
        options={archivedOptions}
        value={query.archived === undefined ? "" : String(query.archived)}
        onChange={(event) => onQueryChange({ ...query, page: 1, archived: event.target.value.length === 0 ? undefined : event.target.value === "true" })}
      />
      <Select
        aria-label="Sort projects"
        options={sortOptions}
        value={query.sort ?? "desc"}
        onChange={(event) => onQueryChange({ ...query, page: 1, sort: event.target.value === "asc" ? "asc" : "desc" })}
      />
      <Button disabled={!hasFilters} type="button" variant="neutral" onClick={() => onQueryChange({ page: 1, limit: query.limit, sort: "desc", archived: false })}>
        <X aria-hidden="true" className="h-4 w-4" />
        Clear
      </Button>
    </section>
  );
}