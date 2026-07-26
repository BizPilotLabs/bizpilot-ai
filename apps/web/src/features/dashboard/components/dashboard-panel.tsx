import { type ReactElement, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export interface DashboardPanelProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function DashboardPanel({ title, description, children }: DashboardPanelProps): ReactElement {
  return (
    <Card className="min-h-80 overflow-hidden bg-gradient-to-br from-card via-card to-muted/25">
      <CardHeader className="border-b border-border/60 bg-surface-raised/35">
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="pt-5">{children}</CardContent>
    </Card>
  );
}
