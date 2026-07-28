import { type ReactElement } from "react";

export function ActivityPageHeader(): ReactElement {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-h3">Activity</h2>
      <p className="max-w-2xl text-sm leading-6 text-muted-foreground">Review organization-scoped audit history for important account, access, and workspace changes.</p>
    </div>
  );
}
