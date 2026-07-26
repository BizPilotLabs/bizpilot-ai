import { type ReactElement, type ReactNode } from "react";
import { Card } from "@/components/ui";

export interface DashboardEmptyCardProps {
  icon: ReactNode;
  title: string;
  message: string;
}

export function DashboardEmptyCard({ icon, title, message }: DashboardEmptyCardProps): ReactElement {
  return (
    <Card className="flex min-h-64 items-center justify-center border-dashed">
      <div className="grid max-w-xs justify-items-center gap-3 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">{icon}</div>
        <div className="grid gap-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
      </div>
    </Card>
  );
}
