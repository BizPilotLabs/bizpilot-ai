import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ids, rbacUser } from "../helpers/fixtures.js";

const authServiceMock = vi.hoisted(() => ({ verifyAccessToken: vi.fn() }));
const rbacRepositoryMock = vi.hoisted(() => ({ findUserByIdInOrganization: vi.fn() }));
const projectRepositoryMock = vi.hoisted(() => ({
  findProjects: vi.fn(),
  findProjectByIdInOrganization: vi.fn(),
  createProject: vi.fn(),
  updateProject: vi.fn(),
  softDeleteProject: vi.fn()
}));

vi.mock("../../src/modules/auth/auth.service.js", () => ({ authService: authServiceMock }));
vi.mock("../../src/modules/rbac/rbac.repository.js", () => ({ rbacRepository: rbacRepositoryMock }));
vi.mock("../../src/modules/projects/project.repository.js", () => ({ projectRepository: projectRepositoryMock }));

const { createApp } = await import("../../src/app.js");

const projectId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const now = new Date("2026-01-01T00:00:00.000Z");
const project = {
  id: projectId,
  organizationId: ids.organizationA,
  name: "Customer Launch",
  description: null,
  status: "ACTIVE",
  startDate: null,
  endDate: null,
  color: null,
  archived: false,
  createdById: ids.ownerUser,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  createdBy: { id: ids.ownerUser, email: "owner@example.com", firstName: "Olivia", lastName: "Owner", avatar: null },
  taskCount: 4,
  completedTaskCount: 2
};

describe("Project destructive routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMock.verifyAccessToken.mockReturnValue({ userId: ids.ownerUser, organizationId: ids.organizationA, sessionId: "session-id", tokenVersion: 1 });
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser());
    projectRepositoryMock.findProjectByIdInOrganization.mockResolvedValue(project);
    projectRepositoryMock.updateProject.mockImplementation((input) => Promise.resolve({ ...project, ...input.data }));
    projectRepositoryMock.softDeleteProject.mockResolvedValue(undefined);
  });

  it("requires authentication before archive/update", async () => {
    const response = await request(createApp()).patch(`/projects/${projectId}`).send({ archived: true });

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: "AUTH_TOKEN_REQUIRED" } });
  });

  it("requires projects.update before archiving or restoring", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).patch(`/projects/${projectId}`).set("Authorization", "Bearer valid-token").send({ archived: true });

    expect(response.status).toBe(403);
    expect(projectRepositoryMock.updateProject).not.toHaveBeenCalled();
  });

  it("archives projects through PATCH with organization and user context", async () => {
    const response = await request(createApp())
      .patch(`/projects/${projectId}`)
      .set("Authorization", "Bearer valid-token")
      .set("User-Agent", "project-route-test")
      .send({ archived: true });

    expect(response.status).toBe(200);
    expect(projectRepositoryMock.findProjectByIdInOrganization).toHaveBeenCalledWith({ projectId, organizationId: ids.organizationA });
    expect(projectRepositoryMock.updateProject).toHaveBeenCalledWith(expect.objectContaining({ projectId, organizationId: ids.organizationA, actorUserId: ids.ownerUser, data: { archived: true }, metadata: expect.objectContaining({ userAgent: "project-route-test" }) }));
    expect(response.body.data.project.archived).toBe(true);
  });

  it("restores projects through PATCH with archived false", async () => {
    projectRepositoryMock.findProjectByIdInOrganization.mockResolvedValue({ ...project, archived: true });

    const response = await request(createApp()).patch(`/projects/${projectId}`).set("Authorization", "Bearer valid-token").send({ archived: false });

    expect(response.status).toBe(200);
    expect(projectRepositoryMock.updateProject).toHaveBeenCalledWith(expect.objectContaining({ data: { archived: false } }));
  });

  it("rejects invalid project ids before lookup", async () => {
    const response = await request(createApp()).delete("/projects/not-a-uuid").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(400);
    expect(projectRepositoryMock.findProjectByIdInOrganization).not.toHaveBeenCalled();
  });

  it("safely reports not found for cross-tenant project deletes", async () => {
    projectRepositoryMock.findProjectByIdInOrganization.mockResolvedValue(null);

    const response = await request(createApp()).delete(`/projects/${projectId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, error: { code: "PROJECT_NOT_FOUND" } });
    expect(response.body.error.message).not.toContain(ids.organizationB);
  });

  it("requires projects.delete before deletion", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).delete(`/projects/${projectId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(projectRepositoryMock.softDeleteProject).not.toHaveBeenCalled();
  });

  it("soft deletes projects with authenticated organization and user context", async () => {
    const response = await request(createApp()).delete(`/projects/${projectId}`).set("Authorization", "Bearer valid-token").set("User-Agent", "project-delete-test");

    expect(response.status).toBe(200);
    expect(projectRepositoryMock.softDeleteProject).toHaveBeenCalledWith(expect.objectContaining({ projectId, organizationId: ids.organizationA, actorUserId: ids.ownerUser, metadata: expect.objectContaining({ userAgent: "project-delete-test" }) }));
    expect(response.body).toEqual({ success: true, data: { deleted: true } });
  });
});
