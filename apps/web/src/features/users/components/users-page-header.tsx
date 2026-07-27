import { UserPlus } from "lucide-react";
import { type ReactElement } from "react";
import { Button } from "@/components/ui";

export interface UsersPageHeaderProps {
  canCreateUser: boolean;
  onCreateUser: () => void;
}

export function UsersPageHeader({ canCreateUser, onCreateUser }: UsersPageHeaderProps): ReactElement {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="grid gap-1">
        <h2 className="text-h3">Users</h2>
        <p className="text-sm text-muted-foreground">Manage organization members, roles, and access.</p>
      </div>
      {canCreateUser ? (
        <Button leftIcon={<UserPlus aria-hidden="true" className="h-4 w-4" />} onClick={onCreateUser}>
          Invite User
        </Button>
      ) : null}
    </div>
  );
}
