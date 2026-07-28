import { type ReactElement } from "react";
import { Badge, Modal } from "@/components/ui";
import { formatActivityDescription, formatActivityTimestamp, getActorName, getSafeMetadataItems } from "../utils";
import type { Activity } from "../types";

export interface ActivityDetailsDialogProps {
  activity: Activity | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ActivityDetailsDialog({ activity, open, onOpenChange }: ActivityDetailsDialogProps): ReactElement {
  const metadataItems = activity ? getSafeMetadataItems(activity.metadata, 20) : [];

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Activity details" description="Sanitized audit information for this organization event.">
      {activity ? (
        <div className="grid gap-5">
          <div className="grid gap-2">
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">{activity.resource}</Badge>
              <Badge variant="neutral">{activity.type}</Badge>
            </div>
            <p className="text-sm font-medium leading-6">{formatActivityDescription(activity)}</p>
          </div>
          <dl className="grid gap-3 rounded-2xl border border-border/60 bg-background/45 p-4 text-sm">
            <div className="grid gap-1 sm:grid-cols-3">
              <dt className="text-muted-foreground">Actor</dt>
              <dd className="sm:col-span-2">{getActorName(activity)}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-3">
              <dt className="text-muted-foreground">Action</dt>
              <dd className="break-words sm:col-span-2">{activity.action}</dd>
            </div>
            <div className="grid gap-1 sm:grid-cols-3">
              <dt className="text-muted-foreground">Timestamp</dt>
              <dd className="sm:col-span-2">{formatActivityTimestamp(activity.createdAt)}</dd>
            </div>
            {metadataItems.map((item) => (
              <div key={`${activity.id}-${item.label}`} className="grid gap-1 sm:grid-cols-3">
                <dt className="text-muted-foreground">{item.label}</dt>
                <dd className="break-words sm:col-span-2">{item.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      ) : null}
    </Modal>
  );
}
