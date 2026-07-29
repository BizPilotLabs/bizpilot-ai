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

export function useAttachmentExtractionStatus(attachmentId: string | null) {
  return useQuery({
    queryKey: attachmentId === null ? attachmentQueryKeys.all : attachmentQueryKeys.extraction(attachmentId),
    queryFn: () => attachmentService.getExtractionStatus(attachmentId ?? ""),
    enabled: attachmentId !== null,
    staleTime: 10_000
  });
}

export function useExtractedAttachmentText(attachmentId: string | null, enabled: boolean) {
  return useQuery({
    queryKey: attachmentId === null ? attachmentQueryKeys.all : attachmentQueryKeys.extractedText(attachmentId),
    queryFn: () => attachmentService.getExtractedText(attachmentId ?? ""),
    enabled: attachmentId !== null && enabled,
    staleTime: 60_000
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

export function useRequestAttachmentExtraction(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => attachmentService.requestExtraction(attachmentId),
    onSuccess: (extraction, attachmentId) => {
      void queryClient.invalidateQueries({ queryKey: attachmentQueryKeys.task(taskId) });
      queryClient.setQueryData(attachmentQueryKeys.extraction(attachmentId), extraction);
    }
  });
}

export function useRetryAttachmentExtraction(taskId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (attachmentId: string) => attachmentService.retryExtraction(attachmentId),
    onSuccess: (extraction, attachmentId) => {
      void queryClient.invalidateQueries({ queryKey: attachmentQueryKeys.task(taskId) });
      queryClient.setQueryData(attachmentQueryKeys.extraction(attachmentId), extraction);
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
