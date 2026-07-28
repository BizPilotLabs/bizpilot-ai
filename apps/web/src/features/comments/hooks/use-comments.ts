import { useMutation, useQuery, useQueryClient, type QueryClient } from "@tanstack/react-query";
import { taskQueryKeys } from "@/features/tasks/hooks/task-query-keys";
import { commentService } from "../services";
import type { CommentListQuery, CreateCommentVariables, DeleteCommentVariables, UpdateCommentVariables } from "../types";
import { commentQueryKeys } from "./comment-query-keys";

const invalidateCommentTaskState = (queryClient: QueryClient, taskId: string): void => {
  void queryClient.invalidateQueries({ queryKey: commentQueryKeys.task(taskId) });
  void queryClient.invalidateQueries({ queryKey: taskQueryKeys.all });
};

export function useTaskComments(taskId: string | undefined, query: CommentListQuery = {}) {
  return useQuery({
    queryKey: taskId === undefined ? commentQueryKeys.all : commentQueryKeys.taskList(taskId, query),
    queryFn: () => commentService.getTaskComments(taskId ?? "", query),
    enabled: taskId !== undefined && taskId.length > 0,
    staleTime: 20_000
  });
}

export function useCreateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: CreateCommentVariables) => commentService.createComment(variables.taskId, variables.data),
    onSuccess: (_comment, variables) => invalidateCommentTaskState(queryClient, variables.taskId)
  });
}

export function useUpdateComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: UpdateCommentVariables) => commentService.updateComment(variables.commentId, variables.data),
    onSuccess: (_comment, variables) => invalidateCommentTaskState(queryClient, variables.taskId)
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: DeleteCommentVariables) => commentService.deleteComment(variables.commentId),
    onSuccess: (_result, variables) => invalidateCommentTaskState(queryClient, variables.taskId)
  });
}