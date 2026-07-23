import { AppError } from "../../core/errors/index.js";
import { teamRepository } from "./team.repository.js";
import type {
  RequestMetadata,
  TeamCreateInput,
  TeamListQuery,
  TeamListResult,
  TeamMemberCreateInput,
  TeamMemberRecord,
  TeamMemberResponse,
  TeamRecord,
  TeamResponse,
  TeamUpdateInput,
} from "./team.types.js";

const toTeamResponse = (team: TeamRecord): TeamResponse => ({
  id: team.id,
  organizationId: team.organizationId,
  name: team.name,
  description: team.description,
  color: team.color,
  leadId: team.leadId,
  archived: team.archived,
  createdAt: team.createdAt,
  updatedAt: team.updatedAt,
});

const toTeamMemberResponse = (member: TeamMemberRecord): TeamMemberResponse => ({
  id: member.id,
  teamId: member.teamId,
  userId: member.userId,
  createdAt: member.createdAt,
  updatedAt: member.updatedAt,
  user: {
    id: member.user.id,
    email: member.user.email,
    firstName: member.user.firstName,
    lastName: member.user.lastName,
    avatar: member.user.avatar,
    status: member.user.status,
  },
});

export class TeamService {
  public async listTeams(input: { organizationId: string; query: TeamListQuery }): Promise<TeamListResult> {
    const result = await teamRepository.findTeams(input);
    const totalPages = Math.max(1, Math.ceil(result.total / input.query.limit));

    return {
      teams: result.teams.map(toTeamResponse),
      pagination: {
        page: input.query.page,
        limit: input.query.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  public async createTeam(input: {
    organizationId: string;
    actorUserId: string;
    data: TeamCreateInput;
    metadata: RequestMetadata;
  }): Promise<TeamResponse> {
    await this.ensureLeadBelongsToOrganization({ leadId: input.data.leadId ?? null, organizationId: input.organizationId });

    try {
      const team = await teamRepository.createTeam(input);
      return toTeamResponse(team);
    } catch (error) {
      if (error instanceof Error && error.message === "TEAM_NAME_CONFLICT") {
        throw new AppError({ statusCode: 409, message: "Team name already exists.", code: "TEAM_NAME_CONFLICT" });
      }
      throw error;
    }
  }

  public async getTeam(input: { organizationId: string; teamId: string }): Promise<TeamResponse> {
    const team = await teamRepository.findTeamByIdInOrganization(input);

    if (team === null) {
      throw new AppError({ statusCode: 404, message: "Team not found.", code: "TEAM_NOT_FOUND" });
    }

    return toTeamResponse(team);
  }

  public async updateTeam(input: {
    organizationId: string;
    actorUserId: string;
    teamId: string;
    data: TeamUpdateInput;
    metadata: RequestMetadata;
  }): Promise<TeamResponse> {
    await this.ensureTeamExists({ teamId: input.teamId, organizationId: input.organizationId });
    await this.ensureLeadBelongsToOrganization({ leadId: input.data.leadId, organizationId: input.organizationId });

    try {
      const team = await teamRepository.updateTeam(input);
      return toTeamResponse(team);
    } catch (error) {
      if (error instanceof Error && error.message === "TEAM_NAME_CONFLICT") {
        throw new AppError({ statusCode: 409, message: "Team name already exists.", code: "TEAM_NAME_CONFLICT" });
      }
      throw error;
    }
  }

  public async deleteTeam(input: {
    organizationId: string;
    actorUserId: string;
    teamId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    await this.ensureTeamExists({ teamId: input.teamId, organizationId: input.organizationId });
    await teamRepository.softDeleteTeam(input);
  }

  public async listMembers(input: { organizationId: string; teamId: string }): Promise<TeamMemberResponse[]> {
    await this.ensureTeamExists(input);
    const members = await teamRepository.findMembers({ teamId: input.teamId });
    return members.map(toTeamMemberResponse);
  }

  public async addMember(input: {
    organizationId: string;
    actorUserId: string;
    teamId: string;
    data: TeamMemberCreateInput;
    metadata: RequestMetadata;
  }): Promise<TeamMemberResponse> {
    await this.ensureTeamExists({ teamId: input.teamId, organizationId: input.organizationId });
    await this.ensureUserBelongsToOrganization({ userId: input.data.userId, organizationId: input.organizationId });

    try {
      const member = await teamRepository.addMember(input);
      return toTeamMemberResponse(member);
    } catch (error) {
      if (error instanceof Error && error.message === "TEAM_MEMBER_CONFLICT") {
        throw new AppError({ statusCode: 409, message: "User is already a member of this team.", code: "TEAM_MEMBER_CONFLICT" });
      }
      throw error;
    }
  }

  public async removeMember(input: {
    organizationId: string;
    actorUserId: string;
    teamId: string;
    userId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    await this.ensureTeamExists({ teamId: input.teamId, organizationId: input.organizationId });
    await this.ensureUserBelongsToOrganization({ userId: input.userId, organizationId: input.organizationId });

    const membership = await teamRepository.findMembership({ teamId: input.teamId, userId: input.userId });
    if (membership === null) {
      throw new AppError({ statusCode: 404, message: "Team member not found.", code: "TEAM_MEMBER_NOT_FOUND" });
    }

    await teamRepository.removeMember(input);
  }

  private async ensureTeamExists(input: { teamId: string; organizationId: string }): Promise<void> {
    const team = await teamRepository.findTeamByIdInOrganization(input);

    if (team === null) {
      throw new AppError({ statusCode: 404, message: "Team not found.", code: "TEAM_NOT_FOUND" });
    }
  }

  private async ensureLeadBelongsToOrganization(input: { leadId?: string | null | undefined; organizationId: string }): Promise<void> {
    if (input.leadId === undefined || input.leadId === null) {
      return;
    }

    await this.ensureUserBelongsToOrganization({ userId: input.leadId, organizationId: input.organizationId });
  }

  private async ensureUserBelongsToOrganization(input: { userId: string; organizationId: string }): Promise<void> {
    const user = await teamRepository.findUserInOrganization(input);

    if (user === null) {
      throw new AppError({ statusCode: 400, message: "User not found.", code: "TEAM_USER_NOT_FOUND" });
    }
  }
}

export const teamService = new TeamService();