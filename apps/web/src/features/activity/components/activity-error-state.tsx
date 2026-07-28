import { RefreshCcw } from "lucide-react";
import { type ReactElement } from "react";
import { Alert, Button, Card } from "@/components/ui";

export interface ActivityErrorStateProps {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
}

export function ActivityErrorState({ message, isRetrying, onRetry }: ActivityErrorStateProps): ReactElement {
  return (
    <Card className="p-6">
      <div className="grid gap-4">
        <Alert variant="danger" title="Unable to load activity">{message}</Alert>
        <div>
          <Button isLoading={isRetrying} leftIcon={<RefreshCcw aria-hidden="true" className="h-4 w-4" />} variant="neutral" onClick={onRetry}>
            Retry
          </Button>
        </div>
      </div>
    </Card>
  );
}

