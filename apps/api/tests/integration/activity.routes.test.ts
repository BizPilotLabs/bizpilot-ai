import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ids, rbacUser } from "../helpers/fixtures.js";

const authServiceMock = vi.hoisted(() => ({
  verifyAccessToken: vi.fn()
}));

const rbacRepositoryMock = vi.hoisted(() => ({
  findUserByIdInOrganization: vi.fn()
}));

const activityRepositoryMock = vi.hoisted(() => ({
  findActivities: vi.fn(),
  findActivityByIdInOrganization: vi.fn()
}));

vi.mock("../../src/modules/auth/auth.service.js", () => ({ authService: authServiceMock }));
vi.mock("../../src/modules/rbac/rbac.repository.js", () => ({ rbacRepository: rbacRepositoryMock }));
vi.mock("../../src/modules/activities/activity.repository.js", () => ({ activityRepository: activityRepositoryMock }));

const { createApp } = await import("../../src/app.js");

const now = new Date("2026-01-01T12:00:00.000Z");
const activity = {
  id: "12121212-1212-4121-8121-121212121212",
  userId: ids.ownerUser,
  organizationId: ids.organizationA,
  action: "role.permissions.update",
  resource: "role",
  ipAddress: null,
  userAgent: null,
  metadata: { roleId: ids.customRole, tokenHash: "hidden" },
  createdAt: now,
  updatedAt: now,
  user: {
    id: ids.ownerUser,
    email: "owner@example.com",
    firstName: "Olivia",
    lastName: "Owner",
    avatar: null
  }
};

describe("Activity routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMock.verifyAccessToken.mockReturnValue({ userId: ids.ownerUser, organizationId: ids.organizationA, sessionId: "session-id", tokenVersion: 1 });
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser());
    activityRepositoryMock.findActivities.mockResolvedValue({ activities: [activity], total: 1 });
    activityRepositoryMock.findActivityByIdInOrganization.mockResolvedValue(activity);
  });

  it("requires authentication for activity listing", async () => {
    const response = await request(createApp()).get("/activities");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: "AUTH_TOKEN_REQUIRED" } });
  });

  it("requires the activities.read permission", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).get("/activities").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(response.body).toMatchObject({ success: false, error: { code: "RBAC_PERMISSION_DENIED" } });
  });

  it("lists tenant-scoped activities with sanitized metadata and filters", async () => {
    const response = await request(createApp())
      .get("/activities")
      .query({ page: 2, limit: 10, action: "role.permissions.update", resource: "role", userId: ids.ownerUser, sort: "desc" })
      .set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(activityRepositoryMock.findActivities).toHaveBeenCalledWith({
      organizationId: ids.organizationA,
      query: expect.objectContaining({ page: 2, limit: 10, action: "role.permissions.update", resource: "role", userId: ids.ownerUser, sort: "desc" })
    });
    expect(response.body.data.activities[0].metadata).toEqual({ roleId: ids.customRole });
  });

  it("rejects invalid filters before repository access", async () => {
    const response = await request(createApp()).get("/activities").query({ userId: "not-a-uuid" }).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(400);
    expect(activityRepositoryMock.findActivities).not.toHaveBeenCalled();
  });

  it("gets one activity only within the authenticated organization", async () => {
    const response = await request(createApp()).get(`/activities/${activity.id}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(activityRepositoryMock.findActivityByIdInOrganization).toHaveBeenCalledWith({ activityId: activity.id, organizationId: ids.organizationA });
  });
});
