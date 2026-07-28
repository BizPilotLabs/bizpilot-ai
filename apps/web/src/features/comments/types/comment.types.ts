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

export type CommentSortDirection = "asc" | "desc";

export interface CommentAuthor {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  isDeleted: boolean;
}

export interface TaskComment {
  id: string;
  taskId: string;
  organizationId: string;
  authorId: string;
  author: CommentAuthor;
  content: string;
  edited: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CommentPagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface CommentListQuery {
  page?: number | undefined;
  limit?: number | undefined;
  sort?: CommentSortDirection | undefined;
}

export interface CommentListResult {
  comments: TaskComment[];
  pagination: CommentPagination;
}

export interface CommentMutationResponse {
  comment: TaskComment;
}

export interface CommentDeleteResponse {
  deleted: boolean;
}

export interface CreateCommentInput {
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

export interface CreateCommentVariables {
  taskId: string;
  data: CreateCommentInput;
}

export interface UpdateCommentVariables {
  taskId: string;
  commentId: string;
  data: UpdateCommentInput;
}

export interface DeleteCommentVariables {
  taskId: string;
  commentId: string;
}