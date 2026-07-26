import { AlertCircle, RefreshCw } from "lucide-react";
import { type ReactElement } from "react";
import { Button, Card } from "@/components/ui";

export interface DashboardErrorCardProps {
  isRetrying: boolean;
  message: string;
  title: string;
  onRetry: () => void;
}

export function DashboardErrorCard({ isRetrying, message, title, onRetry }: DashboardErrorCardProps): ReactElement {
  return (
    <Card className="flex min-h-64 items-center justify-center border-danger/20 bg-danger/5">
      <div className="grid max-w-sm justify-items-center gap-4 px-6 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10 text-danger">
          <AlertCircle aria-hidden="true" className="h-6 w-6" />
        </div>
        <div className="grid gap-1">
          <h3 className="font-semibold">{title}</h3>
          <p className="text-sm leading-6 text-muted-foreground">{message}</p>
        </div>
        <Button isLoading={isRetrying} leftIcon={<RefreshCw aria-hidden="true" className="h-4 w-4" />} type="button" variant="neutral" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </Card>
  );
}
