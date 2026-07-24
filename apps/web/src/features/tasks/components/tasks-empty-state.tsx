import { SquareCheckBig } from "lucide-react";
import { type ReactElement } from "react";
import { Card } from "@/components/ui";

export function TasksEmptyState(): ReactElement {
  return (
    <Card className="flex min-h-96 items-center justify-center border-dashed">
      <div className="mx-auto grid max-w-sm justify-items-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
          <SquareCheckBig aria-hidden="true" className="h-7 w-7" />
        </div>
        <div className="grid gap-2">
          <h2 className="text-h4">No tasks yet</h2>
          <p className="text-sm text-muted-foreground">Create your first task to start tracking work.</p>
        </div>
      </div>
    </Card>
  );
}

