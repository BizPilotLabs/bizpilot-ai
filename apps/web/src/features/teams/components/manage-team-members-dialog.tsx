import { useEffect, useMemo, useState, type ReactElement } from "react";
import { Crown, UserPlus, UsersRound } from "lucide-react";
import { Alert, Avatar, Badge, Button, Input, Modal, Select, Skeleton } from "@/components/ui";
import { useUsers, type UserProfile } from "@/features/users";
import { useToast } from "@/hooks";
import { getTeamErrorMessage, useAddTeamMember, useRemoveTeamMember, useTeamMembers } from "../hooks";
import type { Team, TeamMember } from "../types";

export interface ManageTeamMembersDialogProps {
  team: Team | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const getUserDisplayName = (user: { email: string; firstName: string; lastName: string }): string => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name.length > 0 ? name : user.email;
};

const toOptimisticMember = (team: Team, user: UserProfile): TeamMember => {
  const timestamp = new Date().toISOString();

  return {
    id: `optimistic-${team.id}-${user.id}`,
    teamId: team.id,
    userId: user.id,
    createdAt: timestamp,
    updatedAt: timestamp,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatar: user.avatar,
      status: user.status
    }
  };
};

export function ManageTeamMembersDialog({ team, open, onOpenChange }: ManageTeamMembersDialogProps): ReactElement {
  const [search, setSearch] = useState("");
  const [selectedUserId, setSelectedUserId] = useState("");
  const [actionError, setActionError] = useState<string | null>(null);
  const membersQuery = useTeamMembers(team?.id ?? null);
  const usersQuery = useUsers({ limit: 100 });
  const addMember = useAddTeamMember();
  const removeMember = useRemoveTeamMember();
  const { addToast } = useToast();
  const members = useMemo(() => membersQuery.data ?? [], [membersQuery.data]);
  const users = useMemo(() => usersQuery.data?.users ?? [], [usersQuery.data?.users]);

  useEffect(() => {
    if (open) {
      setSearch("");
      setSelectedUserId("");
      setActionError(null);
      addMember.reset();
      removeMember.reset();
    }
  }, [addMember, open, removeMember]);

  const memberUserIds = useMemo(() => new Set(members.map((member) => member.userId)), [members]);
  const availableUsers = users.filter((user) => {
    if (memberUserIds.has(user.id)) {
      return false;
    }

    const query = search.trim().toLowerCase();
    if (query.length === 0) {
      return true;
    }

    return `${user.firstName} ${user.lastName} ${user.email}`.toLowerCase().includes(query);
  });
  const selectedUser = users.find((user) => user.id === selectedUserId);
  const isMutating = addMember.isPending || removeMember.isPending;

  const handleOpenChange = (nextOpen: boolean): void => {
    if (!isMutating) {
      onOpenChange(nextOpen);
    }
  };

  const handleAddMember = async (): Promise<void> => {
    if (team === null || selectedUser === undefined) {
      return;
    }

    setActionError(null);

    try {
      await addMember.mutateAsync({
        teamId: team.id,
        data: { userId: selectedUser.id },
        optimisticMember: toOptimisticMember(team, selectedUser)
      });
      addToast({
        title: "Member added",
        description: `${getUserDisplayName(selectedUser)} was added to ${team.name}.`,
        variant: "success"
      });
      setSelectedUserId("");
      setSearch("");
    } catch (error) {
      const message = getTeamErrorMessage(error);
      setActionError(message);
      addToast({ title: "Member was not added", description: message, variant: "danger" });
    }
  };

  const handleRemoveMember = (member: TeamMember) => async (): Promise<void> => {
    if (team === null) {
      return;
    }

    setActionError(null);

    try {
      await removeMember.mutateAsync({ teamId: team.id, userId: member.userId });
      addToast({
        title: "Member removed",
        description: `${getUserDisplayName(member.user)} was removed from ${team.name}.`,
        variant: "success"
      });
    } catch (error) {
      const message = getTeamErrorMessage(error);
      setActionError(message);
      addToast({ title: "Member was not removed", description: message, variant: "danger" });
    }
  };

  return (
    <Modal
      open={open}
      onOpenChange={handleOpenChange}
      title="Manage Members"
      description={team === null ? "" : `Add or remove members for ${team.name}.`}
      footer={
        <Button disabled={isMutating} type="button" variant="neutral" onClick={() => handleOpenChange(false)}>
          Close
        </Button>
      }
    >
      <div className="grid gap-6">
        {actionError !== null ? (
          <Alert variant="danger" title="Member update failed">
            {actionError}
          </Alert>
        ) : null}

        <section className="grid gap-3" aria-label="Current team members">
          <div className="flex items-center justify-between gap-4">
            <h3 className="text-sm font-semibold">Current members</h3>
            <Badge variant="neutral">{members.length.toLocaleString()}</Badge>
          </div>

          {membersQuery.isLoading ? (
            <div className="grid gap-3">
              {Array.from({ length: 3 }, (_, index) => (
                <div key={index} className="flex items-center gap-3 rounded-xl border border-border p-3">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="grid flex-1 gap-2">
                    <Skeleton className="h-4 w-36" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}

          {membersQuery.isError ? (
            <Alert variant="danger" title="Members could not be loaded">
              {getTeamErrorMessage(membersQuery.error)}
            </Alert>
          ) : null}

          {membersQuery.isSuccess && members.length === 0 ? (
            <div className="grid justify-items-center gap-3 rounded-xl border border-dashed border-border p-6 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border bg-muted text-muted-foreground">
                <UsersRound aria-hidden="true" className="h-6 w-6" />
              </div>
              <p className="text-sm text-muted-foreground">This team does not have members yet.</p>
            </div>
          ) : null}

          {membersQuery.isSuccess && members.length > 0 ? (
            <ul className="grid max-h-72 gap-3 overflow-y-auto pr-1">
              {members.map((member) => {
                const displayName = getUserDisplayName(member.user);
                const isLead = member.userId === team?.leadId;

                return (
                  <li key={member.userId} className="flex items-center gap-3 rounded-xl border border-border p-3">
                    <Avatar name={displayName} src={member.user.avatar ?? undefined} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate font-medium">{displayName}</p>
                        {isLead ? (
                          <Badge variant="secondary">
                            <Crown aria-hidden="true" className="mr-1 h-3 w-3" />
                            Team Lead
                          </Badge>
                        ) : null}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{member.user.email}</p>
                    </div>
                    <Button
                      aria-label={`Remove ${displayName}`}
                      disabled={isMutating}
                      size="sm"
                      type="button"
                      variant="danger"
                      onClick={() => void handleRemoveMember(member)()}
                    >
                      Remove
                    </Button>
                  </li>
                );
              })}
            </ul>
          ) : null}
        </section>

        <section className="grid gap-3 border-t border-border pt-6" aria-label="Add team member">
          <h3 className="text-sm font-semibold">Add member</h3>
          <Input
            label="Search users"
            placeholder="Search by name or email"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
          <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
            <Select
              disabled={usersQuery.isLoading || usersQuery.isError || availableUsers.length === 0}
              hint={usersQuery.isError ? "Users could not be loaded." : undefined}
              label="User"
              options={[
                { label: usersQuery.isLoading ? "Loading users..." : availableUsers.length === 0 ? "No users available" : "Select a user", value: "" },
                ...availableUsers.map((user) => ({ label: `${getUserDisplayName(user)} (${user.email})`, value: user.id }))
              ]}
              value={selectedUserId}
              onChange={(event) => setSelectedUserId(event.target.value)}
            />
            <Button
              disabled={selectedUser === undefined || usersQuery.isError || isMutating}
              isLoading={addMember.isPending}
              leftIcon={<UserPlus aria-hidden="true" className="h-4 w-4" />}
              type="button"
              onClick={() => void handleAddMember()}
            >
              Add
            </Button>
          </div>
        </section>
      </div>
    </Modal>
  );
}

