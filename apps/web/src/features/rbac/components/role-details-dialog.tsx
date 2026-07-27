import { type ReactElement } from "react";
import { Badge, Modal } from "@/components/ui";
import type { Role } from "../types";

export interface RoleDetailsDialogProps {
  role: Role | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const formatDate = (value: string): string => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function RoleDetailsDialog({ role, open, onOpenChange }: RoleDetailsDialogProps): ReactElement {
  if (role === null) {
    return <Modal open={open} onOpenChange={onOpenChange} title="Role Details">No role selected.</Modal>;
  }

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Role Details" description="Tenant-scoped role and assigned permissions." className="w-[min(94vw,44rem)]">
      <div className="grid gap-5">
        <div className="rounded-2xl border border-border/70 bg-background/45 p-4">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-semibold">{role.name}</h3>
            <Badge variant={role.isSystem ? "primary" : "neutral"}>{role.isSystem ? "System" : "Custom"}</Badge>
          </div>
          <p className="mt-2 text-sm leading-6 text-muted-foreground">{role.description ?? "No description provided."}</p>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          <div className="rounded-xl bg-muted/45 px-3 py-2"><dt className="text-muted-foreground">Users</dt><dd className="font-medium">{role.userCount}</dd></div>
          <div className="rounded-xl bg-muted/45 px-3 py-2"><dt className="text-muted-foreground">Permissions</dt><dd className="font-medium">{role.permissions.length}</dd></div>
          <div className="rounded-xl bg-muted/45 px-3 py-2"><dt className="text-muted-foreground">Created</dt><dd className="font-medium">{formatDate(role.createdAt)}</dd></div>
          <div className="rounded-xl bg-muted/45 px-3 py-2"><dt className="text-muted-foreground">Updated</dt><dd className="font-medium">{formatDate(role.updatedAt)}</dd></div>
        </dl>
        <div className="grid gap-2">
          <h4 className="text-sm font-medium">Assigned Permissions</h4>
          <div className="flex flex-wrap gap-2">
            {role.permissions.length > 0 ? role.permissions.map((permission) => <Badge key={permission.id} variant="neutral">{permission.key}</Badge>) : <Badge variant="neutral">No permissions</Badge>}
          </div>
        </div>
      </div>
    </Modal>
  );
}
