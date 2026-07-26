import { AlertCircle, RefreshCw } from "lucide-react";
import { type ReactElement } from "react";
import { Button, Card } from "@/components/ui";

export interface TeamsErrorStateProps {
  isRetrying: boolean;
  message: string;
  onRetry: () => void;
}

export function TeamsErrorState({ isRetrying, message, onRetry }: TeamsErrorStateProps): ReactElement {
  return (
    <Card className="flex min-h-80 items-center justify-center border-danger/20 bg-danger/5">
      <div className="mx-auto grid max-w-md justify-items-center gap-4 px-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-danger/20 bg-danger/10 text-danger">
          <AlertCircle aria-hidden="true" className="h-7 w-7" />
        </div>
        <div className="grid gap-2">
          <h2 className="text-h4">Teams could not be loaded</h2>
          <p className="text-sm text-muted-foreground">{message}</p>
        </div>
        <Button isLoading={isRetrying} leftIcon={<RefreshCw aria-hidden="true" className="h-4 w-4" />} type="button" variant="neutral" onClick={onRetry}>
          Retry
        </Button>
      </div>
    </Card>
  );
}
