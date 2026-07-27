import { CalendarDays, Globe2, Hash, MapPin } from "lucide-react";
import { type ReactElement } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui";
import type { OrganizationProfile } from "../types";

export interface OrganizationSummaryCardProps {
  organization: OrganizationProfile;
}

const formatDate = (value: string): string => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));

export function OrganizationSummaryCard({ organization }: OrganizationSummaryCardProps): ReactElement {
  return (
    <Card className="overflow-hidden bg-gradient-to-br from-card via-card to-secondary/5">
      <div className="h-1 bg-gradient-to-r from-secondary via-primary/50 to-transparent" />
      <CardHeader>
        <CardTitle>Workspace Identity</CardTitle>
      </CardHeader>
      <CardContent className="grid gap-5">
        <div className="flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border border-border/70 bg-background text-xl font-semibold shadow-xs">
            {organization.logo ? <img alt="" className="h-full w-full object-cover" src={organization.logo} /> : organization.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-lg font-semibold">{organization.name}</h3>
            <p className="truncate text-sm text-muted-foreground">{organization.slug}</p>
          </div>
        </div>
        <dl className="grid gap-2 text-sm">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 px-3 py-2">
            <dt className="flex items-center gap-2 text-muted-foreground"><Hash aria-hidden="true" className="h-4 w-4" />Organization ID</dt>
            <dd className="max-w-44 truncate font-medium" title={organization.id}>{organization.id}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 px-3 py-2">
            <dt className="flex items-center gap-2 text-muted-foreground"><Globe2 aria-hidden="true" className="h-4 w-4" />Timezone</dt>
            <dd className="font-medium">{organization.timezone}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 px-3 py-2">
            <dt className="flex items-center gap-2 text-muted-foreground"><MapPin aria-hidden="true" className="h-4 w-4" />Country</dt>
            <dd className="font-medium">{organization.country ?? "Not set"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 px-3 py-2">
            <dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays aria-hidden="true" className="h-4 w-4" />Created</dt>
            <dd className="font-medium">{formatDate(organization.createdAt)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
