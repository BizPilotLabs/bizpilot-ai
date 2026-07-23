import type { Comment, Prisma } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { CommentCreateInput, CommentListQuery, CommentUpdateInput, RequestMetadata, RequesterRecord } from "./comment.types.js";

export class CommentRepository {
  public async findTaskInOrganization(input: { taskId: string; organizationId: string }): Promise<{ id: string } | null> {
    return prisma.task.findFirst({
      where: { id: input.taskId, deletedAt: null, project: { organizationId: input.organizationId, deletedAt: null } },
      select: { id: true },
    });
  }

  public async findRequester(input: { userId: string; organizationId: string }): Promise<RequesterRecord | null> {
    return prisma.user.findFirst({
      where: { id: input.userId, organizationId: input.organizationId, deletedAt: null },
      select: { id: true, roles: { select: { role: { select: { name: true, deletedAt: true } } } } },
    });
  }

  public async findComments(input: { taskId: string; organizationId: string; query: CommentListQuery }): Promise<{ comments: Comment[]; total: number }> {
    const where: Prisma.CommentWhereInput = { taskId: input.taskId, organizationId: input.organizationId, deletedAt: null };

    const [comments, total] = await Promise.all([
      prisma.comment.findMany({ where, orderBy: { createdAt: input.query.sort }, skip: (input.query.page - 1) * input.query.limit, take: input.query.limit }),
      prisma.comment.count({ where }),
    ]);

    return { comments, total };
  }

  public async findCommentByIdInOrganization(input: { commentId: string; organizationId: string }): Promise<Comment | null> {
    return prisma.comment.findFirst({ where: { id: input.commentId, organizationId: input.organizationId, deletedAt: null } });
  }

  public async createComment(input: {
    taskId: string;
    organizationId: string;
    authorId: string;
    data: CommentCreateInput;
    metadata: RequestMetadata;
  }): Promise<Comment> {
    return prisma.$transaction(async (transaction) => {
      const comment = await transaction.comment.create({
        data: {
          taskId: input.taskId,
          organizationId: input.organizationId,
          authorId: input.authorId,
          content: input.data.content,
        },
      });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.authorId, organizationId: input.organizationId, action: "comment.create", metadata: input.metadata, auditMetadata: { commentId: comment.id, taskId: input.taskId } }) });
      return comment;
    });
  }

  public async updateComment(input: {
    commentId: string;
    actorUserId: string;
    organizationId: string;
    data: CommentUpdateInput;
    metadata: RequestMetadata;
  }): Promise<Comment> {
    return prisma.$transaction(async (transaction) => {
      const comment = await transaction.comment.update({ where: { id: input.commentId }, data: { content: input.data.content, edited: true } });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "comment.update", metadata: input.metadata, auditMetadata: { commentId: comment.id, taskId: comment.taskId } }) });
      return comment;
    });
  }

  public async softDeleteComment(input: { commentId: string; actorUserId: string; organizationId: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const comment = await transaction.comment.update({ where: { id: input.commentId }, data: { deletedAt: new Date() } });
      await transaction.auditLog.create({ data: this.createAuditLogData({ actorUserId: input.actorUserId, organizationId: input.organizationId, action: "comment.delete", metadata: input.metadata, auditMetadata: { commentId: comment.id, taskId: comment.taskId } }) });
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
      resource: "comment",
      ipAddress: input.metadata.ipAddress ?? null,
      userAgent: input.metadata.userAgent ?? null,
      metadata: input.auditMetadata,
    };
  }
}

export const commentRepository = new CommentRepository();