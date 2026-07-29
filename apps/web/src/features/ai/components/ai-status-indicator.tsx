import { AlertTriangle, CheckCircle2, CircleOff, Clock3 } from "lucide-react";
import type { ReactElement } from "react";
import { Badge } from "@/components/ui";
import type { AiHealthResponse, AiHealthStatus } from "../types";

const statusConfig: Record<AiHealthStatus, { label: string; detail: string; variant: "success" | "warning" | "danger" | "neutral"; icon: typeof CheckCircle2 }> = {
  healthy: { label: "Ready", detail: "Copilot is ready", variant: "success", icon: CheckCircle2 },
  degraded: { label: "Degraded", detail: "Copilot may be slower than usual", variant: "warning", icon: Clock3 },
  unavailable: { label: "Unavailable", detail: "Copilot is temporarily unavailable", variant: "danger", icon: AlertTriangle },
  disabled: { label: "Disabled", detail: "Copilot is disabled for this deployment", variant: "neutral", icon: CircleOff }
};

export function AiStatusIndicator({ health }: { health: AiHealthResponse }): ReactElement {
  const config = statusConfig[health.status];
  const Icon = config.icon;
  const detail = health.reason ?? config.detail;

  return (
    <div className="flex flex-wrap items-center gap-2" aria-label={`AI status: ${config.label}. ${detail}`}>
      <Badge variant={config.variant} className="w-fit">
        <Icon aria-hidden="true" className="h-3.5 w-3.5" />
        {config.label}
      </Badge>
      <span className="text-xs text-muted-foreground">
        {health.provider !== "disabled" ? `${health.provider} / ${health.model}` : "Deployment controlled"} - {detail}
      </span>
    </div>
  );
}
