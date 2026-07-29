import { httpClient } from "@/services";
import type {
  ApiSuccessResponse,
  Attachment,
  AttachmentDeleteResponse,
  AttachmentDownloadResponse,
  AttachmentExtractedText,
  AttachmentExtractedTextResponse,
  AttachmentExtractionResponse,
  AttachmentExtractionSummary,
  AttachmentListQuery,
  AttachmentListResult,
  AttachmentMutationResponse,
  AttachmentUploadResponse,
  InitializeAttachmentUploadInput
} from "../types";

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

const toQueryParams = (query: AttachmentListQuery = {}): URLSearchParams => {
  const params = new URLSearchParams();
  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.sort !== undefined) params.set("sort", query.sort);
  return params;
};

const uploadToPresignedUrl = (input: { file: File; uploadUrl: string; headers: Record<string, string>; onProgress?: (progress: number) => void }): Promise<void> =>
  new Promise((resolve, reject) => {
    const request = new XMLHttpRequest();
    request.open("PUT", input.uploadUrl);

    for (const [key, value] of Object.entries(input.headers)) {
      request.setRequestHeader(key, value);
    }

    request.upload.onprogress = (event) => {
      if (event.lengthComputable && input.onProgress) {
        input.onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };

    request.onload = () => {
      if (request.status >= 200 && request.status < 300) {
        resolve();
        return;
      }
      reject(new Error("The file could not be uploaded to storage."));
    };

    request.onerror = () => reject(new Error("The file could not be uploaded to storage."));
    request.send(input.file);
  });

export const attachmentService = {
  async getTaskAttachments(taskId: string, query: AttachmentListQuery = {}): Promise<AttachmentListResult> {
    const params = toQueryParams(query);
    return unwrap(await httpClient.get<ApiSuccessResponse<AttachmentListResult>>(`/tasks/${taskId}/attachments`, { params }));
  },

  async initializeTaskAttachmentUpload(taskId: string, input: InitializeAttachmentUploadInput): Promise<AttachmentUploadResponse["upload"]> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<AttachmentUploadResponse>>(`/tasks/${taskId}/attachments`, input));
    return result.upload;
  },

  async finalizeAttachmentUpload(attachmentId: string): Promise<Attachment> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<AttachmentMutationResponse>>(`/attachments/${attachmentId}/complete`, {}));
    return result.attachment;
  },

  async uploadTaskAttachment(taskId: string, file: File, onProgress?: (progress: number) => void): Promise<Attachment> {
    const upload = await this.initializeTaskAttachmentUpload(taskId, {
      originalName: file.name,
      mimeType: file.type,
      fileSize: file.size
    });

    const uploadInput = { file, uploadUrl: upload.uploadUrl, headers: upload.headers };
    await uploadToPresignedUrl(onProgress === undefined ? uploadInput : { ...uploadInput, onProgress });
    return this.finalizeAttachmentUpload(upload.attachment.id);
  },

  async requestExtraction(attachmentId: string): Promise<AttachmentExtractionSummary> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<AttachmentExtractionResponse>>(`/attachments/${attachmentId}/extraction`, {}));
    return result.extraction;
  },

  async retryExtraction(attachmentId: string): Promise<AttachmentExtractionSummary> {
    const result = unwrap(await httpClient.post<ApiSuccessResponse<AttachmentExtractionResponse>>(`/attachments/${attachmentId}/extraction/retry`, {}));
    return result.extraction;
  },

  async getExtractionStatus(attachmentId: string): Promise<AttachmentExtractionSummary> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<AttachmentExtractionResponse>>(`/attachments/${attachmentId}/extraction`));
    return result.extraction;
  },

  async getExtractedText(attachmentId: string): Promise<AttachmentExtractedText> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<AttachmentExtractedTextResponse>>(`/attachments/${attachmentId}/extraction/text`));
    return result.extraction;
  },

  async authorizeDownload(attachmentId: string): Promise<AttachmentDownloadResponse> {
    return unwrap(await httpClient.get<ApiSuccessResponse<AttachmentDownloadResponse>>(`/attachments/${attachmentId}/download`));
  },

  async deleteAttachment(attachmentId: string): Promise<AttachmentDeleteResponse> {
    return unwrap(await httpClient.delete<ApiSuccessResponse<AttachmentDeleteResponse>>(`/attachments/${attachmentId}`));
  }
};
