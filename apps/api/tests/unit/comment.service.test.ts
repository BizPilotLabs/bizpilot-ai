import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppError } from "../../src/core/errors/index.js";
import type { CommentRecord } from "../../src/modules/comments/comment.types.js";
import { ids } from "../helpers/fixtures.js";

const commentRepositoryMock = vi.hoisted(() => ({
  findTaskInOrganization: vi.fn(),
  findRequester: vi.fn(),
  findComments: vi.fn(),
  findCommentByIdInOrganization: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  softDeleteComment: vi.fn()
}));

vi.mock("../../src/modules/comments/comment.repository.js", () => ({ commentRepository: commentRepositoryMock }));

const { commentService } = await import("../../src/modules/comments/comment.service.js");

const now = new Date("2026-01-01T00:00:00.000Z");
const taskId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const commentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";

const commentRecord = (overrides: Partial<CommentRecord> = {}): CommentRecord => ({
  id: commentId,
  taskId,
  organizationId: ids.organizationA,
  authorId: ids.memberUser,
  content: "Looks good for launch.",
  edited: false,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  author: {
    id: ids.memberUser,
    email: "member@example.com",
    firstName: "Maya",
    lastName: "Member",
    avatar: null,
    deletedAt: null
  },
  ...overrides
});

describe("CommentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    commentRepositoryMock.findTaskInOrganization.mockResolvedValue({ id: taskId });
    commentRepositoryMock.findComments.mockResolvedValue({ comments: [commentRecord()], total: 1 });
    commentRepositoryMock.findCommentByIdInOrganization.mockResolvedValue(commentRecord());
    commentRepositoryMock.createComment.mockImplementation((input) => Promise.resolve(commentRecord({ content: input.data.content, authorId: input.authorId })));
    commentRepositoryMock.updateComment.mockImplementation((input) => Promise.resolve(commentRecord({ content: input.data.content, edited: true })));
    commentRepositoryMock.softDeleteComment.mockResolvedValue(undefined);
    commentRepositoryMock.findRequester.mockResolvedValue({ id: ids.adminUser, roles: [{ role: { name: "Admin", deletedAt: null } }] });
  });

  it("lists task comments with safe author summaries", async () => {
    const result = await commentService.listComments({ organizationId: ids.organizationA, taskId, query: { page: 1, limit: 20, sort: "asc" } });

    expect(result.comments[0]?.author.email).toBe("member@example.com");
    expect(result.comments[0]?.author.isDeleted).toBe(false);
    expect(result.comments[0]?.content).toBe("Looks good for launch.");
  });

  it("rejects listing comments for tasks outside the organization", async () => {
    commentRepositoryMock.findTaskInOrganization.mockResolvedValue(null);

    await expect(commentService.listComments({ organizationId: ids.organizationA, taskId, query: { page: 1, limit: 20, sort: "asc" } })).rejects.toMatchObject<AppError>({ code: "COMMENT_TASK_NOT_FOUND" });
  });

  it("derives the comment author from the authenticated actor", async () => {
    const result = await commentService.createComment({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      taskId,
      data: { content: "Please review this." },
      metadata: { ipAddress: undefined, userAgent: undefined }
    });

    expect(result.authorId).toBe(ids.ownerUser);
    expect(commentRepositoryMock.createComment).toHaveBeenCalledWith(expect.objectContaining({ authorId: ids.ownerUser, organizationId: ids.organizationA, taskId }));
  });

  it("allows a comment author to update their own comment", async () => {
    const result = await commentService.updateComment({
      organizationId: ids.organizationA,
      actorUserId: ids.memberUser,
      commentId,
      data: { content: "Updated note." },
      metadata: { ipAddress: undefined, userAgent: undefined }
    });

    expect(result.edited).toBe(true);
    expect(commentRepositoryMock.findRequester).not.toHaveBeenCalled();
  });

  it("allows Owner or Admin to delete another user's comment", async () => {
    await commentService.deleteComment({
      organizationId: ids.organizationA,
      actorUserId: ids.adminUser,
      commentId,
      metadata: { ipAddress: undefined, userAgent: undefined }
    });

    expect(commentRepositoryMock.softDeleteComment).toHaveBeenCalledWith(expect.objectContaining({ actorUserId: ids.adminUser, commentId }));
  });

  it("rejects non-author updates without Owner or Admin moderation", async () => {
    commentRepositoryMock.findRequester.mockResolvedValue({ id: ids.targetUser, roles: [{ role: { name: "Member", deletedAt: null } }] });

    await expect(commentService.updateComment({
      organizationId: ids.organizationA,
      actorUserId: ids.targetUser,
      commentId,
      data: { content: "Unsafe edit." },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "COMMENT_PERMISSION_DENIED" });
  });
});