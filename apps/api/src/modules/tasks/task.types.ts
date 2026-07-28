import { Prisma, type TaskPriority, type TaskStatus, type UserStatus } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

const _taskWithRelations = Prisma.validator<Prisma.TaskDefaultArgs>()({
  include: {
    project: {
      select: {
        id: true,
        name: true,
        status: true,
        archived: true,
      },
    },
    assignee: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
      },
    },
    createdBy: {
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        avatar: true,
        status: true,
      },
    },
    _count: {
      select: {
        comments: true,
        attachments: true,
      },
    },
  },
});

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
  status: UserStatus;
}

export interface TaskResponse {
  id: string;
  projectId: string;
  project: TaskProjectSummary;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  assigneeId: string | null;
  assignee: TaskUserSummary | null;
  createdById: string;
  createdBy: TaskUserSummary;
  estimatedHours: string | null;
  actualHours: string | null;
  archived: boolean;
  commentCount: number;
  attachmentCount: number;
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
export type TaskRecord = Prisma.TaskGetPayload<typeof _taskWithRelations>;
export type TaskRequest = AuthenticatedRequest;