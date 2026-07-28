import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { attachmentService } from "../services";
import type { AttachmentListQuery, UploadAttachmentVariables } from "../types";
import { attachmentQueryKeys } from "./attachment-query-keys";

export function useTaskAttachments(taskId: string | null, query: AttachmentListQuery = {}) {
  return useQuery({
    queryKey: taskId === null ? attachmentQueryKeys.all : attachmentQueryKeys.taskList(taskId, query),
    queryFn: () => attachmentService.getTaskAttachments(taskId ?? "", query),
    enabled: taskId !== null,
    staleTime: 20_000
  });
}

export function useUploadTaskAttachment() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (variables: UploadAttachmentVariables) => attachmentService.uploadTaskAttachment(variables.taskId, variables.file, variables.onProgress),
    onSuccess: (_attachment, variables) => {
      void queryClient.invalidateQueries({ queryKey: attachmentQueryKeys.task(variables.taskId) });
    }
  });
}

export function useDownloadAttachment() {
  return useMutation({
    mutationFn: (attachmentId: string) => attachmentService.authorizeDownload(attachmentId)
  });
}

export function useDeleteAttachment(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => attachmentService.deleteAttachment(attachmentId),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: attachmentQueryKeys.task(taskId) });
    }
  });
}
