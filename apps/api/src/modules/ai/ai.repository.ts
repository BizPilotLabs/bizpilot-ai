import type { Prisma } from "@prisma/client";
import { prisma } from "../../core/database/index.js";
import type { AiActivityContext, AiAttachmentContext, AiCommentContext, AiOrganizationContext, AiProjectContext, AiTaskContext, AiUserContext, PermissionContext } from "./ai.types.js";

const userName = (user: { firstName: string; lastName: string; email: string }): string => {
  const name = `${user.firstName} ${user.lastName}`.trim();
  return name.length > 0 ? name : user.email;
};

export class AiRepository {
  public async getPermissionContext(input: { userId: string; organizationId: string }): Promise<PermissionContext | null> {
    const user = await prisma.user.findFirst({
      where: { id: input.userId, organizationId: input.organizationId, deletedAt: null, status: "ACTIVE" },
      select: {
        roles: {
          where: { role: { deletedAt: null } },
          select: {
            role: {
              select: {
                name: true,
                permissions: {
                  where: { permission: { deletedAt: null } },
                  select: { permission: { select: { key: true } } }
                }
              }
            }
          }
        }
      }
    });

    if (user === null) return null;

    const roleNames = user.roles.map(({ role }) => role.name);
    const isElevated = roleNames.includes("Owner") || roleNames.includes("Admin");
    const permissionKeys = new Set(user.roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.key)));
    return { isElevated, permissionKeys };
  }

  public async getOrganization(organizationId: string): Promise<AiOrganizationContext | null> {
    const organization = await prisma.organization.findFirst({
      where: { id: organizationId, deletedAt: null },
      select: { id: true, name: true, slug: true, timezone: true, country: true, currency: true, plan: true, updatedAt: true }
    });

    return organization === null ? null : { ...organization, plan: organization.plan };
  }

  public async getOrganizationProjects(input: { organizationId: string; limit: number }): Promise<AiProjectContext[]> {
    const projects = await prisma.project.findMany({
      where: { organizationId: input.organizationId, deletedAt: null },
      select: { id: true, name: true, description: true, status: true, archived: true, startDate: true, endDate: true, updatedAt: true },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: input.limit
    });
    return projects.map((project) => ({ ...project, status: project.status }));
  }

  public async getProject(input: { organizationId: string; projectId: string }): Promise<AiProjectContext | null> {
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId: input.organizationId, deletedAt: null },
      select: { id: true, name: true, description: true, status: true, archived: true, startDate: true, endDate: true, updatedAt: true }
    });
    return project === null ? null : { ...project, status: project.status };
  }

  public async getOrganizationTasks(input: { organizationId: string; limit: number }): Promise<AiTaskContext[]> {
    const tasks = await prisma.task.findMany({
      where: { deletedAt: null, project: { organizationId: input.organizationId, deletedAt: null } },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        archived: true,
        updatedAt: true,
        project: { select: { name: true } },
        assignee: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: input.limit
    });

    return tasks.map((task) => ({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      archived: task.archived,
      updatedAt: task.updatedAt,
      projectName: task.project.name,
      assigneeName: task.assignee === null ? undefined : userName(task.assignee)
    }));
  }

  public async getProjectTasks(input: { organizationId: string; projectId: string; limit: number }): Promise<AiTaskContext[]> {
    const tasks = await prisma.task.findMany({
      where: { projectId: input.projectId, deletedAt: null, project: { organizationId: input.organizationId, deletedAt: null } },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        archived: true,
        updatedAt: true,
        project: { select: { name: true } },
        assignee: { select: { firstName: true, lastName: true, email: true } }
      },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: input.limit
    });

    return tasks.map((task) => ({
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      archived: task.archived,
      updatedAt: task.updatedAt,
      projectName: task.project.name,
      assigneeName: task.assignee === null ? undefined : userName(task.assignee)
    }));
  }

  public async getTask(input: { organizationId: string; taskId: string }): Promise<AiTaskContext | null> {
    const task = await prisma.task.findFirst({
      where: { id: input.taskId, deletedAt: null, project: { organizationId: input.organizationId, deletedAt: null } },
      select: {
        id: true,
        projectId: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        archived: true,
        updatedAt: true,
        project: { select: { name: true } },
        assignee: { select: { firstName: true, lastName: true, email: true } }
      }
    });

    if (task === null) return null;
    return {
      id: task.id,
      projectId: task.projectId,
      title: task.title,
      description: task.description,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      archived: task.archived,
      updatedAt: task.updatedAt,
      projectName: task.project.name,
      assigneeName: task.assignee === null ? undefined : userName(task.assignee)
    };
  }

  public async getTaskComments(input: { organizationId: string; taskIds: string[]; limit: number }): Promise<AiCommentContext[]> {
    if (input.taskIds.length === 0) return [];
    const comments = await prisma.comment.findMany({
      where: { organizationId: input.organizationId, taskId: { in: input.taskIds }, deletedAt: null },
      select: { id: true, taskId: true, content: true, edited: true, updatedAt: true, author: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: [{ updatedAt: "desc" }, { id: "desc" }],
      take: input.limit
    });
    return comments.map((comment) => ({ id: comment.id, taskId: comment.taskId, authorName: userName(comment.author), content: comment.content, edited: comment.edited, updatedAt: comment.updatedAt }));
  }

  public async getTaskAttachments(input: { organizationId: string; taskIds: string[]; limit: number }): Promise<AiAttachmentContext[]> {
    if (input.taskIds.length === 0) return [];
    return prisma.attachment.findMany({
      where: { organizationId: input.organizationId, taskId: { in: input.taskIds }, deletedAt: null, status: "READY" },
      select: { id: true, taskId: true, originalName: true, mimeType: true, fileSize: true, createdAt: true },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.limit
    });
  }

  public async getActivities(input: { organizationId: string; limit: number; resourceIds?: string[] }): Promise<AiActivityContext[]> {
    const where: Prisma.AuditLogWhereInput = { organizationId: input.organizationId };
    const activities = await prisma.auditLog.findMany({
      where,
      select: { id: true, action: true, resource: true, createdAt: true, user: { select: { firstName: true, lastName: true, email: true } } },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.limit
    });
    return activities.map((activity) => ({ id: activity.id, action: activity.action, resource: activity.resource, actorName: activity.user === null ? null : userName(activity.user), createdAt: activity.createdAt }));
  }

  public async getUsers(input: { organizationId: string; limit: number }): Promise<AiUserContext[]> {
    const users = await prisma.user.findMany({
      where: { organizationId: input.organizationId, deletedAt: null },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        createdAt: true,
        roles: { where: { role: { deletedAt: null } }, select: { role: { select: { name: true } } } }
      },
      orderBy: [{ createdAt: "desc" }, { id: "desc" }],
      take: input.limit
    });
    return users.map((user) => ({ ...user, status: user.status, roleNames: user.roles.map(({ role }) => role.name) }));
  }

  public async recordUsage(input: { userId: string; organizationId: string; action: string; metadata: Prisma.InputJsonValue; ipAddress?: string; userAgent?: string }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: input.userId,
        organizationId: input.organizationId,
        action: input.action,
        resource: "ai",
        ipAddress: input.ipAddress ?? null,
        userAgent: input.userAgent ?? null,
        metadata: input.metadata
      }
    });
  }
}

export const aiRepository = new AiRepository();

