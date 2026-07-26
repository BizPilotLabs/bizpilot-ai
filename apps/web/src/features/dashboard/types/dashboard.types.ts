import type { LucideIcon } from "lucide-react";

export interface DashboardMetric {
  id: string;
  label: string;
  value: number | null;
  description: string;
  icon: LucideIcon;
  isError: boolean;
  isLoading: boolean;
  onRetry: () => void;
}
