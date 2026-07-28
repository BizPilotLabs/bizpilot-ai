import { History } from "lucide-react";
import { type ReactElement } from "react";
import { Card } from "@/components/ui";

export interface ActivityEmptyStateProps {
  filtered: boolean;
}

export function ActivityEmptyState({ filtered }: ActivityEmptyStateProps): ReactElement {
  return (
    <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-muted/35 p-8 text-center">
      <div className="mx-auto grid max-w-md justify-items-center gap-3">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-surface-raised text-primary">
          <History aria-hidden="true" className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">{filtered ? "No matching activity" : "No activity yet"}</h3>
        <p className="text-sm leading-6 text-muted-foreground">
          {filtered ? "Try clearing filters or widening the date range." : "Important organization changes will appear here as your workspace is used."}
        </p>
      </div>
    </Card>
  );
}
