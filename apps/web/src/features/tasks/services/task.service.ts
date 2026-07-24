import type {
  ApiSuccessResponse,
  CreateTaskInput,
  Task,
  TaskDeleteResponse,
  TaskListQuery,
  TaskListResult,
  TaskMutationResponse,
  TaskStatus,
  UpdateTaskInput
} from "../types";
import { httpClient } from "@/services";

const toIsoDateValue = (value: string | Date | null | undefined): string | null | undefined => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
};

const toTaskPayload = <TPayload extends CreateTaskInput | UpdateTaskInput>(payload: TPayload): Record<string, unknown> => {
  const nextPayload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue;
    }

    if (key === "dueDate") {
      nextPayload[key] = toIsoDateValue(value as string | Date | null | undefined);
      continue;
    }

    nextPayload[key] = value;
  }

  return nextPayload;
};

const toQueryParams = (query: TaskListQuery = {}): URLSearchParams => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.search !== undefined) params.set("search", query.search);
  if (query.sort !== undefined) params.set("sort", query.sort);
  if (query.status !== undefined) params.set("status", query.status);
  if (query.priority !== undefined) params.set("priority", query.priority);
  if (query.assigneeId !== undefined) params.set("assigneeId", query.assigneeId);
  if (query.projectId !== undefined) params.set("projectId", query.projectId);
  if (query.overdue !== undefined) params.set("overdue", String(query.overdue));

  return params;
};

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

export const taskService = {
  async getTasks(query: TaskListQuery = {}): Promise<TaskListResult> {
    const params = toQueryParams(query);
    return unwrap(await httpClient.get<ApiSuccessResponse<TaskListResult>>("/tasks", { params }));
  },

  async getTaskById(taskId: string): Promise<Task> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<TaskMutationResponse>>(`/tasks/${taskId}`));
    return result.task;
  },

  async createTask(input: CreateTaskInput): Promise<Task> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<TaskMutationResponse>>("/tasks", toTaskPayload(input)));
    return result.task;
  },

  async updateTask(taskId: string, input: UpdateTaskInput): Promise<Task> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<TaskMutationResponse>>(`/tasks/${taskId}`, toTaskPayload(input)));
    return result.task;
  },

  async deleteTask(taskId: string): Promise<TaskDeleteResponse> {
    return unwrap(await httpClient.delete<ApiSuccessResponse<TaskDeleteResponse>>(`/tasks/${taskId}`));
  },

  async updateTaskStatus(taskId: string, status: TaskStatus): Promise<Task> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<TaskMutationResponse>>(`/tasks/${taskId}/status`, { status }));
    return result.task;
  },

  async updateTaskAssignee(taskId: string, assigneeId: string | null): Promise<Task> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<TaskMutationResponse>>(`/tasks/${taskId}/assignee`, { assigneeId }));
    return result.task;
  }
};

