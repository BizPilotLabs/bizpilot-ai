import { AppError } from "../../core/errors/index.js";
import { projectRepository } from "./project.repository.js";
import type { ProjectCreateInput, ProjectListQuery, ProjectListResult, ProjectRecord, ProjectResponse, ProjectUpdateInput, RequestMetadata } from "./project.types.js";

const toProjectResponse = (project: ProjectRecord): ProjectResponse => ({
  id: project.id,
  organizationId: project.organizationId,
  name: project.name,
  description: project.description,
  status: project.status,
  startDate: project.startDate,
  endDate: project.endDate,
  color: project.color,
  archived: project.archived,
  createdById: project.createdById,
  createdAt: project.createdAt,
  updatedAt: project.updatedAt,
});

const ensureDateRangeIsValid = (input: { startDate?: Date | null | undefined; endDate?: Date | null | undefined }): void => {
  if (input.startDate !== undefined && input.endDate !== undefined && input.startDate !== null && input.endDate !== null) {
    if (input.endDate.getTime() < input.startDate.getTime()) {
      throw new AppError({ statusCode: 400, message: "Project end date cannot be before start date.", code: "PROJECT_INVALID_DATE_RANGE" });
    }
  }
};

export class ProjectService {
  public async listProjects(input: { organizationId: string; query: ProjectListQuery }): Promise<ProjectListResult> {
    const result = await projectRepository.findProjects(input);
    const totalPages = Math.max(1, Math.ceil(result.total / input.query.limit));

    return {
      projects: result.projects.map(toProjectResponse),
      pagination: {
        page: input.query.page,
        limit: input.query.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  public async createProject(input: {
    organizationId: string;
    actorUserId: string;
    data: ProjectCreateInput;
    metadata: RequestMetadata;
  }): Promise<ProjectResponse> {
    ensureDateRangeIsValid(input.data);

    try {
      const project = await projectRepository.createProject(input);
      return toProjectResponse(project);
    } catch (error) {
      if (error instanceof Error && error.message === "PROJECT_NAME_CONFLICT") {
        throw new AppError({ statusCode: 409, message: "Project name already exists.", code: "PROJECT_NAME_CONFLICT" });
      }

      throw error;
    }
  }

  public async getProject(input: { organizationId: string; projectId: string }): Promise<ProjectResponse> {
    const project = await projectRepository.findProjectByIdInOrganization(input);

    if (project === null) {
      throw new AppError({ statusCode: 404, message: "Project not found.", code: "PROJECT_NOT_FOUND" });
    }

    return toProjectResponse(project);
  }

  public async updateProject(input: {
    organizationId: string;
    actorUserId: string;
    projectId: string;
    data: ProjectUpdateInput;
    metadata: RequestMetadata;
  }): Promise<ProjectResponse> {
    const existingProject = await projectRepository.findProjectByIdInOrganization({ projectId: input.projectId, organizationId: input.organizationId });

    if (existingProject === null) {
      throw new AppError({ statusCode: 404, message: "Project not found.", code: "PROJECT_NOT_FOUND" });
    }

    ensureDateRangeIsValid({
      startDate: input.data.startDate === undefined ? existingProject.startDate : input.data.startDate,
      endDate: input.data.endDate === undefined ? existingProject.endDate : input.data.endDate,
    });

    try {
      const project = await projectRepository.updateProject(input);
      return toProjectResponse(project);
    } catch (error) {
      if (error instanceof Error && error.message === "PROJECT_NAME_CONFLICT") {
        throw new AppError({ statusCode: 409, message: "Project name already exists.", code: "PROJECT_NAME_CONFLICT" });
      }

      throw error;
    }
  }

  public async deleteProject(input: {
    organizationId: string;
    actorUserId: string;
    projectId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    const existingProject = await projectRepository.findProjectByIdInOrganization({ projectId: input.projectId, organizationId: input.organizationId });

    if (existingProject === null) {
      throw new AppError({ statusCode: 404, message: "Project not found.", code: "PROJECT_NOT_FOUND" });
    }

    await projectRepository.softDeleteProject(input);
  }
}

export const projectService = new ProjectService();