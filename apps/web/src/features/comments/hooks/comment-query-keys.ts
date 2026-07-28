import type { CommentListQuery } from "../types";

export const commentQueryKeys = {
  all: ["comments"] as const,
  task: (taskId: string) => [...commentQueryKeys.all, "task", taskId] as const,
  taskLists: (taskId: string) => [...commentQueryKeys.task(taskId), "list"] as const,
  taskList: (taskId: string, query: CommentListQuery = {}) => [...commentQueryKeys.taskLists(taskId), query] as const
};