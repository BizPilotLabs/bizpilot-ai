import type { Prisma, Task } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { RequestMetadata, TaskAssigneeInput, TaskCreateInput, TaskListQuery, TaskStatusInput, TaskUpdateInput } from "./task.types.js";

const createSearchWhere = (query: TaskListQuery): Prisma.TaskWhereInput => {
  if (query.search === undefined) return {};
  return { OR: [{ title: { contains: query.search, mode: "insensitive" } }, { description: { contains: query.search, mode: "insensitive" } }] };
};

const toCreateData = (input: { createdById: string; data: TaskCreateInput }): Prisma.TaskUncheckedCreateInput => ({
  projectId: input.data.projectId,
  createdById: input.createdById,
  title: input.data.title,
  description: input.data.description ?? null,
  status: input.data.status ?? "TODO",
  priority: input.data.priority ?? "MEDIUM",
  dueDate: input.data.dueDate ?? null,
  assigneeId: input.data.assigneeId ?? null,
  estimatedHours: input.data.estimatedHours ?? null,
  actualHours: input.data.actualHours ?? null,
  archived: input.data.archived ?? false,
});

const toUpdateData = (input: TaskUpdateInput): Prisma.TaskUncheckedUpdateInput => {
  const data: Prisma.TaskUncheckedUpdateInput = {};
  if (input.title !== undefined) data.title = input.title;
  if (input.description !== undefined) data.description = input.description;
  if (input.status !== undefined) data.status = input.status;
  if (input.priority !== undefined) data.priority = input.priority;
  if (input.dueDate !== undefined) data.dueDate = input.dueDate;
  if (input.assigneeId !== undefined) data.assigneeId = input.assigneeId;
  if (input.estimatedHours !== undefined) data.estimatedHours = input.estimatedHours;
  if (input.actualHours !== undefined) data.actualHours = input.actualHours;
  if (input.archived !== undefined) data.archived = input.archived;
  return data;
};

export class TaskRepository {
  public async findProjectInOrganization(input: { projectId: string; organizationId: string }): Promise<{ id: string } | null> {
    return prisma.project.findFirst({ where: { id: input.projectId, organizationId: input.organizationId, deletedAt: null }, select: { id: true } });
  }

  public async findUserInOrganization(input: { userId: string; organizationId: string }): Promise<{ id: string } | null> {
    return prisma.user.findFirst({ where: { id: input.userId, organizationId: input.organizationId, deletedAt: null }, select: { id: true } });
  }

  public async findTasks(input: { organizationId: string; query: TaskListQuery }): Promise<{ tasks: Task[]; total: number }> {
    const where: Prisma.TaskWhereInput = { deletedAt: null, project: { organizationId: input.organizationId, deletedAt: null }, ...createSearchWhere(input.query) };
    if (input.query.status !== undefined) where.status = input.query.status;
    if (input.query.priority !== undefined) where.priority = input.query.priority;
    if (input.query.assigneeId !== undefined) where.assigneeId = input.query.assigneeId;
    if (input.query.projectId !== undefined) where.projectId = input.query.projectId;
    if (input.query.overdue === true) where.dueDate = { lt: new Date() };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({ where, orderBy: { createdAt: input.query.sort }, skip: (input.query.page - 1) * input.query.limit, take: input.query.limit }),
      prisma.task.count({ where }),
    ]);
    return { tasks, total };
  }

  public async findTaskByIdInOrganization(input: { taskId: string; organizationId: string }): Promise<Task | null> {
    return prisma.task.findFirst({ where: { id: input.taskId, deletedAt: null, project: { organizationId: input.organizationId, deletedAt: null } } });
  }

  public async createTask(input: { actorUserId: string; organizationId: string; data: TaskCreateInput; metadata: RequestMetadata }): Promise<Task> {
    return prisma.$transaction(async (transaction) => {
      const task = await transaction.task.create({ data: toCreateData({ createdById: input.actorUserId, data: input.data }) });
      await transaction.auditLog.create({ data: { userId: input.actorUserId, organizationId: input.organizationId, action: "task.create", resource: "task", ipAddress: input.metadata.ipAddress ?? null, userAgent: input.metadata.userAgent ?? null, metadata: { taskId: task.id, projectId: task.projectId } } });
      return task;
    });
  }

  public async updateTask(input: { taskId: string; actorUserId: string; organizationId: string; data: TaskUpdateInput; metadata: RequestMetadata; action?: string }): Promise<Task> {
    return prisma.$transaction(async (transaction) => {
      const task = await transaction.task.update({ where: { id: input.taskId }, data: toUpdateData(input.data) });
      await transaction.auditLog.create({ data: { userId: input.actorUserId, organizationId: input.organizationId, action: input.action ?? "task.update", resource: "task", ipAddress: input.metadata.ipAddress ?? null, userAgent: input.metadata.userAgent ?? null, metadata: { taskId: task.id, fields: Object.keys(input.data).filter((key) => input.data[key as keyof TaskUpdateInput] !== undefined) } } });
      return task;
    });
  }

  public async updateTaskStatus(input: { taskId: string; actorUserId: string; organizationId: string; data: TaskStatusInput; metadata: RequestMetadata }): Promise<Task> {
    return this.updateTask({ ...input, data: { status: input.data.status }, action: "task.status.change" });
  }

  public async updateTaskAssignee(input: { taskId: string; actorUserId: string; organizationId: string; data: TaskAssigneeInput; metadata: RequestMetadata }): Promise<Task> {
    return this.updateTask({ ...input, data: { assigneeId: input.data.assigneeId }, action: "task.assignee.change" });
  }

  public async softDeleteTask(input: { taskId: string; actorUserId: string; organizationId: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      await transaction.task.update({ where: { id: input.taskId }, data: { deletedAt: new Date(), archived: true } });
      await transaction.auditLog.create({ data: { userId: input.actorUserId, organizationId: input.organizationId, action: "task.delete", resource: "task", ipAddress: input.metadata.ipAddress ?? null, userAgent: input.metadata.userAgent ?? null, metadata: { taskId: input.taskId } } });
    });
  }
}

export const taskRepository = new TaskRepository();