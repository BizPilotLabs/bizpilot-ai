import { Check, ChevronDown, UserRound } from "lucide-react";
import { useRef, type MouseEvent, type ReactElement } from "react";
import { Avatar } from "@/components/ui";
import { cn } from "@/utils";
import type { UserProfile } from "@/features/users";

export interface TaskAssigneeMenuProps {
  assignee: UserProfile | null;
  currentAssigneeId: string | null;
  disabled?: boolean;
  hasUsersError?: boolean;
  isLoadingUsers?: boolean;
  users: UserProfile[];
  onAssigneeChange: (assigneeId: string | null) => void;
}

const getUserDisplayName = (user: UserProfile): string => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name.length > 0 ? name : user.email;
};

export function TaskAssigneeMenu({
  assignee,
  currentAssigneeId,
  disabled = false,
  hasUsersError = false,
  isLoadingUsers = false,
  users,
  onAssigneeChange
}: TaskAssigneeMenuProps): ReactElement {
  const detailsRef = useRef<HTMLDetailsElement>(null);
  const assigneeLabel = currentAssigneeId === null ? "Unassigned" : assignee === null ? "Unknown user" : getUserDisplayName(assignee);

  const stopCardClick = (event: MouseEvent): void => {
    event.stopPropagation();
  };

  const handleSelect = (assigneeId: string | null) => (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    detailsRef.current?.removeAttribute("open");

    if (assigneeId !== currentAssigneeId && !disabled) {
      onAssigneeChange(assigneeId);
    }
  };

  return (
    <details ref={detailsRef} className="group relative inline-block max-w-full" onClick={stopCardClick}>
      <summary
        aria-label={`Change task assignee. Current assignee: ${assigneeLabel}`}
        className={cn(
          "list-none rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background [&::-webkit-details-marker]:hidden",
          disabled && "pointer-events-none opacity-60"
        )}
      >
        <span className="inline-flex max-w-48 cursor-pointer items-center gap-2 rounded-full border border-border bg-surface px-2.5 py-1 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-muted">
          {assignee === null ? (
            <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
              <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
            </span>
          ) : (
            <Avatar name={getUserDisplayName(assignee)} src={assignee.avatar ?? undefined} size="sm" className="h-6 w-6 text-[10px]" />
          )}
          <span className="truncate">{assigneeLabel}</span>
          <ChevronDown aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
        </span>
      </summary>
      <div className="absolute right-0 z-40 mt-2 max-h-80 w-72 overflow-y-auto rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-lg">
        <button
          aria-current={currentAssigneeId === null ? "true" : undefined}
          className={cn(
            "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted",
            currentAssigneeId === null && "text-primary"
          )}
          disabled={disabled}
          type="button"
          onClick={handleSelect(null)}
        >
          <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-muted-foreground">
            <UserRound aria-hidden="true" className="h-4 w-4" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-medium">Unassigned</span>
            <span className="block truncate text-xs text-muted-foreground">Remove assignee</span>
          </span>
          {currentAssigneeId === null ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
        </button>

        {isLoadingUsers ? <div className="px-3 py-2 text-sm text-muted-foreground">Loading users...</div> : null}
        {hasUsersError ? <div className="px-3 py-2 text-sm text-danger">Unable to load users.</div> : null}
        {!isLoadingUsers && !hasUsersError && users.length === 0 ? <div className="px-3 py-2 text-sm text-muted-foreground">No users available.</div> : null}

        {!isLoadingUsers && !hasUsersError
          ? users.map((user) => {
              const displayName = getUserDisplayName(user);
              const isCurrent = user.id === currentAssigneeId;

              return (
                <button
                  key={user.id}
                  aria-current={isCurrent ? "true" : undefined}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors hover:bg-muted focus-visible:bg-muted",
                    isCurrent && "text-primary"
                  )}
                  disabled={disabled}
                  type="button"
                  onClick={handleSelect(user.id)}
                >
                  <Avatar name={displayName} src={user.avatar ?? undefined} size="sm" className="h-8 w-8" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{displayName}</span>
                    <span className="block truncate text-xs text-muted-foreground">{user.email}</span>
                  </span>
                  {isCurrent ? <Check aria-hidden="true" className="h-4 w-4 shrink-0" /> : null}
                </button>
              );
            })
          : null}
      </div>
    </details>
  );
}
