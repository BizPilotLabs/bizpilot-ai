import { RefreshCw } from "lucide-react";
import { type ReactElement } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import type { DashboardMetric } from "../types";

export interface DashboardSummaryCardProps {
  metric: DashboardMetric;
}

export function DashboardSummaryCard({ metric }: DashboardSummaryCardProps): ReactElement {
  const Icon = metric.icon;

  return (
    <Card className="p-5">
      <div className="flex items-start justify-between gap-4">
        <div className="grid gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-border bg-muted text-muted-foreground">
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="grid gap-1">
            <p className="text-sm text-muted-foreground">{metric.label}</p>
            {metric.isLoading ? <Skeleton className="h-9 w-20" /> : null}
            {!metric.isLoading && !metric.isError ? <p className="text-3xl font-semibold tracking-normal">{metric.value?.toLocaleString() ?? "0"}</p> : null}
            {!metric.isLoading && metric.isError ? (
              <Button leftIcon={<RefreshCw aria-hidden="true" className="h-4 w-4" />} size="sm" type="button" variant="neutral" onClick={metric.onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-muted-foreground">{metric.isError ? "This metric could not be loaded." : metric.description}</p>
    </Card>
  );
}
