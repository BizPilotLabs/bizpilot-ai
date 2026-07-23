import { AppError } from "../../core/errors/index.js";
import { commentRepository } from "./comment.repository.js";
import type {
  CommentCreateInput,
  CommentListQuery,
  CommentListResult,
  CommentRecord,
  CommentResponse,
  CommentUpdateInput,
  RequestMetadata,
  RequesterRecord,
} from "./comment.types.js";

const toCommentResponse = (comment: CommentRecord): CommentResponse => ({
  id: comment.id,
  taskId: comment.taskId,
  organizationId: comment.organizationId,
  authorId: comment.authorId,
  content: comment.content,
  edited: comment.edited,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
});

const isOwnerOrAdmin = (user: RequesterRecord): boolean => {
  return user.roles.some(({ role }) => role.deletedAt === null && (role.name === "Owner" || role.name === "Admin"));
};

export class CommentService {
  public async listComments(input: { organizationId: string; taskId: string; query: CommentListQuery }): Promise<CommentListResult> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });

    const result = await commentRepository.findComments(input);
    const totalPages = Math.max(1, Math.ceil(result.total / input.query.limit));

    return {
      comments: result.comments.map(toCommentResponse),
      pagination: {
        page: input.query.page,
        limit: input.query.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  public async createComment(input: {
    organizationId: string;
    actorUserId: string;
    taskId: string;
    data: CommentCreateInput;
    metadata: RequestMetadata;
  }): Promise<CommentResponse> {
    await this.ensureTaskExists({ taskId: input.taskId, organizationId: input.organizationId });

    const comment = await commentRepository.createComment({
      taskId: input.taskId,
      organizationId: input.organizationId,
      authorId: input.actorUserId,
      data: input.data,
      metadata: input.metadata,
    });
    return toCommentResponse(comment);
  }

  public async updateComment(input: {
    organizationId: string;
    actorUserId: string;
    commentId: string;
    data: CommentUpdateInput;
    metadata: RequestMetadata;
  }): Promise<CommentResponse> {
    const comment = await this.getCommentForMutation({ commentId: input.commentId, organizationId: input.organizationId });
    await this.ensureCanMutateComment({ actorUserId: input.actorUserId, organizationId: input.organizationId, comment });

    const updatedComment = await commentRepository.updateComment(input);
    return toCommentResponse(updatedComment);
  }

  public async deleteComment(input: {
    organizationId: string;
    actorUserId: string;
    commentId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    const comment = await this.getCommentForMutation({ commentId: input.commentId, organizationId: input.organizationId });
    await this.ensureCanMutateComment({ actorUserId: input.actorUserId, organizationId: input.organizationId, comment });
    await commentRepository.softDeleteComment(input);
  }

  private async ensureTaskExists(input: { taskId: string; organizationId: string }): Promise<void> {
    const task = await commentRepository.findTaskInOrganization(input);

    if (task === null) {
      throw new AppError({ statusCode: 404, message: "Task not found.", code: "COMMENT_TASK_NOT_FOUND" });
    }
  }

  private async getCommentForMutation(input: { commentId: string; organizationId: string }): Promise<CommentRecord> {
    const comment = await commentRepository.findCommentByIdInOrganization(input);

    if (comment === null) {
      throw new AppError({ statusCode: 404, message: "Comment not found.", code: "COMMENT_NOT_FOUND" });
    }

    return comment;
  }

  private async ensureCanMutateComment(input: { actorUserId: string; organizationId: string; comment: CommentRecord }): Promise<void> {
    if (input.comment.authorId === input.actorUserId) {
      return;
    }

    const requester = await commentRepository.findRequester({ userId: input.actorUserId, organizationId: input.organizationId });

    if (requester === null || !isOwnerOrAdmin(requester)) {
      throw new AppError({ statusCode: 403, message: "You do not have permission to modify this comment.", code: "COMMENT_PERMISSION_DENIED" });
    }
  }
}

export const commentService = new CommentService();