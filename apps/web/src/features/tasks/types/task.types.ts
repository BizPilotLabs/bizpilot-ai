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

export interface TaskProjectSummary {
  id: string;
  name: string;
  status: string;
  archived: boolean;
}

export interface TaskUserSummary {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  status: string;
}

export interface Task {
  id: string;
  projectId: string;
  project: TaskProjectSummary;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  assigneeId: string | null;
  assignee: TaskUserSummary | null;
  createdById: string;
  createdBy: TaskUserSummary;
  estimatedHours: string | null;
  actualHours: string | null;
  archived: boolean;
  commentCount: number;
  attachmentCount: number;
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
  page?: number | undefined;
  limit?: number | undefined;
  search?: string | undefined;
  sort?: TaskSortDirection | undefined;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  assigneeId?: string | undefined;
  projectId?: string | undefined;
  overdue?: boolean | undefined;
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
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  dueDate?: string | Date | null;
  assigneeId?: string | null;
  estimatedHours?: number | string | null;
  actualHours?: number | string | null;
  archived?: boolean;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string | null;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
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