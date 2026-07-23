import { AppError } from "../../core/errors/index.js";
import { userRepository } from "./user.repository.js";
import type { RequestMetadata, UserListQuery, UserListResult, UserProfile, UserRecord, UserUpdateInput } from "./user.types.js";

const toUserProfile = (user: UserRecord): UserProfile => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName,
  lastName: user.lastName,
  avatar: user.avatar,
  phone: user.phone,
  status: user.status,
  emailVerified: user.emailVerified,
  lastLoginAt: user.lastLoginAt,
  organizationId: user.organizationId,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
  roles: user.roles
    .filter(({ role }) => role.deletedAt === null)
    .map(({ role }) => ({
      id: role.id,
      name: role.name,
      description: role.description,
      isSystem: role.isSystem,
    })),
});

const isOwner = (user: UserRecord): boolean => user.roles.some(({ role }) => role.deletedAt === null && role.name === "Owner");

const isOwnerOrAdmin = (user: UserRecord): boolean => {
  return user.roles.some(({ role }) => role.deletedAt === null && (role.name === "Owner" || role.name === "Admin"));
};

export class UserService {
  public async listUsers(input: { organizationId: string; query: UserListQuery }): Promise<UserListResult> {
    const result = await userRepository.findUsersByOrganization(input);
    const totalPages = Math.max(1, Math.ceil(result.total / input.query.limit));

    return {
      users: result.users.map(toUserProfile),
      pagination: {
        page: input.query.page,
        limit: input.query.limit,
        total: result.total,
        totalPages,
      },
    };
  }

  public async getUser(input: { requesterUserId: string; organizationId: string; targetUserId: string }): Promise<UserProfile> {
    await this.assertRequesterBelongsToOrganization(input.requesterUserId, input.organizationId);

    const user = await userRepository.findUserByIdInOrganization({
      userId: input.targetUserId,
      organizationId: input.organizationId,
    });

    if (user === null) {
      throw new AppError({ statusCode: 404, message: "User not found.", code: "USER_NOT_FOUND" });
    }

    return toUserProfile(user);
  }

  public async updateUser(input: {
    requesterUserId: string;
    organizationId: string;
    targetUserId: string;
    data: UserUpdateInput;
    metadata: RequestMetadata;
  }): Promise<UserProfile> {
    const [requester, targetUser] = await Promise.all([
      userRepository.findUserByIdInOrganization({ userId: input.requesterUserId, organizationId: input.organizationId }),
      userRepository.findUserByIdInOrganization({ userId: input.targetUserId, organizationId: input.organizationId }),
    ]);

    if (requester === null || targetUser === null) {
      throw new AppError({ statusCode: 404, message: "User not found.", code: "USER_NOT_FOUND" });
    }

    if (requester.id !== targetUser.id && !isOwnerOrAdmin(requester)) {
      throw new AppError({
        statusCode: 403,
        message: "You do not have permission to update this user.",
        code: "USER_PERMISSION_DENIED",
      });
    }

    const updatedUser = await userRepository.updateUser({
      targetUserId: targetUser.id,
      organizationId: input.organizationId,
      actorUserId: requester.id,
      data: input.data,
      metadata: input.metadata,
    });

    return toUserProfile(updatedUser);
  }

  public async deleteUser(input: {
    requesterUserId: string;
    organizationId: string;
    targetUserId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    if (input.requesterUserId === input.targetUserId) {
      throw new AppError({ statusCode: 400, message: "You cannot delete your own user account.", code: "USER_SELF_DELETE_FORBIDDEN" });
    }

    const [requester, targetUser] = await Promise.all([
      userRepository.findUserByIdInOrganization({ userId: input.requesterUserId, organizationId: input.organizationId }),
      userRepository.findUserByIdInOrganization({ userId: input.targetUserId, organizationId: input.organizationId }),
    ]);

    if (requester === null || targetUser === null) {
      throw new AppError({ statusCode: 404, message: "User not found.", code: "USER_NOT_FOUND" });
    }

    if (!isOwnerOrAdmin(requester)) {
      throw new AppError({
        statusCode: 403,
        message: "You do not have permission to delete users.",
        code: "USER_PERMISSION_DENIED",
      });
    }

    if (isOwner(targetUser)) {
      throw new AppError({ statusCode: 400, message: "Organization Owner cannot be deleted.", code: "USER_OWNER_DELETE_FORBIDDEN" });
    }

    await userRepository.softDeleteUser({
      targetUserId: targetUser.id,
      organizationId: input.organizationId,
      actorUserId: requester.id,
      metadata: input.metadata,
    });
  }

  private async assertRequesterBelongsToOrganization(userId: string, organizationId: string): Promise<void> {
    const requester = await userRepository.findUserByIdInOrganization({ userId, organizationId });

    if (requester === null) {
      throw new AppError({ statusCode: 404, message: "User not found.", code: "USER_NOT_FOUND" });
    }
  }
}

export const userService = new UserService();