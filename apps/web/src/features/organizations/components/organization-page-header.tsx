import { Building2 } from "lucide-react";
import { type ReactElement } from "react";
import { Badge } from "@/components/ui";
import type { OrganizationProfile } from "../types";

export interface OrganizationPageHeaderProps {
  organization: OrganizationProfile | null;
}

export function OrganizationPageHeader({ organization }: OrganizationPageHeaderProps): ReactElement {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 bg-surface text-primary shadow-xs">
          <Building2 aria-hidden="true" className="h-5 w-5" />
        </div>
        <div className="grid gap-1">
          <h2 className="text-h3">Organization</h2>
          <p className="text-sm text-muted-foreground">Manage profile, localization, and branding settings for your workspace.</p>
        </div>
      </div>
      {organization ? <Badge variant="primary">{organization.plan}</Badge> : null}
    </div>
  );
}
