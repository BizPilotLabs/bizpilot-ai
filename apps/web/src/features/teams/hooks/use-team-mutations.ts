import { useMutation, useQueryClient } from "@tanstack/react-query";
import { teamService } from "../services";
import type { AddTeamMemberVariables, CreateTeamInput, Team, TeamListResult, TeamMember, RemoveTeamMemberVariables, UpdateTeamVariables } from "../types";
import { teamQueryKeys } from "./team-query-keys";

const replaceTeamInList = (current: TeamListResult | undefined, team: Team): TeamListResult | undefined => {
  if (current === undefined) {
    return current;
  }

  return {
    ...current,
    teams: current.teams.map((currentTeam) => (currentTeam.id === team.id ? team : currentTeam))
  };
};

const appendTeamMember = (current: TeamMember[] | undefined, member: TeamMember): TeamMember[] | undefined => {
  if (current === undefined) {
    return current;
  }

  if (current.some((currentMember) => currentMember.userId === member.userId)) {
    return current.map((currentMember) => (currentMember.userId === member.userId ? member : currentMember));
  }

  return [...current, member];
};

const removeTeamMember = (current: TeamMember[] | undefined, userId: string): TeamMember[] | undefined => {
  if (current === undefined) {
    return current;
  }

  return current.filter((member) => member.userId !== userId);
};

export function useCreateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTeamInput) => teamService.createTeam(input),
    onSuccess: (team) => {
      queryClient.setQueryData(teamQueryKeys.detail(team.id), team);
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() });
    }
  });
}

export function useUpdateTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, data }: UpdateTeamVariables) => teamService.updateTeam(teamId, data),
    onSuccess: (team) => {
      queryClient.setQueryData(teamQueryKeys.detail(team.id), team);
      queryClient.setQueriesData<TeamListResult>({ queryKey: teamQueryKeys.lists() }, (current) => replaceTeamInList(current, team));
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() });
    }
  });
}

export function useDeleteTeam() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (teamId: string) => teamService.deleteTeam(teamId),
    onSuccess: (_result, teamId) => {
      queryClient.removeQueries({ queryKey: teamQueryKeys.detail(teamId) });
      queryClient.removeQueries({ queryKey: teamQueryKeys.teamMembers(teamId) });
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.lists() });
    }
  });
}

export function useAddTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, data }: AddTeamMemberVariables) => teamService.addTeamMember(teamId, data),
    onSuccess: (member, variables) => {
      queryClient.setQueryData<TeamMember[]>(teamQueryKeys.teamMembers(variables.teamId), (current) => appendTeamMember(current, member));
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.teamMembers(variables.teamId) });
    }
  });
}

export function useRemoveTeamMember() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ teamId, userId }: RemoveTeamMemberVariables) => teamService.removeTeamMember(teamId, userId),
    onSuccess: (_result, variables) => {
      queryClient.setQueryData<TeamMember[]>(teamQueryKeys.teamMembers(variables.teamId), (current) => removeTeamMember(current, variables.userId));
      void queryClient.invalidateQueries({ queryKey: teamQueryKeys.teamMembers(variables.teamId) });
    }
  });
}
