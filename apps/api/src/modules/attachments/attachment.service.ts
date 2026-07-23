import { AppError } from "../../core/errors/index.js";
import { attachmentRepository } from "./attachment.repository.js";
import type {
  AttachmentCreateInput,
  AttachmentListQuery,
  AttachmentListResult,
  AttachmentRecord,
  AttachmentResponse,
  RequestMetadata,
} from "./attachment.types.js";

const toAttachmentResponse = (attachment: AttachmentRecord): AttachmentResponse => ({
  id: attachment.id,
  organizationId: attachment.organizationId,
  taskId: attachment.taskId,
  uploadedBy: attachment.uploadedBy,
  originalName: attachment.originalName,
  storedName: attachment.storedName,
  mimeType: attachment.mimeType,
  fileSize: attachment.fileSize,
  storagePath: attachment.storagePath,
  createdAt: attachment.createdAt,
});

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
        totalPages,
      },
    };
  }

  public async createAttachment(input: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    data: AttachmentCreateInput;
    metadata: RequestMetadata;
  }): Promise<AttachmentResponse> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });

    const attachment = await attachmentRepository.createAttachment({
      taskId: input.taskId,
      organizationId: input.organizationId,
      uploadedBy: input.actorUserId,
      data: input.data,
      metadata: input.metadata,
    });
    return toAttachmentResponse(attachment);
  }

  public async getAttachment(input: { organizationId: string; attachmentId: string }): Promise<AttachmentResponse> {
    const attachment = await attachmentRepository.findAttachmentByIdInOrganization(input);

    if (attachment === null) {
      throw new AppError({ statusCode: 404, message: "Attachment not found.", code: "ATTACHMENT_NOT_FOUND" });
    }

    return toAttachmentResponse(attachment);
  }

  public async deleteAttachment(input: {
    organizationId: string;
    actorUserId: string;
    attachmentId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    const attachment = await attachmentRepository.findAttachmentByIdInOrganization({ attachmentId: input.attachmentId, organizationId: input.organizationId });

    if (attachment === null) {
      throw new AppError({ statusCode: 404, message: "Attachment not found.", code: "ATTACHMENT_NOT_FOUND" });
    }

    await attachmentRepository.softDeleteAttachment(input);
  }

  private async ensureTaskExists(input: { taskId: string; organizationId: string }): Promise<void> {
    const task = await attachmentRepository.findTaskInOrganization(input);

    if (task === null) {
      throw new AppError({ statusCode: 404, message: "Task not found.", code: "ATTACHMENT_TASK_NOT_FOUND" });
    }
  }
}

export const attachmentService = new AttachmentService();