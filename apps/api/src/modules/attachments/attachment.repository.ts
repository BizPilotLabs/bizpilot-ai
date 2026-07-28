import type { Attachment, Prisma } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { AttachmentListQuery, AttachmentUploadIntentInput, RequestMetadata } from "./attachment.types.js";

export class AttachmentRepository {
  public async findTaskInOrganization(input: { taskId: string; organizationId: string }): Promise<{ id: string } | null> {
    return prisma.task.findFirst({
      where: { id: input.taskId, deletedAt: null, project: { organizationId: input.organizationId, deletedAt: null } },
      select: { id: true }
    });
  }

  public async findUploaderInOrganization(input: { userId: string; organizationId: string }): Promise<{ id: string } | null> {
    return prisma.user.findFirst({
      where: { id: input.userId, organizationId: input.organizationId, deletedAt: null },
      select: { id: true }
    });
  }

  public async findAttachments(input: { taskId: string; organizationId: string; query: AttachmentListQuery }): Promise<{ attachments: Attachment[]; total: number }> {
    const where: Prisma.AttachmentWhereInput = { taskId: input.taskId, organizationId: input.organizationId, deletedAt: null, status: "READY" };

    const [attachments, total] = await Promise.all([
      prisma.attachment.findMany({ where, orderBy: [{ createdAt: input.query.sort }, { id: input.query.sort }], skip: (input.query.page - 1) * input.query.limit, take: input.query.limit }),
      prisma.attachment.count({ where })
    ]);

    return { attachments, total };
  }

  public async findReadyAttachmentByIdInOrganization(input: { attachmentId: string; organizationId: string }): Promise<Attachment | null> {
    return prisma.attachment.findFirst({ where: { id: input.attachmentId, organizationId: input.organizationId, deletedAt: null, status: "READY" } });
  }

  public async findAttachmentByIdInOrganization(input: { attachmentId: string; organizationId: string }): Promise<Attachment | null> {
    return prisma.attachment.findFirst({ where: { id: input.attachmentId, organizationId: input.organizationId, deletedAt: null } });
  }

  public async createPendingAttachment(input: {
    id: string;
    taskId: string;
    organizationId: string;
    uploadedBy: string;
    data: AttachmentUploadIntentInput;
    provider: string;
    storagePath: string;
    storedName: string;
    uploadExpiresAt: Date;
  }): Promise<Attachment> {
    return prisma.attachment.create({
      data: {
        id: input.id,
        organizationId: input.organizationId,
        taskId: input.taskId,
        uploadedBy: input.uploadedBy,
        originalName: input.data.originalName,
        storedName: input.storedName,
        mimeType: input.data.mimeType,
        fileSize: input.data.fileSize,
        storagePath: input.storagePath,
        provider: input.provider,
        status: "PENDING",
        uploadExpiresAt: input.uploadExpiresAt
      }
    });
  }

  public async finalizeAttachment(input: { attachment: Attachment; actorUserId: string; metadata: RequestMetadata }): Promise<Attachment> {
    return prisma.$transaction(async (transaction) => {
      const finalized = await transaction.attachment.update({
        where: { id: input.attachment.id },
        data: {
          status: "READY",
          finalizedAt: new Date(),
          uploadExpiresAt: null
        }
      });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: finalized.organizationId, action: "attachment.upload", metadata: input.metadata, auditMetadata: { attachmentId: finalized.id, taskId: finalized.taskId, originalName: finalized.originalName, mimeType: finalized.mimeType, fileSize: finalized.fileSize } }) });
      return finalized;
    });
  }

  public async softDeleteAttachment(input: { attachment: Attachment; actorUserId: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const attachment = await transaction.attachment.update({ where: { id: input.attachment.id }, data: { deletedAt: new Date() } });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: attachment.organizationId, action: "attachment.delete", metadata: input.metadata, auditMetadata: { attachmentId: attachment.id, taskId: attachment.taskId, originalName: attachment.originalName, mimeType: attachment.mimeType, fileSize: attachment.fileSize } }) });
    });
  }

  public async deleteExpiredPendingAttachments(input: { now: Date }): Promise<Attachment[]> {
    const expired = await prisma.attachment.findMany({
      where: { status: "PENDING", deletedAt: null, uploadExpiresAt: { lt: input.now } }
    });

    if (expired.length === 0) {
      return [];
    }

    await prisma.attachment.updateMany({
      where: { id: { in: expired.map((attachment) => attachment.id) } },
      data: { deletedAt: input.now }
    });

    return expired;
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
      metadata: input.auditMetadata
    };
  }
}

export const attachmentRepository = new AttachmentRepository();
