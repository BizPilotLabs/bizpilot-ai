import { type ReactElement, type ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui";

export interface DashboardPanelProps {
  title: string;
  description: string;
  children: ReactNode;
}

export function DashboardPanel({ title, description, children }: DashboardPanelProps): ReactElement {
  return (
    <Card className="min-h-80">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
