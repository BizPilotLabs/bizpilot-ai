import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppError } from "../../src/core/errors/index.js";
import { ids, ownerUser, prismaRole, user } from "../helpers/fixtures.js";

const userRepositoryMock = vi.hoisted(() => ({
  findUsersByOrganization: vi.fn(),
  findUserByIdInOrganization: vi.fn(),
  findUserByEmailInOrganization: vi.fn(),
  findRolesByIdsInOrganization: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  softDeleteUser: vi.fn()
}));

const bcryptMock = vi.hoisted(() => ({
  hash: vi.fn()
}));

vi.mock("../../src/modules/users/user.repository.js", () => ({ userRepository: userRepositoryMock }));
vi.mock("bcrypt", () => ({ default: bcryptMock }));

const { userService } = await import("../../src/modules/users/user.service.js");

describe("UserService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    bcryptMock.hash.mockResolvedValue("hashed-password");
  });

  it("lists organization users without exposing password hashes", async () => {
    userRepositoryMock.findUsersByOrganization.mockResolvedValue({ users: [user()], total: 1 });

    const result = await userService.listUsers({ organizationId: ids.organizationA, query: { page: 1, limit: 20, sort: "desc" } });

    expect(result.pagination.total).toBe(1);
    expect(result.users[0]).toMatchObject({ email: "member@example.com", organizationId: ids.organizationA });
    expect(result.users[0]).not.toHaveProperty("passwordHash");
  });

  it("creates an organization user with a hashed password and unique role assignments", async () => {
    const createdUser = user({ id: ids.targetUser, email: "new@example.com" });
    userRepositoryMock.findUserByIdInOrganization.mockResolvedValue(ownerUser());
    userRepositoryMock.findUserByEmailInOrganization.mockResolvedValue(null);
    userRepositoryMock.findRolesByIdsInOrganization.mockResolvedValue([prismaRole({ id: ids.memberRole })]);
    userRepositoryMock.createUser.mockResolvedValue(createdUser);

    const result = await userService.createUser({
      requesterUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      data: { firstName: "New", lastName: "User", email: "new@example.com", password: "a-secure-password", roleIds: [ids.memberRole, ids.memberRole] },
      metadata: { ipAddress: undefined, userAgent: undefined }
    });

    expect(bcryptMock.hash).toHaveBeenCalledWith("a-secure-password", 12);
    expect(userRepositoryMock.createUser).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      passwordHash: "hashed-password",
      data: expect.objectContaining({ roleIds: [ids.memberRole] })
    }));
    expect(result.email).toBe("new@example.com");
  });

  it("rejects duplicate emails inside the organization", async () => {
    userRepositoryMock.findUserByIdInOrganization.mockResolvedValue(ownerUser());
    userRepositoryMock.findUserByEmailInOrganization.mockResolvedValue(user());

    await expect(userService.createUser({
      requesterUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      data: { firstName: "Maya", lastName: "Member", email: "member@example.com", password: "a-secure-password", roleIds: [ids.memberRole] },
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ statusCode: 409, code: "USER_EMAIL_CONFLICT" });
  });

  it("rejects cross-organization user access when the requester is not in the organization", async () => {
    userRepositoryMock.findUserByIdInOrganization.mockResolvedValue(null);

    await expect(userService.getUser({ requesterUserId: ids.memberUser, organizationId: ids.organizationB, targetUserId: ids.targetUser })).rejects.toMatchObject<AppError>({
      statusCode: 404,
      code: "USER_NOT_FOUND"
    });
  });

  it("prevents self deletion and owner deletion", async () => {
    await expect(userService.deleteUser({
      requesterUserId: ids.ownerUser,
      organizationId: ids.organizationA,
      targetUserId: ids.ownerUser,
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "USER_SELF_DELETE_FORBIDDEN" });

    userRepositoryMock.findUserByIdInOrganization.mockResolvedValueOnce(ownerUser()).mockResolvedValueOnce(ownerUser());

    await expect(userService.deleteUser({
      requesterUserId: ids.adminUser,
      organizationId: ids.organizationA,
      targetUserId: ids.ownerUser,
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "USER_OWNER_DELETE_FORBIDDEN" });
  });
});

