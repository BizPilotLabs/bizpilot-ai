import { Search } from "lucide-react";
import { type FormEvent, type ReactElement } from "react";
import { Button, Input, Select } from "@/components/ui";
import type { UserSortDirection } from "../types";

export interface UsersToolbarProps {
  search: string;
  sort: UserSortDirection;
  limit: number;
  onSearchChange: (search: string) => void;
  onSearchSubmit: () => void;
  onSortChange: (sort: UserSortDirection) => void;
  onLimitChange: (limit: number) => void;
}

export function UsersToolbar({ search, sort, limit, onSearchChange, onSearchSubmit, onSortChange, onLimitChange }: UsersToolbarProps): ReactElement {
  const handleSubmit = (event: FormEvent<HTMLFormElement>): void => {
    event.preventDefault();
    onSearchSubmit();
  };

  return (
    <form className="grid gap-3 rounded-2xl border border-border/70 bg-surface/75 p-3 shadow-xs backdrop-blur-xl lg:grid-cols-[1fr_11rem_9rem_auto]" onSubmit={handleSubmit}>
      <div className="relative">
        <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input aria-label="Search users by name or email" className="pl-9" placeholder="Search users" value={search} onChange={(event) => onSearchChange(event.currentTarget.value)} />
      </div>
      <Select
        aria-label="Sort users"
        options={[
          { label: "Newest first", value: "desc" },
          { label: "Oldest first", value: "asc" }
        ]}
        value={sort}
        onChange={(event) => onSortChange(event.currentTarget.value as UserSortDirection)}
      />
      <Select
        aria-label="Users per page"
        options={[
          { label: "6 per page", value: "6" },
          { label: "12 per page", value: "12" },
          { label: "24 per page", value: "24" }
        ]}
        value={String(limit)}
        onChange={(event) => onLimitChange(Number(event.currentTarget.value))}
      />
      <Button type="submit" variant="neutral">
        Search
      </Button>
    </form>
  );
}
