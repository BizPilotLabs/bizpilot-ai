import type { Response } from "express";

import { attachmentIdParamsSchema, initializeAttachmentUploadSchema, listAttachmentsQuerySchema, taskAttachmentParamsSchema } from "./attachment.schema.js";
import { attachmentService } from "./attachment.service.js";
import type { AttachmentRequest, RequestMetadata } from "./attachment.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: AttachmentRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent")
});

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = { success: true, data };
  response.status(statusCode).json(body);
};

export class AttachmentController {
  public async listAttachments(request: AttachmentRequest, response: Response): Promise<void> {
    const params = taskAttachmentParamsSchema.parse(request.params);
    const query = listAttachmentsQuerySchema.parse(request.query);
    const result = await attachmentService.listAttachments({ organizationId: request.auth.organizationId, taskId: params.taskId, query });
    sendSuccess(response, 200, result);
  }

  public async initializeUpload(request: AttachmentRequest, response: Response): Promise<void> {
    const params = taskAttachmentParamsSchema.parse(request.params);
    const input = initializeAttachmentUploadSchema.parse(request.body);
    const upload = await attachmentService.initializeUpload({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      taskId: params.taskId,
      data: input
    });
    sendSuccess(response, 201, { upload });
  }

  public async finalizeUpload(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    const attachment = await attachmentService.finalizeUpload({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      attachmentId: params.id,
      metadata: toMetadata(request)
    });
    sendSuccess(response, 200, { attachment });
  }

  public async getAttachment(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    const attachment = await attachmentService.getAttachment({ organizationId: request.auth.organizationId, attachmentId: params.id });
    sendSuccess(response, 200, { attachment });
  }

  public async authorizeDownload(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    const download = await attachmentService.authorizeDownload({ organizationId: request.auth.organizationId, attachmentId: params.id });
    sendSuccess(response, 200, download);
  }

  public async requestExtraction(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    const extraction = await attachmentService.requestExtraction({ organizationId: request.auth.organizationId, actorUserId: request.auth.userId, attachmentId: params.id, metadata: toMetadata(request) });
    sendSuccess(response, 202, { extraction });
  }

  public async getExtractionStatus(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    const extraction = await attachmentService.getExtractionStatus({ organizationId: request.auth.organizationId, attachmentId: params.id });
    sendSuccess(response, 200, { extraction });
  }

  public async retryExtraction(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    const extraction = await attachmentService.retryExtraction({ organizationId: request.auth.organizationId, actorUserId: request.auth.userId, attachmentId: params.id, metadata: toMetadata(request) });
    sendSuccess(response, 202, { extraction });
  }

  public async getExtractedText(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    const extraction = await attachmentService.getExtractedText({ organizationId: request.auth.organizationId, attachmentId: params.id });
    sendSuccess(response, 200, { extraction });
  }

  public async deleteAttachment(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    await attachmentService.deleteAttachment({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      attachmentId: params.id,
      metadata: toMetadata(request)
    });
    sendSuccess(response, 200, { deleted: true });
  }
}

export const attachmentController = new AttachmentController();
