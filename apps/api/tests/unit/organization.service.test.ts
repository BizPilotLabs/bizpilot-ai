import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppError } from "../../src/core/errors/index.js";
import { ids, organization, organizationUser, permission, role } from "../helpers/fixtures.js";

const organizationRepositoryMock = vi.hoisted(() => ({
  findOrganizationById: vi.fn(),
  findOrganizationUser: vi.fn(),
  updateOrganization: vi.fn(),
  updateOrganizationSettings: vi.fn()
}));

vi.mock("../../src/modules/organizations/organization.repository.js", () => ({ organizationRepository: organizationRepositoryMock }));

const { organizationService } = await import("../../src/modules/organizations/organization.service.js");

describe("OrganizationService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the authenticated user's organization", async () => {
    organizationRepositoryMock.findOrganizationById.mockResolvedValue(organization);
    organizationRepositoryMock.findOrganizationUser.mockResolvedValue(organizationUser());

    const result = await organizationService.getCurrentOrganization({ userId: ids.memberUser, organizationId: ids.organizationA });

    expect(result).toMatchObject({ id: ids.organizationA, slug: "bizpilot-test" });
  });

  it("updates organization settings for users with the legacy organizations.manage permission", async () => {
    const manager = organizationUser({
      roles: [{ role: role({ permissions: [{ permission: permission({ key: "organizations.manage", resource: "organizations", action: "manage" }) }] }) }]
    });
    organizationRepositoryMock.findOrganizationById.mockResolvedValue(organization);
    organizationRepositoryMock.findOrganizationUser.mockResolvedValue(manager);
    organizationRepositoryMock.updateOrganizationSettings.mockResolvedValue({ ...organization, timezone: "America/New_York", currency: "EUR" });

    const result = await organizationService.updateCurrentOrganizationSettings({
      userId: ids.memberUser,
      organizationId: ids.organizationA,
      data: { timezone: "America/New_York", currency: "EUR" },
      metadata: { ipAddress: undefined, userAgent: undefined }
    });

    expect(result.timezone).toBe("America/New_York");
    expect(result.currency).toBe("EUR");
  });

  it("rejects updates from organization members without update permissions", async () => {
    organizationRepositoryMock.findOrganizationById.mockResolvedValue(organization);
    organizationRepositoryMock.findOrganizationUser.mockResolvedValue(organizationUser({ roles: [{ role: role({ name: "Member", permissions: [] }) }] }));

    await expect(organizationService.updateCurrentOrganization({
      userId: ids.memberUser,
      organizationId: ids.organizationA,
      data: { name: "Blocked" },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ statusCode: 403, code: "ORGANIZATION_PERMISSION_DENIED" });
  });

  it("rejects deleted organizations", async () => {
    organizationRepositoryMock.findOrganizationById.mockResolvedValue({ ...organization, deletedAt: new Date("2026-01-02T00:00:00.000Z") });
    organizationRepositoryMock.findOrganizationUser.mockResolvedValue(organizationUser());

    await expect(organizationService.getCurrentOrganization({ userId: ids.memberUser, organizationId: ids.organizationA })).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: "ORGANIZATION_NOT_FOUND"
    });
  });
});

