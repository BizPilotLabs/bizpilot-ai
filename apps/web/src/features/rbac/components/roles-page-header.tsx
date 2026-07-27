import { ShieldPlus } from "lucide-react";
import { type ReactElement } from "react";
import { Button } from "@/components/ui";

export interface RolesPageHeaderProps {
  canCreate: boolean;
  onCreate: () => void;
}

export function RolesPageHeader({ canCreate, onCreate }: RolesPageHeaderProps): ReactElement {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="grid gap-1">
        <h2 className="text-h3">Roles & Permissions</h2>
        <p className="text-sm text-muted-foreground">Manage custom access roles and inspect protected system roles.</p>
      </div>
      {canCreate ? <Button leftIcon={<ShieldPlus aria-hidden="true" className="h-4 w-4" />} onClick={onCreate}>Create Role</Button> : null}
    </div>
  );
}
