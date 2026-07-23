import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { Prisma, Project } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { ProjectCreateInput, ProjectListQuery, ProjectUpdateInput, RequestMetadata } from "./project.types.js";

const createSearchWhere = (query: ProjectListQuery): Prisma.ProjectWhereInput => {
  if (query.search === undefined) {
    return {};
  }

  return {
    OR: [
      { name: { contains: query.search, mode: "insensitive" } },
      { description: { contains: query.search, mode: "insensitive" } },
    ],
  };
};

const toCreateData = (input: {
  organizationId: string;
  createdById: string;
  data: ProjectCreateInput;
}): Prisma.ProjectUncheckedCreateInput => ({
  organizationId: input.organizationId,
  createdById: input.createdById,
  name: input.data.name,
  description: input.data.description ?? null,
  status: input.data.status ?? "PLANNED",
  startDate: input.data.startDate ?? null,
  endDate: input.data.endDate ?? null,
  color: input.data.color ?? null,
  archived: input.data.archived ?? false,
});

const toUpdateData = (input: ProjectUpdateInput): Prisma.ProjectUpdateInput => {
  const data: Prisma.ProjectUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.description !== undefined) {
    data.description = input.description;
  }

  if (input.status !== undefined) {
    data.status = input.status;
  }

  if (input.startDate !== undefined) {
    data.startDate = input.startDate;
  }

  if (input.endDate !== undefined) {
    data.endDate = input.endDate;
  }

  if (input.color !== undefined) {
    data.color = input.color;
  }

  if (input.archived !== undefined) {
    data.archived = input.archived;
  }

  return data;
};

export class ProjectRepository {
  public async findProjects(input: {
    organizationId: string;
    query: ProjectListQuery;
  }): Promise<{ projects: Project[]; total: number }> {
    const where: Prisma.ProjectWhereInput = {
      organizationId: input.organizationId,
      deletedAt: null,
      ...createSearchWhere(input.query),
    };

    if (input.query.status !== undefined) {
      where.status = input.query.status;
    }

    if (input.query.archived !== undefined) {
      where.archived = input.query.archived;
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        orderBy: { createdAt: input.query.sort },
        skip: (input.query.page - 1) * input.query.limit,
        take: input.query.limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { projects, total };
  }

  public async findProjectByIdInOrganization(input: { projectId: string; organizationId: string }): Promise<Project | null> {
    return prisma.project.findFirst({
      where: {
        id: input.projectId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
    });
  }

  public async createProject(input: {
    organizationId: string;
    actorUserId: string;
    data: ProjectCreateInput;
    metadata: RequestMetadata;
  }): Promise<Project> {
    try {
      return await prisma.$transaction(async (transaction) => {
        const project = await transaction.project.create({
          data: toCreateData({ organizationId: input.organizationId, createdById: input.actorUserId, data: input.data }),
        });

        await transaction.auditLog.create({
          data: {
            userId: input.actorUserId,
            organizationId: input.organizationId,
            action: "project.create",
            resource: "project",
            ipAddress: input.metadata.ipAddress ?? null,
            userAgent: input.metadata.userAgent ?? null,
            metadata: { projectId: project.id, name: project.name },
          },
        });

        return project;
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("PROJECT_NAME_CONFLICT");
      }

      throw error;
    }
  }

  public async updateProject(input: {
    projectId: string;
    organizationId: string;
    actorUserId: string;
    data: ProjectUpdateInput;
    metadata: RequestMetadata;
  }): Promise<Project> {
    try {
      return await prisma.$transaction(async (transaction) => {
        const project = await transaction.project.update({
          where: { id: input.projectId },
          data: toUpdateData(input.data),
        });

        await transaction.auditLog.create({
          data: {
            userId: input.actorUserId,
            organizationId: input.organizationId,
            action: "project.update",
            resource: "project",
            ipAddress: input.metadata.ipAddress ?? null,
            userAgent: input.metadata.userAgent ?? null,
            metadata: {
              projectId: project.id,
              fields: Object.keys(input.data).filter((key) => input.data[key as keyof ProjectUpdateInput] !== undefined),
            },
          },
        });

        return project;
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("PROJECT_NAME_CONFLICT");
      }

      throw error;
    }
  }

  public async softDeleteProject(input: {
    projectId: string;
    organizationId: string;
    actorUserId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      await transaction.project.update({
        where: { id: input.projectId },
        data: {
          deletedAt: new Date(),
          archived: true,
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "project.delete",
          resource: "project",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: { projectId: input.projectId },
        },
      });
    });
  }
}

export const projectRepository = new ProjectRepository();