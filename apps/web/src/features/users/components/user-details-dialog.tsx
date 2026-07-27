import { CalendarDays, Mail, ShieldCheck, UserRound } from "lucide-react";
import { type ReactElement } from "react";
import { Avatar, Badge, Modal } from "@/components/ui";
import type { UserProfile, UserStatus } from "../types";

export interface UserDetailsDialogProps {
  user: UserProfile | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const statusVariantMap: Record<UserStatus, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  INVITED: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  DISABLED: "neutral"
};

const formatEnum = (value: string): string => value.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());
const formatDate = (value: string | null): string => {
  if (value === null) return "Never";
  return new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
};
const getDisplayName = (user: UserProfile): string => `${user.firstName} ${user.lastName}`.trim() || user.email;

export function UserDetailsDialog({ user, open, onOpenChange }: UserDetailsDialogProps): ReactElement {
  if (user === null) {
    return <Modal open={open} onOpenChange={onOpenChange} title="User Details">No user selected.</Modal>;
  }

  const displayName = getDisplayName(user);

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="User Details" description="Organization-scoped user profile returned by the backend.">
      <div className="grid gap-5">
        <div className="flex items-start gap-4 rounded-2xl border border-border/70 bg-background/45 p-4">
          <Avatar name={displayName} src={user.avatar ?? undefined} size="lg" />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-lg font-semibold">{displayName}</h3>
            <p className="truncate text-sm text-muted-foreground">{user.email}</p>
            <Badge className="mt-3 w-fit" variant={statusVariantMap[user.status]}>{formatEnum(user.status)}</Badge>
          </div>
        </div>
        <dl className="grid gap-3 text-sm">
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 px-3 py-2">
            <dt className="flex items-center gap-2 text-muted-foreground"><Mail aria-hidden="true" className="h-4 w-4" />Email</dt>
            <dd className="font-medium">{user.emailVerified ? "Verified" : "Unverified"}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 px-3 py-2">
            <dt className="flex items-center gap-2 text-muted-foreground"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Roles</dt>
            <dd className="flex flex-wrap justify-end gap-2">{user.roles.map((role) => <Badge key={role.id} variant={role.isSystem ? "primary" : "neutral"}>{role.name}</Badge>)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 px-3 py-2">
            <dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays aria-hidden="true" className="h-4 w-4" />Created</dt>
            <dd className="font-medium">{formatDate(user.createdAt)}</dd>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-xl bg-muted/45 px-3 py-2">
            <dt className="flex items-center gap-2 text-muted-foreground"><UserRound aria-hidden="true" className="h-4 w-4" />Last Login</dt>
            <dd className="font-medium">{formatDate(user.lastLoginAt)}</dd>
          </div>
        </dl>
      </div>
    </Modal>
  );
}
