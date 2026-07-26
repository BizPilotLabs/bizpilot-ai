import { motion } from "framer-motion";
import { CalendarDays, Crown, Pencil, UsersRound } from "lucide-react";
import { type KeyboardEvent, type MouseEvent, type ReactElement } from "react";
import { Badge, Button, Card, CardContent, CardHeader, CardTitle, Skeleton } from "@/components/ui";
import { cardHover, slideUp } from "@/lib";
import { useTeamMembers } from "../hooks";
import type { Team, TeamMemberUser } from "../types";

export interface TeamCardProps {
  team: Team;
  onEditTeam: (team: Team) => void;
  onManageMembers: (team: Team) => void;
}

const formatDate = (value: string): string =>
  new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric"
  }).format(new Date(value));

const getUserDisplayName = (user: TeamMemberUser): string => {
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

export function TeamCard({ team, onEditTeam, onManageMembers }: TeamCardProps): ReactElement {
  const membersQuery = useTeamMembers(team.id);
  const members = membersQuery.data ?? [];
  const leadMember = team.leadId === null ? undefined : members.find((member) => member.userId === team.leadId);

  const handleEdit = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onEditTeam(team);
  };

  const handleManageMembers = (event: MouseEvent<HTMLButtonElement>): void => {
    event.stopPropagation();
    onManageMembers(team);
  };

  return (
    <motion.article variants={slideUp} {...cardHover}>
      <Card
        aria-label={`Team: ${team.name}`}
        className="min-h-64 cursor-pointer transition-all duration-200 ease-premium hover:border-primary/30 hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
        onClick={() => undefined}
        onKeyDown={handleKeyboardActivation}
        role="button"
        tabIndex={0}
      >
        <CardHeader>
          <div className="flex items-start justify-between gap-4">
            <CardTitle className="line-clamp-2 leading-snug">{team.name}</CardTitle>
            <div className="flex shrink-0 items-center gap-2">
              {team.archived ? <Badge variant="neutral">Archived</Badge> : null}
              <Button aria-label={`Edit ${team.name}`} size="icon" type="button" variant="ghost" onClick={handleEdit}>
                <Pencil aria-hidden="true" className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="grid gap-6">
          <p className="[display:-webkit-box] min-h-12 overflow-hidden text-sm leading-6 text-muted-foreground [-webkit-box-orient:vertical] [-webkit-line-clamp:2]">
            {team.description ?? "No description provided."}
          </p>
          <dl className="grid gap-3 text-sm">
            {team.leadId !== null ? (
              <div className="flex items-center justify-between gap-4">
                <dt className="flex items-center gap-2 text-muted-foreground">
                  <Crown aria-hidden="true" className="h-4 w-4" />
                  Lead
                </dt>
                <dd className="text-right font-medium text-foreground" title={leadMember?.user.email ?? team.leadId}>
                  {leadMember === undefined ? shortenIdentifier(team.leadId) : getUserDisplayName(leadMember.user)}
                </dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <UsersRound aria-hidden="true" className="h-4 w-4" />
                Members
              </dt>
              <dd className="text-right font-medium text-foreground">
                {membersQuery.isLoading ? <Skeleton className="inline-block h-5 w-12 align-middle" /> : members.length.toLocaleString()}
              </dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Created
              </dt>
              <dd className="text-right font-medium text-foreground">{formatDate(team.createdAt)}</dd>
            </div>
            <div className="flex items-center justify-between gap-4">
              <dt className="flex items-center gap-2 text-muted-foreground">
                <CalendarDays aria-hidden="true" className="h-4 w-4" />
                Updated
              </dt>
              <dd className="text-right font-medium text-foreground">{formatDate(team.updatedAt)}</dd>
            </div>
          </dl>
          <Button leftIcon={<UsersRound aria-hidden="true" className="h-4 w-4" />} type="button" variant="neutral" onClick={handleManageMembers}>
            Manage Members
          </Button>
        </CardContent>
      </Card>
    </motion.article>
  );
}
