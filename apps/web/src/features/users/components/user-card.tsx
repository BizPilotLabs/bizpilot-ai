import { motion } from "framer-motion";
import { CalendarDays, Mail, ShieldCheck, Building2, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactElement } from "react";
import { Avatar, Badge, Card, CardContent, CardHeader, CardTitle, Dropdown, DropdownButton } from "@/components/ui";
import { cardHover, slideUp } from "@/lib";
import type { UserProfile, UserStatus } from "../types";

export interface UserCardProps {
  user: UserProfile;
  canEdit: boolean;
  canDelete: boolean;
  onView: (user: UserProfile) => void;
  onEdit: (user: UserProfile) => void;
  onDelete: (user: UserProfile) => void;
}

const statusVariantMap: Record<UserStatus, "neutral" | "primary" | "success" | "warning" | "danger"> = {
  INVITED: "warning",
  ACTIVE: "success",
  SUSPENDED: "danger",
  DISABLED: "neutral"
};

const formatEnum = (value: string): string => value.replace(/_/gu, " ").toLowerCase().replace(/\b\w/gu, (letter) => letter.toUpperCase());

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));

const getUserDisplayName = (user: UserProfile): string => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name.length > 0 ? name : user.email;
};

const shortenIdentifier = (value: string): string => (value.length > 12 ? `${value.slice(0, 8)}...${value.slice(-4)}` : value);

const handleKeyboardActivation = (event: KeyboardEvent<HTMLElement>): void => {
  if (event.key === "Enter" || event.key === " ") {
    event.preventDefault();
    event.currentTarget.click();
  }
};

const stopPropagation = (event: MouseEvent): void => {
  event.stopPropagation();
};

export function UserCard({ user, canEdit, canDelete, onView, onEdit, onDelete }: UserCardProps): ReactElement {
  const displayName = getUserDisplayName(user);
  const primaryRoles = user.roles.slice(0, 3);
  const extraRoleCount = Math.max(0, user.roles.length - primaryRoles.length);
  const hasActions = canEdit || canDelete;

  return (
    <motion.article variants={slideUp} {...cardHover}>
      <Card
        aria-label={`User: ${displayName}`}
        className="group relative min-h-72 cursor-pointer overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-primary/5 transition-all duration-300 ease-premium hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_22px_70px_hsl(var(--shadow-color)/0.14)] focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => onView(user)}
        onKeyDown={handleKeyboardActivation}
        role="button"
        tabIndex={0}
      >
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-primary/70 via-primary/20 to-transparent" />
        {hasActions ? (
          <div className="absolute right-3 top-3 z-10" onClick={stopPropagation}>
            <Dropdown
              align="right"
              trigger={
                <button aria-label={`Open actions for ${displayName}`} className="rounded-full border border-border/70 bg-surface/90 p-2 text-muted-foreground shadow-xs transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" type="button">
                  <MoreHorizontal aria-hidden="true" className="h-4 w-4" />
                </button>
              }
            >
              {canEdit ? (
                <DropdownButton onClick={() => onEdit(user)}>
                  <Pencil aria-hidden="true" className="h-4 w-4" />
                  Edit user
                </DropdownButton>
              ) : null}
              {canDelete ? (
                <DropdownButton className="text-danger hover:bg-danger/10" onClick={() => onDelete(user)}>
                  <Trash2 aria-hidden="true" className="h-4 w-4" />
                  Delete user
                </DropdownButton>
              ) : null}
            </Dropdown>
          </div>
        ) : null}
        <CardHeader>
          <div className="flex items-start gap-4 pr-10">
            <Avatar name={displayName} src={user.avatar ?? undefined} size="lg" className="border-border/70 shadow-xs" />
            <div className="grid min-w-0 flex-1 gap-2">
              <div className="grid gap-1">
                <CardTitle className="truncate text-lg leading-snug">{displayName}</CardTitle>
                <p className="truncate text-sm text-muted-foreground">{user.email}</p>
              </div>
              <Badge className="w-fit" variant={statusVariantMap[user.status]}>{formatEnum(user.status)}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <div className="flex flex-wrap gap-2">
            {primaryRoles.length > 0 ? primaryRoles.map((role) => <Badge key={role.id} variant={role.isSystem ? "primary" : "neutral"}>{role.name}</Badge>) : <Badge variant="neutral">No roles</Badge>}
            {extraRoleCount > 0 ? <Badge variant="secondary">+{extraRoleCount}</Badge> : null}
          </div>
          <dl className="grid gap-2 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm">
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Mail aria-hidden="true" className="h-4 w-4" />
                Email
              </dt>
              <dd className="text-right font-medium text-foreground">{user.emailVerified ? "Verified" : "Unverified"}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <ShieldCheck aria-hidden="true" className="h-4 w-4" />
                Roles
              </dt>
              <dd className="text-right font-medium text-foreground">{user.roles.length.toLocaleString()}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <Building2 aria-hidden="true" className="h-4 w-4" />
                Organization
              </dt>
              <dd className="text-right font-medium text-foreground" title={user.organizationId}>{shortenIdentifier(user.organizationId)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Created
              </dt>
              <dd className="text-right font-medium text-foreground">{formatDate(user.createdAt)}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
    </motion.article>
  );
}
