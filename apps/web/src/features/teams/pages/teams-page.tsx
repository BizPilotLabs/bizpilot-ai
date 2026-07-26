import { useState, type ReactElement } from "react";
import { getTeamErrorMessage, useTeams } from "../hooks";
import { CreateTeamDialog, TeamsEmptyState, TeamsErrorState, TeamsList, TeamsLoadingState, TeamsPageHeader } from "../components";

export function TeamsPage(): ReactElement {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const teamsQuery = useTeams();
  const teams = teamsQuery.data?.teams ?? [];

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
      {teamsQuery.isSuccess && teams.length > 0 ? <TeamsList teams={teams} /> : null}
      <CreateTeamDialog open={createDialogOpen} onOpenChange={setCreateDialogOpen} />
    </div>
  );
}
