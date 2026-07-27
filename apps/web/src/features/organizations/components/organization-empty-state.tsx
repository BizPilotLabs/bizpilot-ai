import { Building2 } from "lucide-react";
import { type ReactElement } from "react";
import { Card } from "@/components/ui";

export function OrganizationEmptyState(): ReactElement {
  return (
    <Card className="grid min-h-72 place-items-center border-dashed bg-surface/60 p-8 text-center">
      <div className="grid max-w-md gap-3 justify-items-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
          <Building2 aria-hidden="true" className="h-5 w-5" />
        </div>
        <h3 className="text-lg font-semibold">Organization unavailable</h3>
        <p className="text-sm leading-6 text-muted-foreground">The current organization could not be loaded for this session.</p>
      </div>
    </Card>
  );
}
