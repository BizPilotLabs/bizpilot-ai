import { motion } from "framer-motion";
import { Clock3, Eye, UserRound } from "lucide-react";
import { type ReactElement } from "react";
import { Avatar, Badge, Button, Card } from "@/components/ui";
import { cardHover, slideUp } from "@/lib";
import { formatActivityDescription, formatActivityTimestamp, getActorName, getSafeMetadataItems } from "../utils";
import type { Activity } from "../types";

export interface ActivityCardProps {
  activity: Activity;
  onViewDetails: (activity: Activity) => void;
}

const resourceVariantMap: Record<string, "neutral" | "primary" | "secondary" | "success" | "warning" | "danger"> = {
  auth: "warning",
  organization: "primary",
  user: "secondary",
  role: "danger",
  project: "primary",
  task: "success",
  team: "secondary",
  comment: "neutral",
  attachment: "neutral"
};

export function ActivityCard({ activity, onViewDetails }: ActivityCardProps): ReactElement {
  const actorName = getActorName(activity);
  const timestamp = formatActivityTimestamp(activity.createdAt);
  const metadataItems = getSafeMetadataItems(activity.metadata, 3);
  const initials = actorName
    .split(" ")
    .map((part) => part.charAt(0))
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.article variants={slideUp} {...cardHover}>
      <Card className="group overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-muted/30 p-5 transition-all duration-300 hover:-translate-y-0.5 hover:border-foreground/20 hover:shadow-[0_18px_60px_hsl(var(--shadow-color)/0.12)]">
        <div className="flex gap-4">
          <Avatar alt={actorName} name={initials || actorName} src={activity.actor?.avatar ?? undefined} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="grid min-w-0 gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant={resourceVariantMap[activity.resource] ?? "neutral"}>{activity.resource}</Badge>
                  <Badge variant="neutral">{activity.type}</Badge>
                </div>
                <p className="break-words text-sm font-medium leading-6 text-foreground">{formatActivityDescription(activity)}</p>
              </div>
              <Button aria-label={`View details for ${activity.type}`} size="sm" variant="ghost" onClick={() => onViewDetails(activity)}>
                <Eye aria-hidden="true" className="h-4 w-4" />
                Details
              </Button>
            </div>
            <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1.5">
                <UserRound aria-hidden="true" className="h-3.5 w-3.5" />
                {activity.actor?.email ?? (activity.userId === null ? "System event" : "Deleted user")}
              </span>
              <time className="inline-flex items-center gap-1.5" dateTime={activity.createdAt} title={activity.createdAt}>
                <Clock3 aria-hidden="true" className="h-3.5 w-3.5" />
                {timestamp}
              </time>
            </div>
            {metadataItems.length > 0 ? (
              <dl className="mt-4 grid gap-2 rounded-2xl border border-border/50 bg-background/45 p-3 text-xs sm:grid-cols-3">
                {metadataItems.map((item) => (
                  <div key={`${activity.id}-${item.label}`} className="min-w-0">
                    <dt className="text-muted-foreground">{item.label}</dt>
                    <dd className="truncate font-medium text-foreground" title={item.value}>{item.value}</dd>
                  </div>
                ))}
              </dl>
            ) : null}
          </div>
        </div>
      </Card>
    </motion.article>
  );
}

