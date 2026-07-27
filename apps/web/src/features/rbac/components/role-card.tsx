import { motion } from "framer-motion";
import { CalendarDays, MoreHorizontal, Pencil, ShieldCheck, Trash2, UsersRound } from "lucide-react";
import { type ReactElement, type MouseEvent } from "react";
import { Badge, Card, CardContent, CardHeader, CardTitle, Dropdown, DropdownButton } from "@/components/ui";
import { cardHover, slideUp } from "@/lib";
import type { Role } from "../types";

export interface RoleCardProps {
  role: Role;
  canUpdate: boolean;
  canDelete: boolean;
  onView: (role: Role) => void;
  onEdit: (role: Role) => void;
  onDelete: (role: Role) => void;
}

const formatDate = (value: string): string => new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric", year: "numeric" }).format(new Date(value));
const stopPropagation = (event: MouseEvent): void => event.stopPropagation();

export function RoleCard({ role, canUpdate, canDelete, onView, onEdit, onDelete }: RoleCardProps): ReactElement {
  const canEditRole = canUpdate && !role.isSystem;
  const canDeleteRole = canDelete && !role.isSystem && role.userCount === 0;

  return (
    <motion.article variants={slideUp} {...cardHover}>
      <Card className="group relative min-h-72 cursor-pointer overflow-hidden border-border/60 bg-gradient-to-br from-card via-card to-secondary/5 transition-all duration-300 hover:-translate-y-1 hover:border-foreground/20 hover:shadow-[0_22px_70px_hsl(var(--shadow-color)/0.14)]" role="button" tabIndex={0} onClick={() => onView(role)}>
        <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-secondary/70 via-primary/30 to-transparent" />
        {(canEditRole || canDelete) ? (
          <div className="absolute right-3 top-3 z-10" onClick={stopPropagation}>
            <Dropdown
              align="right"
              trigger={<button aria-label={`Open actions for ${role.name}`} className="rounded-full border border-border/70 bg-surface/90 p-2 text-muted-foreground shadow-xs transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring" type="button"><MoreHorizontal aria-hidden="true" className="h-4 w-4" /></button>}
            >
              {canEditRole ? <DropdownButton onClick={() => onEdit(role)}><Pencil aria-hidden="true" className="h-4 w-4" />Edit role</DropdownButton> : null}
              {canDelete ? <DropdownButton className="text-danger hover:bg-danger/10" disabled={!canDeleteRole} onClick={() => onDelete(role)}><Trash2 aria-hidden="true" className="h-4 w-4" />Delete role</DropdownButton> : null}
            </Dropdown>
          </div>
        ) : null}
        <CardHeader className="pr-14">
          <div className="grid gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-lg">{role.name}</CardTitle>
              <Badge variant={role.isSystem ? "primary" : "neutral"}>{role.isSystem ? "System" : "Custom"}</Badge>
            </div>
            <p className="line-clamp-2 text-sm leading-6 text-muted-foreground">{role.description ?? "No description provided."}</p>
          </div>
        </CardHeader>
        <CardContent className="grid gap-5">
          <dl className="grid gap-2 rounded-2xl border border-border/60 bg-background/45 p-3 text-sm">
            <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><ShieldCheck aria-hidden="true" className="h-4 w-4" />Permissions</dt><dd className="font-medium">{role.permissions.length}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><UsersRound aria-hidden="true" className="h-4 w-4" />Users</dt><dd className="font-medium">{role.userCount}</dd></div>
            <div className="flex items-center justify-between gap-4"><dt className="flex items-center gap-2 text-muted-foreground"><CalendarDays aria-hidden="true" className="h-4 w-4" />Updated</dt><dd className="font-medium">{formatDate(role.updatedAt)}</dd></div>
          </dl>
          <div className="flex flex-wrap gap-2">
            {role.permissions.slice(0, 4).map((permission) => <Badge key={permission.id} variant="neutral">{permission.key}</Badge>)}
            {role.permissions.length > 4 ? <Badge variant="secondary">+{role.permissions.length - 4}</Badge> : null}
          </div>
        </CardContent>
      </Card>
    </motion.article>
  );
}
