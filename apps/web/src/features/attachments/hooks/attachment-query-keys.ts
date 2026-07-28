import type { AttachmentListQuery } from "../types";

export const attachmentQueryKeys = {
  all: ["attachments"] as const,
  task: (taskId: string) => [...attachmentQueryKeys.all, "task", taskId] as const,
  taskList: (taskId: string, query: AttachmentListQuery = {}) => [...attachmentQueryKeys.task(taskId), "list", query] as const
};
