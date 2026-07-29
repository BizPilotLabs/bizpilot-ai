import type { Attachment, AttachmentExtractionStatus, Prisma } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { AttachmentListQuery, AttachmentUploadIntentInput, RequestMetadata } from "./attachment.types.js";
import type { ExtractionFailureCode, TextExtractionResult } from "./extraction/index.js";

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
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: finalized.organizationId, action: "attachment.upload", metadata: input.metadata, auditMetadata: { attachmentId: finalized.id, taskId: finalized.taskId, mimeType: finalized.mimeType, fileSize: finalized.fileSize } }) });
      return finalized;
    });
  }

  public async requestExtraction(input: { attachment: Attachment; actorUserId: string; metadata: RequestMetadata }): Promise<Attachment> {
    return prisma.$transaction(async (transaction) => {
      if (input.attachment.extractionStatus !== "NOT_REQUESTED") {
        return input.attachment;
      }

      const updated = await transaction.attachment.update({
        where: { id: input.attachment.id },
        data: {
          extractionStatus: "PENDING",
          extractionRequestedAt: new Date(),
          extractionErrorCode: null
        }
      });

      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: updated.organizationId, action: "attachment.extraction.requested", metadata: input.metadata, auditMetadata: { attachmentId: updated.id, taskId: updated.taskId, mimeCategory: this.mimeCategory(updated.mimeType) } }) });
      return updated;
    });
  }

  public async retryExtraction(input: { attachment: Attachment; actorUserId: string; metadata: RequestMetadata }): Promise<Attachment> {
    return prisma.$transaction(async (transaction) => {
      if (input.attachment.extractionStatus !== "FAILED" && input.attachment.extractionStatus !== "UNSUPPORTED") {
        return input.attachment;
      }

      const updated = await transaction.attachment.update({
        where: { id: input.attachment.id },
        data: {
          extractionStatus: "PENDING",
          extractionRequestedAt: new Date(),
          extractionStartedAt: null,
          extractionCompletedAt: null,
          extractionErrorCode: null,
          extractedText: null,
          extractedCharacterCount: null,
          extractionTruncated: false,
          extractorName: null,
          extractorVersion: null
        }
      });

      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: updated.organizationId, action: "attachment.extraction.retried", metadata: input.metadata, auditMetadata: { attachmentId: updated.id, taskId: updated.taskId, mimeCategory: this.mimeCategory(updated.mimeType) } }) });
      return updated;
    });
  }

  public async markExtractionUnsupported(input: { attachment: Attachment; actorUserId: string; code: ExtractionFailureCode; metadata: RequestMetadata }): Promise<Attachment> {
    return this.markExtractionFailed({ ...input, status: "UNSUPPORTED" });
  }

  public async claimExtractionJob(input: { attachmentId: string }): Promise<Attachment | null> {
    const updated = await prisma.attachment.updateMany({
      where: { id: input.attachmentId, status: "READY", deletedAt: null, extractionStatus: "PENDING" },
      data: { extractionStatus: "PROCESSING", extractionStartedAt: new Date(), extractionCompletedAt: null, extractionErrorCode: null }
    });

    if (updated.count !== 1) {
      return null;
    }

    return prisma.attachment.findUnique({ where: { id: input.attachmentId } });
  }

  public async completeExtraction(input: { attachment: Attachment; result: TextExtractionResult; actorUserId: string; metadata: RequestMetadata; durationMs: number }): Promise<Attachment> {
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.attachment.update({
        where: { id: input.attachment.id },
        data: {
          extractionStatus: "COMPLETED",
          extractedText: input.result.text,
          extractedCharacterCount: input.result.characterCount,
          extractionTruncated: input.result.truncated,
          extractionErrorCode: null,
          extractionCompletedAt: new Date(),
          extractorName: input.result.extractorName,
          extractorVersion: input.result.extractorVersion
        }
      });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: updated.organizationId, action: "attachment.extraction.completed", metadata: input.metadata, auditMetadata: { attachmentId: updated.id, taskId: updated.taskId, mimeCategory: this.mimeCategory(updated.mimeType), extractorName: input.result.extractorName, characterCount: input.result.characterCount, truncated: input.result.truncated, durationBucket: this.durationBucket(input.durationMs) } }) });
      return updated;
    });
  }

  public async failExtraction(input: { attachment: Attachment; code: ExtractionFailureCode; actorUserId: string; metadata: RequestMetadata }): Promise<Attachment> {
    return this.markExtractionFailed({ ...input, status: "FAILED" });
  }

  public async softDeleteAttachment(input: { attachment: Attachment; actorUserId: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const attachment = await transaction.attachment.update({ where: { id: input.attachment.id }, data: { deletedAt: new Date(), extractedText: null } });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: attachment.organizationId, action: "attachment.delete", metadata: input.metadata, auditMetadata: { attachmentId: attachment.id, taskId: attachment.taskId, mimeType: attachment.mimeType, fileSize: attachment.fileSize } }) });
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
      data: { deletedAt: input.now, extractedText: null }
    });

    return expired;
  }

  private async markExtractionFailed(input: { attachment: Attachment; code: ExtractionFailureCode; actorUserId: string; metadata: RequestMetadata; status: Extract<AttachmentExtractionStatus, "FAILED" | "UNSUPPORTED"> }): Promise<Attachment> {
    return prisma.$transaction(async (transaction) => {
      const updated = await transaction.attachment.update({
        where: { id: input.attachment.id },
        data: {
          extractionStatus: input.status,
          extractionErrorCode: input.code,
          extractionCompletedAt: new Date(),
          extractedText: null,
          extractedCharacterCount: null,
          extractionTruncated: false
        }
      });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: updated.organizationId, action: "attachment.extraction.failed", metadata: input.metadata, auditMetadata: { attachmentId: updated.id, taskId: updated.taskId, mimeCategory: this.mimeCategory(updated.mimeType), resultCategory: input.status.toLowerCase(), failureCode: input.code } }) });
      return updated;
    });
  }

  private createAuditLogData(input: { actorUserId: string; organizationId: string; action: string; metadata: RequestMetadata; auditMetadata: Prisma.InputJsonValue }): Prisma.AuditLogUncheckedCreateInput {
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

  private mimeCategory(mimeType: string): string {
    if (mimeType === "text/plain") return "text";
    if (mimeType === "application/pdf") return "pdf";
    if (mimeType.includes("wordprocessingml")) return "docx";
    return "unsupported";
  }

  private durationBucket(durationMs: number): string {
    if (durationMs < 1_000) return "lt_1s";
    if (durationMs < 5_000) return "lt_5s";
    if (durationMs < 15_000) return "lt_15s";
    return "gte_15s";
  }
}

export const attachmentRepository = new AttachmentRepository();
