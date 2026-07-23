import type { Response } from "express";

import { attachmentIdParamsSchema, createAttachmentSchema, listAttachmentsQuerySchema, taskAttachmentParamsSchema } from "./attachment.schema.js";
import { attachmentService } from "./attachment.service.js";
import type { AttachmentRequest, RequestMetadata } from "./attachment.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: AttachmentRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
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

  public async createAttachment(request: AttachmentRequest, response: Response): Promise<void> {
    const params = taskAttachmentParamsSchema.parse(request.params);
    const input = createAttachmentSchema.parse(request.body);
    const attachment = await attachmentService.createAttachment({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      taskId: params.taskId,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 201, { attachment });
  }

  public async getAttachment(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    const attachment = await attachmentService.getAttachment({ organizationId: request.auth.organizationId, attachmentId: params.id });
    sendSuccess(response, 200, { attachment });
  }

  public async deleteAttachment(request: AttachmentRequest, response: Response): Promise<void> {
    const params = attachmentIdParamsSchema.parse(request.params);
    await attachmentService.deleteAttachment({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      attachmentId: params.id,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { deleted: true });
  }
}

export const attachmentController = new AttachmentController();