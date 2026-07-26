import { useState, type ReactElement } from "react";
import { getTeamErrorMessage, useTeams } from "../hooks";
import { CreateTeamDialog, EditTeamDialog, TeamsEmptyState, TeamsErrorState, TeamsList, TeamsLoadingState, TeamsPageHeader } from "../components";
import type { Team } from "../types";

export function TeamsPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const teamsQuery = useTeams();
  const teams = teamsQuery.data?.teams ?? [];

  const handleEditTeam = (team: Team): void => {
    setSelectedTeam(team);
  };

  const handleEditDialogOpenChange = (open: boolean): void => {
    if (!open) {
      setSelectedTeam(null);
    }
  };

  return (
    <div className="grid gap-6">
      <TeamsPageHeader onCreateTeam={() => setCreateDialogOpen(true)} />
      {teamsQuery.isLoading ? <TeamsLoadingState /> : null}
      {teamsQuery.isError ? (
        <TeamsErrorState
          isRetrying={teamsQuery.isFetching}
          message={getTeamErrorMessage(teamsQuery.error)}
          onRetry={() => {
            void teamsQuery.refetch();
          }}
        />
      ) : null}
      {teamsQuery.isSuccess && teams.length === 0 ? <TeamsEmptyState /> : null}
      {teamsQuery.isSuccess && teams.length > 0 ? <TeamsList teams={teams} onEditTeam={handleEditTeam} /> : null}
      <CreateTeamDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
      <EditTeamDialog open={selectedTeam !== null} team={selectedTeam} onOpenChange={handleEditDialogOpenChange} />
    </div>
  );
}
