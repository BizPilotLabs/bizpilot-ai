import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ids, rbacUser } from "../helpers/fixtures.js";

const authServiceMock = vi.hoisted(() => ({ verifyAccessToken: vi.fn() }));
const rbacRepositoryMock = vi.hoisted(() => ({ findUserByIdInOrganization: vi.fn() }));
const taskRepositoryMock = vi.hoisted(() => ({
  findTasks: vi.fn(),
  findProjectInOrganization: vi.fn(),
  findAssigneeInOrganization: vi.fn(),
  findTaskByIdInOrganization: vi.fn(),
  createTask: vi.fn(),
  updateTask: vi.fn(),
  updateTaskStatus: vi.fn(),
  updateTaskAssignee: vi.fn(),
  softDeleteTask: vi.fn()
}));

vi.mock("../../src/modules/auth/auth.service.js", () => ({ authService: authServiceMock }));
vi.mock("../../src/modules/rbac/rbac.repository.js", () => ({ rbacRepository: rbacRepositoryMock }));
vi.mock("../../src/modules/tasks/task.repository.js", () => ({ taskRepository: taskRepositoryMock }));

const { createApp } = await import("../../src/app.js");

const taskId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const projectId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const now = new Date("2026-01-01T00:00:00.000Z");
const userSummary = { id: ids.ownerUser, email: "owner@example.com", firstName: "Olivia", lastName: "Owner", avatar: null, status: "ACTIVE" };
const task = {
  id: taskId,
  projectId,
  title: "Prepare launch checklist",
  description: null,
  status: "TODO",
  priority: "MEDIUM",
  dueDate: null,
  assigneeId: null,
  createdById: ids.ownerUser,
  estimatedHours: null,
  actualHours: null,
  archived: false,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  project: { id: projectId, name: "Customer Launch", status: "ACTIVE", archived: false },
  assignee: null,
  createdBy: userSummary,
  _count: { comments: 2, attachments: 1 }
};

describe("Task destructive routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMock.verifyAccessToken.mockReturnValue({ userId: ids.ownerUser, organizationId: ids.organizationA, sessionId: "session-id", tokenVersion: 1 });
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser());
    taskRepositoryMock.findTaskByIdInOrganization.mockResolvedValue(task);
    taskRepositoryMock.softDeleteTask.mockResolvedValue(undefined);
  });

  it("requires authentication before deletion", async () => {
    const response = await request(createApp()).delete(`/tasks/${taskId}`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: "AUTH_TOKEN_REQUIRED" } });
  });

  it("requires tasks.delete before deletion", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).delete(`/tasks/${taskId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(taskRepositoryMock.softDeleteTask).not.toHaveBeenCalled();
  });

  it("rejects invalid task ids before lookup", async () => {
    const response = await request(createApp()).delete("/tasks/not-a-uuid").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(400);
    expect(taskRepositoryMock.findTaskByIdInOrganization).not.toHaveBeenCalled();
  });

  it("safely reports not found for cross-tenant tasks", async () => {
    taskRepositoryMock.findTaskByIdInOrganization.mockResolvedValue(null);

    const response = await request(createApp()).delete(`/tasks/${taskId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, error: { code: "TASK_NOT_FOUND" } });
    expect(response.body.error.message).not.toContain(projectId);
  });

  it("soft deletes tasks with authenticated organization and user context", async () => {
    const response = await request(createApp()).delete(`/tasks/${taskId}`).set("Authorization", "Bearer valid-token").set("User-Agent", "task-delete-test");

    expect(response.status).toBe(200);
    expect(taskRepositoryMock.findTaskByIdInOrganization).toHaveBeenCalledWith({ taskId, organizationId: ids.organizationA });
    expect(taskRepositoryMock.softDeleteTask).toHaveBeenCalledWith(expect.objectContaining({ taskId, organizationId: ids.organizationA, actorUserId: ids.ownerUser, metadata: expect.objectContaining({ userAgent: "task-delete-test" }) }));
    expect(response.body).toEqual({ success: true, data: { deleted: true } });
  });
});
