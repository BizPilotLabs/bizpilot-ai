import { Search } from "lucide-react";
import { type ReactElement } from "react";
import { Input, Select } from "@/components/ui";
import type { RoleSort } from "../types";

export interface RolesToolbarProps {
  search: string;
  sort: RoleSort;
  onSearchChange: (search: string) => void;
  onSortChange: (sort: RoleSort) => void;
}

export function RolesToolbar({ search, sort, onSearchChange, onSortChange }: RolesToolbarProps): ReactElement {
  return (
    <div className="grid gap-3 rounded-2xl border border-border/70 bg-surface/75 p-3 shadow-xs backdrop-blur-xl sm:grid-cols-[1fr_14rem]">
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search roles" className="pl-9" placeholder="Search roles" value={search} onChange={(event) => onSearchChange(event.currentTarget.value)} />
      </div>
      <Select
        aria-label="Sort roles"
        options={[
          { label: "Name", value: "name" },
          { label: "Created date", value: "createdAt" },
          { label: "Updated date", value: "updatedAt" },
          { label: "Permission count", value: "permissions" },
          { label: "User count", value: "users" }
        ]}
        value={sort}
        onChange={(event) => onSortChange(event.currentTarget.value as RoleSort)}
      />
    </div>
  );
}
