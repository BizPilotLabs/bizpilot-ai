import { RefreshCw } from "lucide-react";
import { type ReactElement } from "react";
import { Button, Card, Skeleton } from "@/components/ui";
import { cn } from "@/utils";
import type { DashboardMetric } from "../types";

export interface DashboardSummaryCardProps {
  metric: DashboardMetric;
  featured?: boolean;
}

export function DashboardSummaryCard({ metric, featured = false }: DashboardSummaryCardProps): ReactElement {
  const Icon = metric.icon;

  return (
    <Card className={cn("relative overflow-hidden p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20", featured && "bg-gradient-to-br from-foreground to-foreground/86 text-background")}>
      <div className={cn("absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-primary/10", featured && "bg-background/10")} />
      <div className="relative flex items-start justify-between gap-4">
        <div className="grid gap-3">
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-2xl border border-border/70 bg-muted/70 text-muted-foreground", featured && "border-background/20 bg-background/10 text-background")}>
            <Icon aria-hidden="true" className="h-5 w-5" />
          </div>
          <div className="grid gap-1">
            <p className={cn("text-sm text-muted-foreground", featured && "text-background/72")}>{metric.label}</p>
            {metric.isLoading ? <Skeleton className="h-9 w-20" /> : null}
            {!metric.isLoading && !metric.isError ? <p className="text-3xl font-semibold tracking-normal">{metric.value?.toLocaleString() ?? "0"}</p> : null}
            {!metric.isLoading && metric.isError ? (
              <Button leftIcon={<RefreshCw aria-hidden="true" className="h-4 w-4" />} size="sm" type="button" variant={featured ? "subtle" : "neutral"} onClick={metric.onRetry}>
                Retry
              </Button>
            ) : null}
          </div>
        </div>
      </div>
      <p className={cn("relative mt-4 text-sm leading-6 text-muted-foreground", featured && "text-background/72")}>{metric.isError ? "This metric could not be loaded." : metric.description}</p>
    </Card>
  );
}
