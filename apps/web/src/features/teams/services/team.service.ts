import { httpClient } from "@/services";
import type {
  AddTeamMemberInput,
  ApiSuccessResponse,
  CreateTeamInput,
  Team,
  TeamDeleteResponse,
  TeamListQuery,
  TeamListResult,
  TeamMember,
  TeamMemberMutationResponse,
  TeamMemberRemoveResponse,
  TeamMembersResponse,
  TeamMutationResponse,
  UpdateTeamInput
} from "../types";

const toQueryParams = (query: TeamListQuery = {}): URLSearchParams => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.search !== undefined) params.set("search", query.search);
  if (query.sort !== undefined) params.set("sort", query.sort);
  if (query.archived !== undefined) params.set("archived", String(query.archived));

  return params;
};

const toTeamPayload = <TPayload extends CreateTeamInput | UpdateTeamInput>(payload: TPayload): Record<string, unknown> => {
  const nextPayload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value !== undefined) {
      nextPayload[key] = value;
    }
  }

  return nextPayload;
};

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

export const teamService = {
  async getTeams(query: TeamListQuery = {}): Promise<TeamListResult> {
    const params = toQueryParams(query);
    return unwrap(await httpClient.get<ApiSuccessResponse<TeamListResult>>("/teams", { params }));
  },

  async getTeamById(teamId: string): Promise<Team> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<TeamMutationResponse>>(`/teams/${teamId}`));
    return result.team;
  },

  async createTeam(input: CreateTeamInput): Promise<Team> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<TeamMutationResponse>>("/teams", toTeamPayload(input)));
    return result.team;
  },

  async updateTeam(teamId: string, input: UpdateTeamInput): Promise<Team> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<TeamMutationResponse>>(`/teams/${teamId}`, toTeamPayload(input)));
    return result.team;
  },

  async deleteTeam(teamId: string): Promise<TeamDeleteResponse> {
    return unwrap(await httpClient.delete<ApiSuccessResponse<TeamDeleteResponse>>(`/teams/${teamId}`));
  },

  async getTeamMembers(teamId: string): Promise<TeamMember[]> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<TeamMembersResponse>>(`/teams/${teamId}/members`));
    return result.members;
  },

  async addTeamMember(teamId: string, input: AddTeamMemberInput): Promise<TeamMember> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<TeamMemberMutationResponse>>(`/teams/${teamId}/members`, input));
    return result.member;
  },

  async removeTeamMember(teamId: string, userId: string): Promise<TeamMemberRemoveResponse> {
    return unwrap(await httpClient.delete<ApiSuccessResponse<TeamMemberRemoveResponse>>(`/teams/${teamId}/members/${userId}`));
  }
};
