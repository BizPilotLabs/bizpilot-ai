import type { Response } from "express";

import {
  createTaskSchema,
  listTasksQuerySchema,
  taskIdParamsSchema,
  updateTaskAssigneeSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from "./task.schema.js";
import { taskService } from "./task.service.js";
import type { RequestMetadata, TaskRequest } from "./task.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: TaskRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = { success: true, data };
  response.status(statusCode).json(body);
};

export class TaskController {
  public async listTasks(request: TaskRequest, response: Response): Promise<void> {
    const query = listTasksQuerySchema.parse(request.query);
    const result = await taskService.listTasks({ organizationId: request.auth.organizationId, query });
    sendSuccess(response, 200, result);
  }

  public async createTask(request: TaskRequest, response: Response): Promise<void> {
    const input = createTaskSchema.parse(request.body);
    const task = await taskService.createTask({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 201, { task });
  }

  public async getTask(request: TaskRequest, response: Response): Promise<void> {
    const params = taskIdParamsSchema.parse(request.params);
    const task = await taskService.getTask({ organizationId: request.auth.organizationId, taskId: params.id });
    sendSuccess(response, 200, { task });
  }

  public async updateTask(request: TaskRequest, response: Response): Promise<void> {
    const params = taskIdParamsSchema.parse(request.params);
    const input = updateTaskSchema.parse(request.body);
    const task = await taskService.updateTask({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      taskId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { task });
  }

  public async deleteTask(request: TaskRequest, response: Response): Promise<void> {
    const params = taskIdParamsSchema.parse(request.params);
    await taskService.deleteTask({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      taskId: params.id,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { deleted: true });
  }

  public async updateTaskStatus(request: TaskRequest, response: Response): Promise<void> {
    const params = taskIdParamsSchema.parse(request.params);
    const input = updateTaskStatusSchema.parse(request.body);
    const task = await taskService.updateTaskStatus({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      taskId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { task });
  }

  public async updateTaskAssignee(request: TaskRequest, response: Response): Promise<void> {
    const params = taskIdParamsSchema.parse(request.params);
    const input = updateTaskAssigneeSchema.parse(request.body);
    const task = await taskService.updateTaskAssignee({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      taskId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { task });
  }
}

export const taskController = new TaskController();