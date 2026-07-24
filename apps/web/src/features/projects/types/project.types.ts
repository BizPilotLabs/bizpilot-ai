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

export type ProjectStatus = "PLANNED" | "ACTIVE" | "ON_HOLD" | "COMPLETED" | "CANCELLED";
export type ProjectSortDirection = "asc" | "desc";

export interface Project {
  id: string;
  organizationId: string;
  name: string;
  description: string | null;
  status: ProjectStatus;
  startDate: string | null;
  endDate: string | null;
  color: string | null;
  archived: boolean;
  createdById: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProjectPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ProjectListQuery {
  page?: number;
  limit?: number;
  search?: string;
  sort?: ProjectSortDirection;
  status?: ProjectStatus;
  archived?: boolean;
}

export interface ProjectListResult {
  projects: Project[];
  pagination: ProjectPagination;
}

export interface ProjectMutationResponse {
  project: Project;
}

export interface ProjectDeleteResponse {
  deleted: boolean;
}

export interface CreateProjectInput {
  name: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  color?: string | null;
  archived?: boolean;
}

export interface UpdateProjectInput {
  name?: string;
  description?: string | null;
  status?: ProjectStatus;
  startDate?: string | Date | null;
  endDate?: string | Date | null;
  color?: string | null;
  archived?: boolean;
}

export interface UpdateProjectVariables {
  projectId: string;
  data: UpdateProjectInput;
}

