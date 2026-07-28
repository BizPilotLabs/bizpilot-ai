import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";
import type { Prisma, ProjectStatus } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { ProjectCreateInput, ProjectListQuery, ProjectModelRecord, ProjectRecord, ProjectUpdateInput, RequestMetadata } from "./project.types.js";

const projectInclude = {
  createdBy: {
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
} satisfies Prisma.ProjectInclude;

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

  if (input.name !== undefined) data.name = input.name;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.startDate !== undefined) data.startDate = input.startDate;
  if (input.endDate !== undefined) data.endDate = input.endDate;
  if (input.color !== undefined) data.color = input.color;
  if (input.archived !== undefined) data.archived = input.archived;

  return data;
};

const attachTaskMetrics = async (projects: ProjectModelRecord[]): Promise<ProjectRecord[]> => {
  if (projects.length === 0) {
    return [];
  }

  const projectIds = projects.map((project) => project.id);
  const groups = await prisma.task.groupBy({
    by: ["projectId", "status"],
    where: {
      projectId: { in: projectIds },
      deletedAt: null,
    },
    _count: { _all: true },
  });

  const taskCountByProject = new Map<string, number>();
  const completedTaskCountByProject = new Map<string, number>();

  for (const group of groups) {
    const count = group._count._all;
    taskCountByProject.set(group.projectId, (taskCountByProject.get(group.projectId) ?? 0) + count);

    if ((group.status as ProjectStatus | string) === "DONE") {
      completedTaskCountByProject.set(group.projectId, count);
    }
  }

  return projects.map((project) => ({
    ...project,
    taskCount: taskCountByProject.get(project.id) ?? 0,
    completedTaskCount: completedTaskCountByProject.get(project.id) ?? 0,
  }));
};

export class ProjectRepository {
  public async findProjects(input: {
    organizationId: string;
    query: ProjectListQuery;
  }): Promise<{ projects: ProjectRecord[]; total: number }> {
    const where: Prisma.ProjectWhereInput = {
      organizationId: input.organizationId,
      deletedAt: null,
      ...createSearchWhere(input.query),
    };

    if (input.query.status !== undefined) where.status = input.query.status;
    if (input.query.archived !== undefined) where.archived = input.query.archived;

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        include: projectInclude,
        orderBy: [{ createdAt: input.query.sort }, { id: input.query.sort }],
        skip: (input.query.page - 1) * input.query.limit,
        take: input.query.limit,
      }),
      prisma.project.count({ where }),
    ]);

    return { projects: await attachTaskMetrics(projects), total };
  }

  public async findProjectByIdInOrganization(input: { projectId: string; organizationId: string }): Promise<ProjectRecord | null> {
    const project = await prisma.project.findFirst({
      where: {
        id: input.projectId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      include: projectInclude,
    });

    if (project === null) {
      return null;
    }

    const [projectWithMetrics] = await attachTaskMetrics([project]);
    return projectWithMetrics ?? null;
  }

  public async createProject(input: {
    organizationId: string;
    actorUserId: string;
    data: ProjectCreateInput;
    metadata: RequestMetadata;
  }): Promise<ProjectRecord> {
    try {
      const project = await prisma.$transaction(async (transaction) => {
        const createdProject = await transaction.project.create({
          data: toCreateData({ organizationId: input.organizationId, createdById: input.actorUserId, data: input.data }),
          include: projectInclude,
        });

        await transaction.auditLog.create({
          data: {
            userId: input.actorUserId,
            organizationId: input.organizationId,
            action: "project.create",
            resource: "project",
            ipAddress: input.metadata.ipAddress ?? null,
            userAgent: input.metadata.userAgent ?? null,
            metadata: { projectId: createdProject.id, name: createdProject.name },
          },
        });

        return createdProject;
      });

      const [projectWithMetrics] = await attachTaskMetrics([project]);
      if (projectWithMetrics === undefined) {
        throw new Error("PROJECT_METRICS_NOT_FOUND");
      }
      return projectWithMetrics;
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
  }): Promise<ProjectRecord> {
    try {
      const project = await prisma.$transaction(async (transaction) => {
        const updatedProject = await transaction.project.update({
          where: { id: input.projectId },
          data: toUpdateData(input.data),
          include: projectInclude,
        });

        await transaction.auditLog.create({
          data: {
            userId: input.actorUserId,
            organizationId: input.organizationId,
            action: input.data.archived === true ? "project.archive" : "project.update",
            resource: "project",
            ipAddress: input.metadata.ipAddress ?? null,
            userAgent: input.metadata.userAgent ?? null,
            metadata: {
              projectId: updatedProject.id,
              fields: Object.keys(input.data).filter((key) => input.data[key as keyof ProjectUpdateInput] !== undefined),
            },
          },
        });

        return updatedProject;
      });

      const [projectWithMetrics] = await attachTaskMetrics([project]);
      if (projectWithMetrics === undefined) {
        throw new Error("PROJECT_METRICS_NOT_FOUND");
      }
      return projectWithMetrics;
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