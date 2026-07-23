import type { Response } from "express";

import { addTeamMemberSchema, createTeamSchema, listTeamsQuerySchema, teamIdParamsSchema, teamMemberParamsSchema, updateTeamSchema } from "./team.schema.js";
import { teamService } from "./team.service.js";
import type { RequestMetadata, TeamRequest } from "./team.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: TeamRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = { success: true, data };
  response.status(statusCode).json(body);
};

export class TeamController {
  public async listTeams(request: TeamRequest, response: Response): Promise<void> {
    const query = listTeamsQuerySchema.parse(request.query);
    const result = await teamService.listTeams({ organizationId: request.auth.organizationId, query });
    sendSuccess(response, 200, result);
  }

  public async createTeam(request: TeamRequest, response: Response): Promise<void> {
    const input = createTeamSchema.parse(request.body);
    const team = await teamService.createTeam({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 201, { team });
  }

  public async getTeam(request: TeamRequest, response: Response): Promise<void> {
    const params = teamIdParamsSchema.parse(request.params);
    const team = await teamService.getTeam({ organizationId: request.auth.organizationId, teamId: params.id });
    sendSuccess(response, 200, { team });
  }

  public async updateTeam(request: TeamRequest, response: Response): Promise<void> {
    const params = teamIdParamsSchema.parse(request.params);
    const input = updateTeamSchema.parse(request.body);
    const team = await teamService.updateTeam({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      teamId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { team });
  }

  public async deleteTeam(request: TeamRequest, response: Response): Promise<void> {
    const params = teamIdParamsSchema.parse(request.params);
    await teamService.deleteTeam({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      teamId: params.id,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { deleted: true });
  }

  public async listMembers(request: TeamRequest, response: Response): Promise<void> {
    const params = teamIdParamsSchema.parse(request.params);
    const members = await teamService.listMembers({ organizationId: request.auth.organizationId, teamId: params.id });
    sendSuccess(response, 200, { members });
  }

  public async addMember(request: TeamRequest, response: Response): Promise<void> {
    const params = teamIdParamsSchema.parse(request.params);
    const input = addTeamMemberSchema.parse(request.body);
    const member = await teamService.addMember({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      teamId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 201, { member });
  }

  public async removeMember(request: TeamRequest, response: Response): Promise<void> {
    const params = teamMemberParamsSchema.parse(request.params);
    await teamService.removeMember({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      teamId: params.id,
      userId: params.userId,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { removed: true });
  }
}

export const teamController = new TeamController();