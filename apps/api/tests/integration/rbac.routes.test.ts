import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ids, organization, rbacUser, role } from "../helpers/fixtures.js";

const authServiceMock = vi.hoisted(() => ({
  verifyAccessToken: vi.fn()
}));

const rbacRepositoryMock = vi.hoisted(() => ({
  upsertPermissions: vi.fn(),
  ensureDefaultRoles: vi.fn(),
  findOrganizationById: vi.fn(),
  findUserByIdInOrganization: vi.fn(),
  findRolesByOrganization: vi.fn()
}));

vi.mock("../../src/modules/auth/auth.service.js", () => ({ authService: authServiceMock }));
vi.mock("../../src/modules/rbac/rbac.repository.js", () => ({ rbacRepository: rbacRepositoryMock }));

const { createApp } = await import("../../src/app.js");

describe("RBAC routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMock.verifyAccessToken.mockReturnValue({ userId: ids.ownerUser, organizationId: ids.organizationA, sessionId: "session-id", tokenVersion: 1 });
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser());
    rbacRepositoryMock.findOrganizationById.mockResolvedValue(organization);
    rbacRepositoryMock.findRolesByOrganization.mockResolvedValue([role()]);
  });

  it("requires authentication for role listing", async () => {
    const response = await request(createApp()).get("/roles");

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: "AUTH_TOKEN_REQUIRED" } });
  });

  it("returns tenant roles through the real route and middleware stack", async () => {
    const response = await request(createApp()).get("/roles").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body).toMatchObject({ success: true, data: { roles: [{ id: ids.customRole, organizationId: ids.organizationA }] } });
    expect(authServiceMock.verifyAccessToken).toHaveBeenCalledWith("valid-token");
    expect(rbacRepositoryMock.findRolesByOrganization).toHaveBeenCalledWith(ids.organizationA);
  });
});
