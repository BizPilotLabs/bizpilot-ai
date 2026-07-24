export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error?: {
    message?: string;
    code?: string;
    details?: unknown;
  };
}

export type TaskStatus = "TODO" | "IN_PROGRESS" | "IN_REVIEW" | "DONE" | "CANCELLED";
export type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
export type TaskSortDirection = "asc" | "desc";

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  createdById: string;
  estimatedHours: string | null;
  actualHours: string | null;
  archived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TaskPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface TaskListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: TaskSortDirection;
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  projectId?: string;
  overdue?: boolean;
}

export interface TaskListResult {
  tasks: Task[];
  pagination: TaskPagination;
}

export interface TaskMutationResponse {
  task: Task;
}

export interface TaskDeleteResponse {
  deleted: boolean;
}

export interface CreateTaskInput {
  projectId: string;
  title: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
  assigneeId?: string | null;
  estimatedHours?: number | string | null;
  actualHours?: number | string | null;
  archived?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus;
  priority?: TaskPriority;
  dueDate?: string | Date | null;
  assigneeId?: string | null;
  estimatedHours?: number | string | null;
  actualHours?: number | string | null;
  archived?: boolean;
}

export interface UpdateTaskVariables {
  taskId: string;
  data: UpdateTaskInput;
}

export interface UpdateTaskStatusVariables {
  taskId: string;
  status: TaskStatus;
}

export interface UpdateTaskAssigneeVariables {
  taskId: string;
  assigneeId: string | null;
}

