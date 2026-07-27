import { type ReactElement } from "react";
import { Checkbox } from "@/components/ui";
import type { RoleSummary } from "../types";

export interface RoleCheckboxGroupProps {
  roles: RoleSummary[];
  selectedRoleIds: string[];
  disabled?: boolean;
  error?: string | undefined;
  onChange: (roleIds: string[]) => void;
}

export function RoleCheckboxGroup({ roles, selectedRoleIds, disabled = false, error, onChange }: RoleCheckboxGroupProps): ReactElement {
  const selected = new Set(selectedRoleIds);

  const toggleRole = (roleId: string, checked: boolean): void => {
    if (checked) {
      onChange([...selected, roleId]);
      return;
    }

    onChange(selectedRoleIds.filter((selectedRoleId) => selectedRoleId !== roleId));
  };

  return (
    <fieldset className="grid gap-3">
      <legend className="text-sm font-medium text-foreground">Roles</legend>
      <div className="grid gap-2 rounded-2xl border border-border/70 bg-background/45 p-3">
        {roles.map((role) => (
          <div key={role.id} className="flex items-start justify-between gap-4 rounded-xl px-2 py-2 transition-colors hover:bg-muted/50">
            <Checkbox
              checked={selected.has(role.id)}
              disabled={disabled}
              label={role.name}
              onChange={(event) => toggleRole(role.id, event.currentTarget.checked)}
            />
            {role.description ? <p className="max-w-56 text-right text-xs leading-5 text-muted-foreground">{role.description}</p> : null}
          </div>
        ))}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </fieldset>
  );
}
