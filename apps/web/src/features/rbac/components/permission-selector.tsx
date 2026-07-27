import { type ReactElement } from "react";
import { Badge, Button, Checkbox } from "@/components/ui";
import type { Permission } from "../types";

export interface PermissionSelectorProps {
  permissions: Permission[];
  selectedPermissionIds: string[];
  disabled?: boolean;
  error?: string | undefined;
  onChange: (permissionIds: string[]) => void;
}

const toTitle = (value: string): string => value.replace(/[_-]+/gu, " ").replace(/\b\w/gu, (letter) => letter.toUpperCase());

const groupPermissions = (permissions: Permission[]): [string, Permission[]][] => {
  const grouped = new Map<string, Permission[]>();

  for (const permission of permissions) {
    const current = grouped.get(permission.resource) ?? [];
    current.push(permission);
    grouped.set(permission.resource, current);
  }

  return [...grouped.entries()].sort(([left], [right]) => left.localeCompare(right));
};

export function PermissionSelector({ permissions, selectedPermissionIds, disabled = false, error, onChange }: PermissionSelectorProps): ReactElement {
  const selected = new Set(selectedPermissionIds);

  const togglePermission = (permissionId: string, checked: boolean): void => {
    if (checked) {
      onChange([...selected, permissionId]);
      return;
    }

    onChange(selectedPermissionIds.filter((selectedPermissionId) => selectedPermissionId !== permissionId));
  };

  const selectModule = (permissionIds: string[]): void => {
    onChange([...new Set([...selectedPermissionIds, ...permissionIds])]);
  };

  const clearModule = (permissionIds: string[]): void => {
    const clearSet = new Set(permissionIds);
    onChange(selectedPermissionIds.filter((permissionId) => !clearSet.has(permissionId)));
  };

  return (
    <fieldset className="grid gap-4">
      <legend className="flex items-center gap-2 text-sm font-medium text-foreground">
        Permissions
        <Badge variant="primary">{selectedPermissionIds.length} selected</Badge>
      </legend>
      <div className="grid gap-4">
        {groupPermissions(permissions).map(([resource, resourcePermissions]) => {
          const permissionIds = resourcePermissions.map((permission) => permission.id);
          const selectedCount = permissionIds.filter((permissionId) => selected.has(permissionId)).length;

          return (
            <section key={resource} className="rounded-2xl border border-border/70 bg-background/45 p-4">
              <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border/60 pb-3">
                <div>
                  <h4 className="font-medium text-foreground">{toTitle(resource)}</h4>
                  <p className="text-xs text-muted-foreground">{selectedCount} of {resourcePermissions.length} selected</p>
                </div>
                <div className="flex gap-2">
                  <Button disabled={disabled} size="sm" type="button" variant="neutral" onClick={() => selectModule(permissionIds)}>Select all</Button>
                  <Button disabled={disabled} size="sm" type="button" variant="ghost" onClick={() => clearModule(permissionIds)}>Clear</Button>
                </div>
              </div>
              <div className="mt-3 grid gap-3">
                {resourcePermissions.map((permission) => (
                  <div key={permission.id} className="grid gap-1 rounded-xl px-2 py-2 transition hover:bg-muted/50">
                    <Checkbox
                      checked={selected.has(permission.id)}
                      disabled={disabled}
                      label={`${permission.name} (${permission.key})`}
                      onChange={(event) => togglePermission(permission.id, event.currentTarget.checked)}
                    />
                    {permission.description ? <p className="pl-7 text-xs leading-5 text-muted-foreground">{permission.description}</p> : null}
                  </div>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      {error ? <p className="text-sm text-danger">{error}</p> : null}
    </fieldset>
  );
}
