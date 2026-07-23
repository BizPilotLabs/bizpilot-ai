import type { Response } from "express";

import { commentIdParamsSchema, createCommentSchema, listCommentsQuerySchema, taskCommentParamsSchema, updateCommentSchema } from "./comment.schema.js";
import { commentService } from "./comment.service.js";
import type { CommentRequest, RequestMetadata } from "./comment.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: CommentRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = { success: true, data };
  response.status(statusCode).json(body);
};

export class CommentController {
  public async listComments(request: CommentRequest, response: Response): Promise<void> {
    const params = taskCommentParamsSchema.parse(request.params);
    const query = listCommentsQuerySchema.parse(request.query);
    const result = await commentService.listComments({ organizationId: request.auth.organizationId, taskId: params.taskId, query });
    sendSuccess(response, 200, result);
  }

  public async createComment(request: CommentRequest, response: Response): Promise<void> {
    const params = taskCommentParamsSchema.parse(request.params);
    const input = createCommentSchema.parse(request.body);
    const comment = await commentService.createComment({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      taskId: params.taskId,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 201, { comment });
  }

  public async updateComment(request: CommentRequest, response: Response): Promise<void> {
    const params = commentIdParamsSchema.parse(request.params);
    const input = updateCommentSchema.parse(request.body);
    const comment = await commentService.updateComment({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      commentId: params.id,
      data: input,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { comment });
  }

  public async deleteComment(request: CommentRequest, response: Response): Promise<void> {
    const params = commentIdParamsSchema.parse(request.params);
    await commentService.deleteComment({
      organizationId: request.auth.organizationId,
      actorUserId: request.auth.userId,
      commentId: params.id,
      metadata: toMetadata(request),
    });
    sendSuccess(response, 200, { deleted: true });
  }
}

export const commentController = new CommentController();