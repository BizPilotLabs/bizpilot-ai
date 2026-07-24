import type {
  ApiSuccessResponse,
  CreateProjectInput,
  Project,
  ProjectDeleteResponse,
  ProjectListQuery,
  ProjectListResult,
  ProjectMutationResponse,
  UpdateProjectInput
} from "../types";
import { httpClient } from "@/services";

const toIsoDateValue = (value: string | Date | null | undefined): string | null | undefined => {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
};

const toProjectPayload = <TPayload extends CreateProjectInput | UpdateProjectInput>(payload: TPayload): Record<string, unknown> => {
  const nextPayload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(payload)) {
    if (value === undefined) {
      continue;
    }

    if (key === "startDate" || key === "endDate") {
      nextPayload[key] = toIsoDateValue(value as string | Date | null | undefined);
      continue;
    }

    nextPayload[key] = value;
  }

  return nextPayload;
};

const toQueryParams = (query: ProjectListQuery = {}): URLSearchParams => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.search !== undefined) params.set("search", query.search);
  if (query.sort !== undefined) params.set("sort", query.sort);
  if (query.status !== undefined) params.set("status", query.status);
  if (query.archived !== undefined) params.set("archived", String(query.archived));

  return params;
};

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

export const projectService = {
  async getProjects(query: ProjectListQuery = {}): Promise<ProjectListResult> {
    const params = toQueryParams(query);
    return unwrap(await httpClient.get<ApiSuccessResponse<ProjectListResult>>("/projects", { params }));
  },

  async getProjectById(projectId: string): Promise<Project> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<ProjectMutationResponse>>(`/projects/${projectId}`));
    return result.project;
  },

  async createProject(input: CreateProjectInput): Promise<Project> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<ProjectMutationResponse>>("/projects", toProjectPayload(input)));
    return result.project;
  },

  async updateProject(projectId: string, input: UpdateProjectInput): Promise<Project> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<ProjectMutationResponse>>(`/projects/${projectId}`, toProjectPayload(input)));
    return result.project;
  },

  async deleteProject(projectId: string): Promise<ProjectDeleteResponse> {
    return unwrap(await httpClient.delete<ApiSuccessResponse<ProjectDeleteResponse>>(`/projects/${projectId}`));
  }
};

