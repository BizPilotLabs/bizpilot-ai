import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ids, rbacUser } from "../helpers/fixtures.js";

const authServiceMock = vi.hoisted(() => ({
  verifyAccessToken: vi.fn()
}));

const rbacRepositoryMock = vi.hoisted(() => ({
  findUserByIdInOrganization: vi.fn()
}));

const commentRepositoryMock = vi.hoisted(() => ({
  findTaskInOrganization: vi.fn(),
  findRequester: vi.fn(),
  findComments: vi.fn(),
  findCommentByIdInOrganization: vi.fn(),
  createComment: vi.fn(),
  updateComment: vi.fn(),
  softDeleteComment: vi.fn()
}));

vi.mock("../../src/modules/auth/auth.service.js", () => ({ authService: authServiceMock }));
vi.mock("../../src/modules/rbac/rbac.repository.js", () => ({ rbacRepository: rbacRepositoryMock }));
vi.mock("../../src/modules/comments/comment.repository.js", () => ({ commentRepository: commentRepositoryMock }));

const { createApp } = await import("../../src/app.js");

const taskId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const commentId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const now = new Date("2026-01-01T00:00:00.000Z");

const requester = {
  id: ids.ownerUser,
  roles: [{ role: { name: "Owner", deletedAt: null } }]
};

const comment = {
  id: commentId,
  taskId,
  organizationId: ids.organizationA,
  authorId: ids.ownerUser,
  content: "Initial comment",
  edited: false,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  author: {
    id: ids.ownerUser,
    email: "owner@example.com",
    firstName: "Olivia",
    lastName: "Owner",
    avatar: null,
    deletedAt: null
  }
};

describe("Comment routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMock.verifyAccessToken.mockReturnValue({ userId: ids.ownerUser, organizationId: ids.organizationA, sessionId: "session-id", tokenVersion: 1 });
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser());
    commentRepositoryMock.findTaskInOrganization.mockResolvedValue({ id: taskId });
    commentRepositoryMock.findRequester.mockResolvedValue(requester);
    commentRepositoryMock.findComments.mockResolvedValue({ comments: [comment], total: 1 });
    commentRepositoryMock.findCommentByIdInOrganization.mockResolvedValue(comment);
    commentRepositoryMock.createComment.mockResolvedValue({ ...comment, content: "Created comment" });
    commentRepositoryMock.updateComment.mockResolvedValue({ ...comment, content: "Updated comment", edited: true });
    commentRepositoryMock.softDeleteComment.mockResolvedValue(undefined);
  });

  it("requires authentication for comment listing", async () => {
    const response = await request(createApp()).get(`/tasks/${taskId}/comments`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: "AUTH_TOKEN_REQUIRED" } });
  });

  it("requires comments.read for listing", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).get(`/tasks/${taskId}/comments`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ success: false, error: { code: "RBAC_PERMISSION_DENIED" } });
    expect(commentRepositoryMock.findComments).not.toHaveBeenCalled();
  });

  it("lists comments through the real route stack with authenticated organization context", async () => {
    const response = await request(createApp())
      .get(`/tasks/${taskId}/comments`)
      .query({ page: 2, limit: 10, sort: "desc" })
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(authServiceMock.verifyAccessToken).toHaveBeenCalledWith("valid-token");
    expect(commentRepositoryMock.findTaskInOrganization).toHaveBeenCalledWith({ taskId, organizationId: ids.organizationA });
    expect(commentRepositoryMock.findComments).toHaveBeenCalledWith({ taskId, organizationId: ids.organizationA, query: { page: 2, limit: 10, sort: "desc" } });
    expect(response.body.data.comments[0]).toMatchObject({ id: commentId, author: { email: "owner@example.com", isDeleted: false } });
  });

  it("creates comments with authenticated user context and compact request metadata", async () => {
    const response = await request(createApp())
      .post(`/tasks/${taskId}/comments`)
      .set("Authorization", "Bearer valid-token")
      .set("User-Agent", "comment-test-agent")
      .send({ content: " Created comment " });

    expect(response.status).toBe(201);
    expect(commentRepositoryMock.createComment).toHaveBeenCalledWith({
      taskId,
      organizationId: ids.organizationA,
      authorId: ids.ownerUser,
      data: { content: "Created comment" },
      metadata: expect.objectContaining({ userAgent: "comment-test-agent" })
    });
    expect(response.body.data.comment).toMatchObject({ content: "Created comment" });
  });

  it("requires comments.create before creating", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).post(`/tasks/${taskId}/comments`).set("Authorization", "Bearer valid-token").send({ content: "Created comment" });

    expect(response.status).toBe(403);
    expect(commentRepositoryMock.createComment).not.toHaveBeenCalled();
  });

  it("rejects invalid task ids before comment lookup", async () => {
    const response = await request(createApp()).get("/tasks/not-a-uuid/comments").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(400);
    expect(response.body).toMatchObject({ success: false, error: { code: "VALIDATION_ERROR" } });
    expect(commentRepositoryMock.findTaskInOrganization).not.toHaveBeenCalled();
  });

  it("rejects invalid, empty and excessive comment bodies", async () => {
    const invalidShape = await request(createApp()).post(`/tasks/${taskId}/comments`).set("Authorization", "Bearer valid-token").send({ body: "missing content" });
    const emptyContent = await request(createApp()).post(`/tasks/${taskId}/comments`).set("Authorization", "Bearer valid-token").send({ content: "   " });
    const excessiveContent = await request(createApp()).post(`/tasks/${taskId}/comments`).set("Authorization", "Bearer valid-token").send({ content: "x".repeat(5001) });

    expect(invalidShape.status).toBe(400);
    expect(emptyContent.status).toBe(400);
    expect(excessiveContent.status).toBe(400);
    expect(commentRepositoryMock.createComment).not.toHaveBeenCalled();
  });

  it("returns a safe not-found response when the task is outside the organization", async () => {
    commentRepositoryMock.findTaskInOrganization.mockResolvedValue(null);

    const response = await request(createApp()).post(`/tasks/${taskId}/comments`).set("Authorization", "Bearer valid-token").send({ content: "Created comment" });

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, error: { code: "COMMENT_TASK_NOT_FOUND" } });
  });

  it("updates comments with authenticated organization and user context", async () => {
    commentRepositoryMock.findCommentByIdInOrganization.mockResolvedValue({ ...comment, authorId: ids.memberUser });

    const response = await request(createApp())
      .patch(`/comments/${commentId}`)
      .set("Authorization", "Bearer valid-token")
      .send({ content: " Updated comment " });

    expect(response.status).toBe(200);
    expect(commentRepositoryMock.findCommentByIdInOrganization).toHaveBeenCalledWith({ commentId, organizationId: ids.organizationA });
    expect(commentRepositoryMock.findRequester).toHaveBeenCalledWith({ userId: ids.ownerUser, organizationId: ids.organizationA });
    expect(commentRepositoryMock.updateComment).toHaveBeenCalledWith(expect.objectContaining({ commentId, actorUserId: ids.ownerUser, organizationId: ids.organizationA, data: { content: "Updated comment" } }));
    expect(response.body.data.comment).toMatchObject({ content: "Updated comment", edited: true });
  });

  it("requires comments.update before updating", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).patch(`/comments/${commentId}`).set("Authorization", "Bearer valid-token").send({ content: "Updated comment" });

    expect(response.status).toBe(403);
    expect(commentRepositoryMock.updateComment).not.toHaveBeenCalled();
  });

  it("deletes comments with authenticated organization and user context", async () => {
    commentRepositoryMock.findCommentByIdInOrganization.mockResolvedValue({ ...comment, authorId: ids.memberUser });

    const response = await request(createApp()).delete(`/comments/${commentId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(commentRepositoryMock.findCommentByIdInOrganization).toHaveBeenCalledWith({ commentId, organizationId: ids.organizationA });
    expect(commentRepositoryMock.findRequester).toHaveBeenCalledWith({ userId: ids.ownerUser, organizationId: ids.organizationA });
    expect(commentRepositoryMock.softDeleteComment).toHaveBeenCalledWith(expect.objectContaining({ commentId, actorUserId: ids.ownerUser, organizationId: ids.organizationA }));
    expect(response.body).toEqual({ success: true, data: { deleted: true } });
  });

  it("requires comments.delete before deleting", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    commentRepositoryMock.findCommentByIdInOrganization.mockResolvedValue({ ...comment, authorId: ids.memberUser });

    const response = await request(createApp()).delete(`/comments/${commentId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(commentRepositoryMock.softDeleteComment).not.toHaveBeenCalled();
  });
});


