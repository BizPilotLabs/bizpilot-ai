import { AppError } from "../../core/errors/index.js";
import { taskRepository } from "./task.repository.js";
import type {
  RequestMetadata,
  TaskAssigneeInput,
  TaskCreateInput,
  TaskListQuery,
  TaskListResult,
  TaskRecord,
  TaskResponse,
  TaskStatusInput,
  TaskUpdateInput,
} from "./task.types.js";

const toTaskResponse = (task: TaskRecord): TaskResponse => ({
  id: task.id,
  projectId: task.projectId,
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  dueDate: task.dueDate,
  assigneeId: task.assigneeId,
  createdById: task.createdById,
  estimatedHours: task.estimatedHours?.toString() ?? null,
  actualHours: task.actualHours?.toString() ?? null,
  archived: task.archived,
  createdAt: task.createdAt,
  updatedAt: task.updatedAt,
});

export class TaskService {
  public async listTasks(input: { organizationId: string; query: TaskListQuery }): Promise<TaskListResult> {
    if (input.query.projectId !== undefined) {
      await this.ensureProjectBelongsToOrganization({ projectId: input.query.projectId, organizationId: input.organizationId });
    }

    if (input.query.assigneeId !== undefined) {
      await this.ensureAssigneeBelongsToOrganization({ assigneeId: input.query.assigneeId, organizationId: input.organizationId });
    }

    const result = await taskRepository.findTasks(input);
    const totalPages = Math.max(1, Math.ceil(result.total / input.query.limit));

    return {
      tasks: result.tasks.map(toTaskResponse),
      pagination: {
        page: input.query.page,
        limit: input.query.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  public async createTask(input: {
    organizationId: string;
    actorUserId: string;
    data: TaskCreateInput;
    metadata: RequestMetadata;
  }): Promise<TaskResponse> {
    await this.ensureProjectBelongsToOrganization({ projectId: input.data.projectId, organizationId: input.organizationId });
    await this.ensureAssigneeBelongsToOrganization({ assigneeId: input.data.assigneeId ?? null, organizationId: input.organizationId });

    const task = await taskRepository.createTask(input);
    return toTaskResponse(task);
  }

  public async getTask(input: { organizationId: string; taskId: string }): Promise<TaskResponse> {
    const task = await taskRepository.findTaskByIdInOrganization(input);

    if (task === null) {
      throw new AppError({ statusCode: 404, message: "Task not found.", code: "TASK_NOT_FOUND" });
    }

    return toTaskResponse(task);
  }

  public async updateTask(input: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    data: TaskUpdateInput;
    metadata: RequestMetadata;
  }): Promise<TaskResponse> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });
    await this.ensureAssigneeBelongsToOrganization({ assigneeId: input.data.assigneeId, organizationId: input.organizationId });

    const task = await taskRepository.updateTask(input);
    return toTaskResponse(task);
  }

  public async updateTaskStatus(input: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    data: TaskStatusInput;
    metadata: RequestMetadata;
  }): Promise<TaskResponse> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });

    const task = await taskRepository.updateTaskStatus(input);
    return toTaskResponse(task);
  }

  public async updateTaskAssignee(input: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    data: TaskAssigneeInput;
    metadata: RequestMetadata;
  }): Promise<TaskResponse> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });
    await this.ensureAssigneeBelongsToOrganization({ assigneeId: input.data.assigneeId, organizationId: input.organizationId });

    const task = await taskRepository.updateTaskAssignee(input);
    return toTaskResponse(task);
  }

  public async deleteTask(input: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });
    await taskRepository.softDeleteTask(input);
  }

  private async ensureTaskExists(input: { taskId: string; organizationId: string }): Promise<void> {
    const task = await taskRepository.findTaskByIdInOrganization(input);

    if (task === null) {
      throw new AppError({ statusCode: 404, message: "Task not found.", code: "TASK_NOT_FOUND" });
    }
  }

  private async ensureProjectBelongsToOrganization(input: { projectId: string; organizationId: string }): Promise<void> {
    const project = await taskRepository.findProjectInOrganization(input);

    if (project === null) {
      throw new AppError({ statusCode: 400, message: "Project not found.", code: "TASK_PROJECT_NOT_FOUND" });
    }
  }

  private async ensureAssigneeBelongsToOrganization(input: { assigneeId?: string | null | undefined; organizationId: string }): Promise<void> {
    if (input.assigneeId === undefined || input.assigneeId === null) {
      return;
    }

    const assignee = await taskRepository.findUserInOrganization({ userId: input.assigneeId, organizationId: input.organizationId });

    if (assignee === null) {
      throw new AppError({ statusCode: 400, message: "Assignee not found.", code: "TASK_ASSIGNEE_NOT_FOUND" });
    }
  }
}

export const taskService = new TaskService();