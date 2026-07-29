import crypto from "node:crypto";

import { env } from "../../config/index.js";
import { backgroundJobDispatcher } from "../../core/background/index.js";
import { AppError } from "../../core/errors/index.js";
import { logger } from "../../core/logger/index.js";
import { metricsClient } from "../../core/metrics/index.js";
import { storageProvider } from "../../core/storage/index.js";
import { attachmentRepository } from "./attachment.repository.js";
import type { AttachmentExtractionSummary, AttachmentExtractedTextResponse, ExtractionFailureCode } from "./extraction/index.js";
import { AttachmentExtractionError, textExtractorRegistry, toExtractionFailureCode } from "./extraction/index.js";
import type {
  AttachmentDownloadAuthorization,
  AttachmentListQuery,
  AttachmentListResult,
  AttachmentRecord,
  AttachmentResponse,
  AttachmentUploadAuthorization,
  AttachmentUploadIntentInput,
  RequestMetadata
} from "./attachment.types.js";

const filenameExtensionByMimeType: Readonly<Record<string, string[]>> = {
  "application/pdf": [".pdf"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [".xlsx"],
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": [".pptx"],
  "text/plain": [".txt", ".md"],
  "image/png": [".png"],
  "image/jpeg": [".jpg", ".jpeg"]
};

const toAttachmentResponse = (attachment: AttachmentRecord): AttachmentResponse => ({
  id: attachment.id,
  organizationId: attachment.organizationId,
  taskId: attachment.taskId,
  uploadedBy: attachment.uploadedBy,
  originalName: attachment.originalName,
  storedName: attachment.storedName,
  mimeType: attachment.mimeType,
  fileSize: attachment.fileSize,
  provider: attachment.provider,
  status: attachment.status,
  uploadExpiresAt: attachment.uploadExpiresAt,
  finalizedAt: attachment.finalizedAt,
  extractionStatus: attachment.extractionStatus,
  extractionErrorCode: attachment.extractionErrorCode,
  extractionRequestedAt: attachment.extractionRequestedAt,
  extractionStartedAt: attachment.extractionStartedAt,
  extractionCompletedAt: attachment.extractionCompletedAt,
  extractorName: attachment.extractorName,
  extractorVersion: attachment.extractorVersion,
  extractedCharacterCount: attachment.extractedCharacterCount,
  extractionTruncated: attachment.extractionTruncated,
  createdAt: attachment.createdAt
});

const toExtractionSummary = (attachment: AttachmentRecord): AttachmentExtractionSummary => ({
  attachmentId: attachment.id,
  status: attachment.extractionStatus,
  supported: textExtractorRegistry.isSupported({ mimeType: attachment.mimeType, originalName: attachment.originalName, fileSize: attachment.fileSize }),
  extractorName: attachment.extractorName,
  extractorVersion: attachment.extractorVersion,
  characterCount: attachment.extractedCharacterCount,
  truncated: attachment.extractionTruncated,
  errorCode: attachment.extractionErrorCode,
  requestedAt: attachment.extractionRequestedAt,
  startedAt: attachment.extractionStartedAt,
  completedAt: attachment.extractionCompletedAt
});

const getExtension = (filename: string): string => {
  const index = filename.lastIndexOf(".");
  return index >= 0 ? filename.slice(index).toLowerCase() : "";
};

const sanitizeFilename = (filename: string): string => {
  const normalized = filename.normalize("NFKD").replace(/[^\w.\- ]/gu, "").replace(/\s+/gu, "-").replace(/-+/gu, "-").replace(/\.+/gu, ".").replace(/^\.+/gu, "");
  const safe = normalized.length > 0 ? normalized : "attachment";
  return safe.slice(0, 120);
};

const ensureAllowedExtension = (input: AttachmentUploadIntentInput): void => {
  const allowedExtensions = filenameExtensionByMimeType[input.mimeType] ?? [];
  const extension = getExtension(input.originalName);

  if (!allowedExtensions.includes(extension)) {
    throw new AppError({ statusCode: 400, message: "File extension does not match the declared file type.", code: "ATTACHMENT_EXTENSION_NOT_ALLOWED" });
  }
};

const normalizeContentType = (value: string | null): string | null => {
  if (value === null) return null;
  return value.split(";")[0]?.trim().toLowerCase() ?? null;
};

const ensureStorageEnabled = (): void => {
  if (!storageProvider.enabled) {
    throw new AppError({ statusCode: 503, message: "Attachment storage is not configured.", code: "STORAGE_NOT_CONFIGURED" });
  }
};

const mimeCategory = (mimeType: string): string => {
  if (mimeType === "text/plain") return "text";
  if (mimeType === "application/pdf") return "pdf";
  if (mimeType.includes("wordprocessingml")) return "docx";
  return "unsupported";
};

const resultMetric = (input: { attachment: AttachmentRecord; extractor: string; result: "requested" | "completed" | "failed" | "unsupported"; truncated?: boolean; durationSeconds?: number }): void => {
  metricsClient.recordAttachmentExtraction({ mimeCategory: mimeCategory(input.attachment.mimeType), extractor: input.extractor, result: input.result, truncated: input.truncated === true ? "true" : "false" }, input.durationSeconds ?? 0);
};

export class AttachmentService {
  public async listAttachments(input: { organizationId: string; taskId: string; query: AttachmentListQuery }): Promise<AttachmentListResult> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });

    const result = await attachmentRepository.findAttachments(input);
    const totalPages = Math.max(1, Math.ceil(result.total / input.query.limit));

    return {
      attachments: result.attachments.map(toAttachmentResponse),
      pagination: {
        page: input.query.page,
        limit: input.query.limit,
        total: result.total,
        totalPages
      }
    };
  }

  public async initializeUpload(input: { organizationId: string; actorUserId: string; taskId: string; data: AttachmentUploadIntentInput }): Promise<AttachmentUploadAuthorization> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });
    await this.ensureUploaderExists({ userId: input.actorUserId, organizationId: input.organizationId });
    ensureAllowedExtension(input.data);
    ensureStorageEnabled();

    const attachmentId = crypto.randomUUID();
    const storedName = sanitizeFilename(input.data.originalName);
    const storagePath = `organizations/${input.organizationId}/tasks/${input.taskId}/attachments/${attachmentId}/${storedName}`;
    const expiresAt = new Date(Date.now() + env.R2_PRESIGNED_UPLOAD_EXPIRES_SECONDS * 1000);

    const attachment = await attachmentRepository.createPendingAttachment({ id: attachmentId, taskId: input.taskId, organizationId: input.organizationId, uploadedBy: input.actorUserId, data: input.data, provider: storageProvider.providerName, storagePath, storedName, uploadExpiresAt: expiresAt });
    const upload = await storageProvider.createUploadUrl({ key: storagePath, mimeType: input.data.mimeType, expiresInSeconds: env.R2_PRESIGNED_UPLOAD_EXPIRES_SECONDS });

    return { attachment: toAttachmentResponse(attachment), uploadUrl: upload.url, headers: upload.headers, expiresAt };
  }

  public async finalizeUpload(input: { organizationId: string; actorUserId: string; attachmentId: string; metadata: RequestMetadata }): Promise<AttachmentResponse> {
    const attachment = await attachmentRepository.findAttachmentByIdInOrganization(input);

    if (attachment === null) throw new AppError({ statusCode: 404, message: "Attachment not found.", code: "ATTACHMENT_NOT_FOUND" });
    if (attachment.status === "READY") throw new AppError({ statusCode: 409, message: "Attachment upload has already been finalized.", code: "ATTACHMENT_ALREADY_FINALIZED" });
    if (attachment.uploadExpiresAt !== null && attachment.uploadExpiresAt.getTime() < Date.now()) throw new AppError({ statusCode: 410, message: "Attachment upload authorization has expired.", code: "ATTACHMENT_UPLOAD_EXPIRED" });

    const metadata = await storageProvider.getObjectMetadata(attachment.storagePath);
    if (metadata === null) throw new AppError({ statusCode: 409, message: "Uploaded object was not found in storage.", code: "ATTACHMENT_OBJECT_MISSING" });
    if (metadata.contentLength !== null && metadata.contentLength !== attachment.fileSize) throw new AppError({ statusCode: 409, message: "Uploaded object size does not match the authorized file size.", code: "ATTACHMENT_SIZE_MISMATCH" });

    const contentType = normalizeContentType(metadata.contentType);
    if (contentType !== null && contentType !== attachment.mimeType) throw new AppError({ statusCode: 409, message: "Uploaded object type does not match the authorized MIME type.", code: "ATTACHMENT_TYPE_MISMATCH" });

    const finalized = await attachmentRepository.finalizeAttachment({ attachment, actorUserId: input.actorUserId, metadata: input.metadata });
    return toAttachmentResponse(finalized);
  }

  public async getAttachment(input: { organizationId: string; attachmentId: string }): Promise<AttachmentResponse> {
    const attachment = await attachmentRepository.findReadyAttachmentByIdInOrganization(input);
    if (attachment === null) throw new AppError({ statusCode: 404, message: "Attachment not found.", code: "ATTACHMENT_NOT_FOUND" });
    return toAttachmentResponse(attachment);
  }

  public async authorizeDownload(input: { organizationId: string; attachmentId: string }): Promise<AttachmentDownloadAuthorization> {
    const attachment = await attachmentRepository.findReadyAttachmentByIdInOrganization(input);
    if (attachment === null) throw new AppError({ statusCode: 404, message: "Attachment not found.", code: "ATTACHMENT_NOT_FOUND" });

    const expiresAt = new Date(Date.now() + env.R2_PRESIGNED_DOWNLOAD_EXPIRES_SECONDS * 1000);
    const download = await storageProvider.createDownloadUrl({ key: attachment.storagePath, filename: attachment.originalName, expiresInSeconds: env.R2_PRESIGNED_DOWNLOAD_EXPIRES_SECONDS });
    return { downloadUrl: download.url, expiresAt };
  }

  public async requestExtraction(input: { organizationId: string; actorUserId: string; attachmentId: string; metadata: RequestMetadata }): Promise<AttachmentExtractionSummary> {
    const attachment = await this.getReadyAttachmentRecord(input);

    if (!env.ATTACHMENT_EXTRACTION_ENABLED) {
      throw new AppError({ statusCode: 503, message: "Attachment text extraction is disabled.", code: "ATTACHMENT_EXTRACTION_DISABLED" });
    }

    try {
      textExtractorRegistry.select({ attachmentId: attachment.id, organizationId: attachment.organizationId, originalName: attachment.originalName, mimeType: attachment.mimeType, fileSize: attachment.fileSize });
    } catch (error) {
      const code = error instanceof AttachmentExtractionError ? error.extractionCode : "UNSUPPORTED_FILE_TYPE";
      const unsupported = await attachmentRepository.markExtractionUnsupported({ attachment, actorUserId: input.actorUserId, code, metadata: input.metadata });
      resultMetric({ attachment: unsupported, extractor: "unsupported", result: "unsupported" });
      return toExtractionSummary(unsupported);
    }

    const requested = await attachmentRepository.requestExtraction({ attachment, actorUserId: input.actorUserId, metadata: input.metadata });
    resultMetric({ attachment: requested, extractor: requested.extractorName ?? "pending", result: "requested" });

    if (requested.extractionStatus === "PENDING") {
      this.dispatchExtractionJob({ attachmentId: requested.id, actorUserId: input.actorUserId, metadata: input.metadata });
    }

    return toExtractionSummary(requested);
  }

  public async retryExtraction(input: { organizationId: string; actorUserId: string; attachmentId: string; metadata: RequestMetadata }): Promise<AttachmentExtractionSummary> {
    const attachment = await this.getReadyAttachmentRecord(input);
    if (attachment.extractionStatus !== "FAILED" && attachment.extractionStatus !== "UNSUPPORTED") {
      return toExtractionSummary(attachment);
    }

    const retried = await attachmentRepository.retryExtraction({ attachment, actorUserId: input.actorUserId, metadata: input.metadata });
    this.dispatchExtractionJob({ attachmentId: retried.id, actorUserId: input.actorUserId, metadata: input.metadata });
    return toExtractionSummary(retried);
  }

  public async getExtractionStatus(input: { organizationId: string; attachmentId: string }): Promise<AttachmentExtractionSummary> {
    const attachment = await this.getReadyAttachmentRecord(input);
    return toExtractionSummary(attachment);
  }

  public async getExtractedText(input: { organizationId: string; attachmentId: string }): Promise<AttachmentExtractedTextResponse> {
    const attachment = await this.getReadyAttachmentRecord(input);
    const summary = toExtractionSummary(attachment);
    return { ...summary, text: attachment.extractionStatus === "COMPLETED" ? attachment.extractedText : null };
  }

  public async processExtractionJob(input: { attachmentId: string; actorUserId: string; metadata: RequestMetadata }): Promise<void> {
    const attachment = await attachmentRepository.claimExtractionJob({ attachmentId: input.attachmentId });
    if (attachment === null) return;

    const startedAt = performance.now();
    let extractorName = "unknown";

    try {
      const extractor = textExtractorRegistry.select({ attachmentId: attachment.id, organizationId: attachment.organizationId, originalName: attachment.originalName, mimeType: attachment.mimeType, fileSize: attachment.fileSize });
      extractorName = extractor.name;
      ensureStorageEnabled();

      const object = await storageProvider.getObjectContent({ key: attachment.storagePath, maxBytes: Math.min(extractor.maxFileBytes, env.ATTACHMENT_EXTRACTION_MAX_FILE_BYTES), timeoutMs: env.ATTACHMENT_EXTRACTION_TIMEOUT_MS });
      if (object === null) throw new AttachmentExtractionError("FILE_MISSING");

      const contentType = normalizeContentType(object.metadata.contentType);
      if (contentType !== null && contentType !== attachment.mimeType) throw new AttachmentExtractionError("MIME_MISMATCH");

      const result = await extractor.extract({ attachment: { attachmentId: attachment.id, organizationId: attachment.organizationId, originalName: attachment.originalName, mimeType: attachment.mimeType, fileSize: attachment.fileSize }, content: object.body, limits: { maxFileBytes: env.ATTACHMENT_EXTRACTION_MAX_FILE_BYTES, maxTextCharacters: env.ATTACHMENT_EXTRACTION_MAX_TEXT_CHARS, timeoutMs: env.ATTACHMENT_EXTRACTION_TIMEOUT_MS } });
      const durationSeconds = (performance.now() - startedAt) / 1000;
      await attachmentRepository.completeExtraction({ attachment, result, actorUserId: input.actorUserId, metadata: input.metadata, durationMs: durationSeconds * 1000 });
      resultMetric({ attachment, extractor: result.extractorName, result: "completed", truncated: result.truncated, durationSeconds });
      logger.info({ attachmentExtraction: { result: "completed", extractor: result.extractorName, mimeCategory: mimeCategory(attachment.mimeType), durationSeconds, characterCount: result.characterCount, truncated: result.truncated } }, "Attachment text extraction completed");
    } catch (error) {
      const failureCode: ExtractionFailureCode = toExtractionFailureCode(error);
      await attachmentRepository.failExtraction({ attachment, code: failureCode, actorUserId: input.actorUserId, metadata: input.metadata });
      resultMetric({ attachment, extractor: extractorName, result: "failed", durationSeconds: (performance.now() - startedAt) / 1000 });
      logger.warn({ attachmentExtraction: { result: "failed", extractor: extractorName, mimeCategory: mimeCategory(attachment.mimeType), failureCode } }, "Attachment text extraction failed");
    }
  }

  public async deleteAttachment(input: { organizationId: string; actorUserId: string; attachmentId: string; metadata: RequestMetadata }): Promise<void> {
    const attachment = await attachmentRepository.findAttachmentByIdInOrganization({ attachmentId: input.attachmentId, organizationId: input.organizationId });
    if (attachment === null) throw new AppError({ statusCode: 404, message: "Attachment not found.", code: "ATTACHMENT_NOT_FOUND" });
    await storageProvider.deleteObject(attachment.storagePath);
    await attachmentRepository.softDeleteAttachment({ attachment, actorUserId: input.actorUserId, metadata: input.metadata });
  }

  public async cleanupExpiredPendingUploads(input: { now?: Date } = {}): Promise<{ deleted: number }> {
    const now = input.now ?? new Date();
    const expired = await attachmentRepository.deleteExpiredPendingAttachments({ now });
    await Promise.all(expired.map((attachment) => storageProvider.deleteObject(attachment.storagePath).catch(() => undefined)));
    return { deleted: expired.length };
  }

  private dispatchExtractionJob(input: { attachmentId: string; actorUserId: string; metadata: RequestMetadata }): void {
    const result = backgroundJobDispatcher.dispatch({ key: `attachment-extraction:${input.attachmentId}`, name: "attachment_extraction", run: () => this.processExtractionJob(input) });
    if (result.status === "rejected" || result.status === "shutting_down") {
      logger.warn({ attachmentExtraction: { result: result.status, workerType: backgroundJobDispatcher.workerType } }, "Attachment text extraction job was not accepted");
    }
  }

  private async getReadyAttachmentRecord(input: { organizationId: string; attachmentId: string }): Promise<AttachmentRecord> {
    const attachment = await attachmentRepository.findReadyAttachmentByIdInOrganization(input);
    if (attachment === null) throw new AppError({ statusCode: 404, message: "Attachment not found.", code: "ATTACHMENT_NOT_FOUND" });
    return attachment;
  }

  private async ensureTaskExists(input: { taskId: string; organizationId: string }): Promise<void> {
    const task = await attachmentRepository.findTaskInOrganization(input);
    if (task === null) throw new AppError({ statusCode: 404, message: "Task not found.", code: "ATTACHMENT_TASK_NOT_FOUND" });
  }

  private async ensureUploaderExists(input: { userId: string; organizationId: string }): Promise<void> {
    const user = await attachmentRepository.findUploaderInOrganization(input);
    if (user === null) throw new AppError({ statusCode: 404, message: "User not found.", code: "ATTACHMENT_UPLOADER_NOT_FOUND" });
  }
}

export const attachmentService = new AttachmentService();
