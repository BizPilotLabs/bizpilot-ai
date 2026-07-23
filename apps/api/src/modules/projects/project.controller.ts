import type { Response } from "express";

import { createProjectSchema, listProjectsQuerySchema, projectIdParamsSchema, updateProjectSchema } from "./project.schema.js";
import { projectService } from "./project.service.js";
import type { ProjectRequest, RequestMetadata } from "./project.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: ProjectRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = { success: true, data };
  response.status(statusCode).json(body);
};

export class ProjectController {
  public async listProjects(request: ProjectRequest, response: Response): Promise<void> {
    const query = listProjectsQuerySchema.parse(request.query);
    const result = await projectService.listProjects({ organizationId: request.auth.organizationId, query });
    sendSuccess(response, 200, result);
  }

  public async createProject(request: ProjectRequest, response: Response): Promise<void> {
    const input = createProjectSchema.parse(request.body);
    const project = await projectService.createProject({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 201, { project });
  }

  public async getProject(request: ProjectRequest, response: Response): Promise<void> {
    const params = projectIdParamsSchema.parse(request.params);
    const project = await projectService.getProject({ organizationId: request.auth.organizationId, projectId: params.id });
    sendSuccess(response, 200, { project });
  }

  public async updateProject(request: ProjectRequest, response: Response): Promise<void> {
    const params = projectIdParamsSchema.parse(request.params);
    const input = updateProjectSchema.parse(request.body);
    const project = await projectService.updateProject({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      projectId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { project });
  }

  public async deleteProject(request: ProjectRequest, response: Response): Promise<void> {
    const params = projectIdParamsSchema.parse(request.params);
    await projectService.deleteProject({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      projectId: params.id,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { deleted: true });
  }
}

export const projectController = new ProjectController();