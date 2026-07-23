import type { Attachment, Prisma } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { AttachmentCreateInput, AttachmentListQuery, RequestMetadata } from "./attachment.types.js";

export class AttachmentRepository {
  public async findTaskInOrganization(input: { taskId: string; organizationId: string }): Promise<{ id: string } | null> {
    return prisma.task.findFirst({
      where: { id: input.taskId, deletedAt: null, project: { organizationId: input.organizationId, deletedAt: null } },
      select: { id: true },
    });
  }

  public async findAttachments(input: { taskId: string; organizationId: string; query: AttachmentListQuery }): Promise<{ attachments: Attachment[]; total: number }> {
    const where: Prisma.AttachmentWhereInput = { taskId: input.taskId, organizationId: input.organizationId, deletedAt: null };

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({ where, orderBy: { createdAt: input.query.sort }, skip: (input.query.page - 1) * input.query.limit, take: input.query.limit }),
      prisma.attachment.count({ where }),
    ]);

    return { attachments, total };
  }

  public async findAttachmentByIdInOrganization(input: { attachmentId: string; organizationId: string }): Promise<Attachment | null> {
    return prisma.attachment.findFirst({ where: { id: input.attachmentId, organizationId: input.organizationId, deletedAt: null } });
  }

  public async createAttachment(input: {
    taskId: string;
    organizationId: string;
    uploadedBy: string;
    data: AttachmentCreateInput;
    metadata: RequestMetadata;
  }): Promise<Attachment> {
    return prisma.$transaction(async (transaction) => {
      const attachment = await transaction.attachment.create({
        data: {
          organizationId: input.organizationId,
          taskId: input.taskId,
          uploadedBy: input.uploadedBy,
          originalName: input.data.originalName,
          storedName: input.data.storedName,
          mimeType: input.data.mimeType,
          fileSize: input.data.fileSize,
          storagePath: input.data.storagePath,
        },
      });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.uploadedBy, organizationId: input.organizationId, action: "attachment.upload", metadata: input.metadata, auditMetadata: { attachmentId: attachment.id, taskId: input.taskId, originalName: attachment.originalName, mimeType: attachment.mimeType, fileSize: attachment.fileSize } }) });
      return attachment;
    });
  }

  public async softDeleteAttachment(input: { attachmentId: string; actorUserId: string; organizationId: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const attachment = await transaction.attachment.update({ where: { id: input.attachmentId }, data: { deletedAt: new Date() } });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "attachment.delete", metadata: input.metadata, auditMetadata: { attachmentId: attachment.id, taskId: attachment.taskId, originalName: attachment.originalName } }) });
    });
  }

  private createAuditLogData(input: {
    actorUserId: string;
    organizationId: string;
    action: string;
    metadata: RequestMetadata;
    auditMetadata: Prisma.InputJsonValue;
  }): Prisma.AuditLogUncheckedCreateInput {
    return {
      userId: input.actorUserId,
      organizationId: input.organizationId,
      action: input.action,
      resource: "attachment",
      ipAddress: input.metadata.ipAddress ?? null,
      userAgent: input.metadata.userAgent ?? null,
      metadata: input.auditMetadata,
    };
  }
}

export const attachmentRepository = new AttachmentRepository();