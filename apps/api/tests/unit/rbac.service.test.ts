import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppError } from "../../src/core/errors/index.js";
import { ids, organization, permission, rbacUser, role } from "../helpers/fixtures.js";

const rbacRepositoryMock = vi.hoisted(() => ({
  upsertPermissions: vi.fn(),
  ensureDefaultRoles: vi.fn(),
  findOrganizationById: vi.fn(),
  findUserByIdInOrganization: vi.fn(),
  findRolesByOrganization: vi.fn(),
  findRoleByIdInOrganization: vi.fn(),
  findPermissions: vi.fn(),
  countUsersAssignedToRole: vi.fn(),
  createRole: vi.fn(),
  updateRole: vi.fn(),
  deleteRole: vi.fn(),
  updateRolePermissions: vi.fn(),
  updateUserRoles: vi.fn()
}));

vi.mock("../../src/modules/rbac/rbac.repository.js", () => ({ rbacRepository: rbacRepositoryMock }));

const { rbacService } = await import("../../src/modules/rbac/rbac.service.js");

describe("RbacService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    rbacRepositoryMock.findOrganizationById.mockResolvedValue(organization);
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser());
    rbacRepositoryMock.findPermissions.mockResolvedValue([permission(), permission({ id: ids.permissionUpdateOrg, key: "organizations.update", resource: "organizations", action: "update" })]);
  });

  it("lists tenant roles with assigned user counts", async () => {
    rbacRepositoryMock.findRolesByOrganization.mockResolvedValue([role({ userCount: undefined, _count: { users: 3 } })]);

    const result = await rbacService.listRoles({ actorUserId: ids.ownerUser, organizationId: ids.organizationA });

    expect(result[0]).toMatchObject({ id: ids.customRole, userCount: 3 });
  });

  it("publishes a permission catalog containing current module permissions", async () => {
    rbacRepositoryMock.findPermissions.mockImplementation(() => Promise.resolve([
      permission({ key: "teams.read", resource: "teams", action: "read" }),
      permission({ key: "comments.read", resource: "comments", action: "read" }),
      permission({ key: "attachments.read", resource: "attachments", action: "read" }),
      permission({ key: "activities.read", resource: "activities", action: "read" })
    ]));

    const result = await rbacService.listPermissions();

    expect(result.map((item) => item.key)).toEqual(["teams.read", "comments.read", "attachments.read", "activities.read"]);
    expect(rbacRepositoryMock.upsertPermissions).toHaveBeenCalled();
  });

  it("rejects reserved system-role names for custom role creation", async () => {
    await expect(rbacService.createRole({
      actorUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      data: { name: "Owner", permissionIds: [] },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "ROLE_SYSTEM_NAME_RESERVED" });
  });

  it("rejects system-role update and permission mutation", async () => {
    rbacRepositoryMock.findRoleByIdInOrganization.mockResolvedValue(role({ name: "Admin", isSystem: true }));

    await expect(rbacService.updateRole({
      actorUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      roleId: ids.adminRole,
      data: { name: "Admin Edited" },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "ROLE_SYSTEM_UPDATE_FORBIDDEN" });

    await expect(rbacService.updateRolePermissions({
      actorUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      roleId: ids.adminRole,
      data: { permissionIds: [ids.permissionReadUsers] },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "ROLE_SYSTEM_PERMISSIONS_FORBIDDEN" });
  });

  it("rejects assigned custom-role deletion and allows unassigned custom-role deletion", async () => {
    rbacRepositoryMock.findRoleByIdInOrganization.mockResolvedValue(role({ isSystem: false }));
    rbacRepositoryMock.countUsersAssignedToRole.mockResolvedValueOnce(2);

    await expect(rbacService.deleteRole({
      actorUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      roleId: ids.customRole,
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "ROLE_ASSIGNED_DELETE_FORBIDDEN" });

    rbacRepositoryMock.countUsersAssignedToRole.mockResolvedValueOnce(0);

    await rbacService.deleteRole({
      actorUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      roleId: ids.customRole,
      metadata: { ipAddress: undefined, userAgent: undefined }
    });

    expect(rbacRepositoryMock.deleteRole).toHaveBeenCalled();
  });

  it("rejects invalid permission ids during assignment", async () => {
    rbacRepositoryMock.findRoleByIdInOrganization.mockResolvedValue(role({ isSystem: false }));

    await expect(rbacService.updateRolePermissions({
      actorUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      roleId: ids.customRole,
      data: { permissionIds: ["dddddddd-dddd-4ddd-8ddd-dddddddddddd"] },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "PERMISSION_INVALID_ASSIGNMENT" });
  });
});

