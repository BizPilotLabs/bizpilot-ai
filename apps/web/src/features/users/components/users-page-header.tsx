import { type ReactElement } from "react";

export function UsersPageHeader(): ReactElement {
  return (
    <div className="grid gap-1">
      <h2 className="text-h3">Users</h2>
      <p className="text-sm text-muted-foreground">View members from your organization.</p>
    </div>
  );
}
