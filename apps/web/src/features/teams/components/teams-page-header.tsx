import { type ReactElement } from "react";

export function TeamsPageHeader(): ReactElement {
  return (
    <div className="grid gap-1">
      <h2 className="text-h3">Teams</h2>
      <p className="text-sm text-muted-foreground">View teams from your organization.</p>
    </div>
  );
}
