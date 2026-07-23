import type { Prisma, Task, TaskPriority, TaskStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface TaskResponse {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  assigneeId: string | null;
  createdById: string;
  estimatedHours: string | null;
  actualHours: string | null;
  archived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface TaskListQuery {
  page: number;
  limit: number;
  search?: string | undefined;
  sort: "asc" | "desc";
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  assigneeId?: string | undefined;
  projectId?: string | undefined;
  overdue?: boolean | undefined;
}

export interface TaskListResult {
  tasks: TaskResponse[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface TaskCreateInput {
  projectId: string;
  title: string;
  description?: string | null | undefined;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  dueDate?: Date | null | undefined;
  assigneeId?: string | null | undefined;
  estimatedHours?: Prisma.Decimal | null | undefined;
  actualHours?: Prisma.Decimal | null | undefined;
  archived?: boolean | undefined;
}

export interface TaskUpdateInput {
  title?: string | undefined;
  description?: string | null | undefined;
  status?: TaskStatus | undefined;
  priority?: TaskPriority | undefined;
  dueDate?: Date | null | undefined;
  assigneeId?: string | null | undefined;
  estimatedHours?: Prisma.Decimal | null | undefined;
  actualHours?: Prisma.Decimal | null | undefined;
  archived?: boolean | undefined;
}

export interface TaskStatusInput { status: TaskStatus }
export interface TaskAssigneeInput { assigneeId: string | null }
export interface RequestMetadata { ipAddress: string | undefined; userAgent: string | undefined }
export type TaskRecord = Task;
export type TaskRequest = AuthenticatedRequest;