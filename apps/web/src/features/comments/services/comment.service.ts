import { httpClient } from "@/services";
import type {
  ApiSuccessResponse,
  CommentDeleteResponse,
  CommentListQuery,
  CommentListResult,
  CommentMutationResponse,
  CreateCommentInput,
  TaskComment,
  UpdateCommentInput
} from "../types";

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

const toQueryParams = (query: CommentListQuery = {}): URLSearchParams => {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.sort !== undefined) params.set("sort", query.sort);
  return params;
};

export const commentService = {
  async getTaskComments(taskId: string, query: CommentListQuery = {}): Promise<CommentListResult> {
    const params = toQueryParams(query);
    return unwrap(await httpClient.get<ApiSuccessResponse<CommentListResult>>(`/tasks/${taskId}/comments`, { params }));
  },

  async createComment(taskId: string, input: CreateCommentInput): Promise<TaskComment> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<CommentMutationResponse>>(`/tasks/${taskId}/comments`, input));
    return result.comment;
  },

  async updateComment(commentId: string, input: UpdateCommentInput): Promise<TaskComment> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<CommentMutationResponse>>(`/comments/${commentId}`, input));
    return result.comment;
  },

  async deleteComment(commentId: string): Promise<CommentDeleteResponse> {
    return unwrap(await httpClient.delete<ApiSuccessResponse<CommentDeleteResponse>>(`/comments/${commentId}`));
  }
};