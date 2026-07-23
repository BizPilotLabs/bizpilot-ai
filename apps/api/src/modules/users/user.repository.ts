import type { Prisma } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { RequestMetadata, UserListQuery, UserRecord, UserUpdateInput } from "./user.types.js";

const userInclude = {
  roles: {
    include: {
      role: {
        include: {
          permissions: {
            include: {
              permission: true,
            },
          },
        },
      },
    },
  },
} satisfies Prisma.UserInclude;

const toUserUpdateData = (input: UserUpdateInput): Prisma.UserUpdateInput => {
  const data: Prisma.UserUpdateInput = {};

  if (input.firstName !== undefined) {
    data.firstName = input.firstName;
  }

  if (input.lastName !== undefined) {
    data.lastName = input.lastName;
  }

  if (input.avatar !== undefined) {
    data.avatar = input.avatar;
  }

  return data;
};

const createSearchWhere = (query: UserListQuery): Prisma.UserWhereInput => {
  if (query.search === undefined) {
    return {};
  }

  return {
    OR: [
      { email: { contains: query.search, mode: "insensitive" } },
      { firstName: { contains: query.search, mode: "insensitive" } },
      { lastName: { contains: query.search, mode: "insensitive" } },
    ],
  };
};

export class UserRepository {
  public async findUsersByOrganization(input: {
    organizationId: string;
    query: UserListQuery;
  }): Promise<{ users: UserRecord[]; total: number }> {
    const where: Prisma.UserWhereInput = {
      organizationId: input.organizationId,
      deletedAt: null,
      ...createSearchWhere(input.query),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: userInclude,
        orderBy: { createdAt: input.query.sort },
        skip: (input.query.page - 1) * input.query.limit,
        take: input.query.limit,
      }),
      prisma.user.count({ where }),
    ]);

    return { users: users as UserRecord[], total };
  }

  public async findUserByIdInOrganization(input: { userId: string; organizationId: string }): Promise<UserRecord | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: input.userId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      include: userInclude,
    });

    return user as UserRecord | null;
  }

  public async updateUser(input: {
    targetUserId: string;
    organizationId: string;
    actorUserId: string;
    data: UserUpdateInput;
    metadata: RequestMetadata;
  }): Promise<UserRecord> {
    return prisma.$transaction(async (transaction) => {
      const user = await transaction.user.update({
        where: { id: input.targetUserId },
        data: toUserUpdateData(input.data),
        include: userInclude,
      });

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "user.update",
          resource: "user",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: {
            targetUserId: input.targetUserId,
            fields: Object.keys(input.data).filter((key) => input.data[key as keyof UserUpdateInput] !== undefined),
          },
        },
      });

      return user as UserRecord;
    });
  }

  public async softDeleteUser(input: {
    targetUserId: string;
    organizationId: string;
    actorUserId: string;
    metadata: RequestMetadata;
  }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      await transaction.user.update({
        where: { id: input.targetUserId },
        data: {
          deletedAt: new Date(),
          status: "DISABLED",
        },
      });

      await transaction.session.updateMany({
        where: {
          userId: input.targetUserId,
          organizationId: input.organizationId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "user_deleted",
        },
      });

      await transaction.refreshToken.updateMany({
        where: {
          userId: input.targetUserId,
          organizationId: input.organizationId,
          revokedAt: null,
        },
        data: {
          revokedAt: new Date(),
          revokedReason: "user_deleted",
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "user.delete",
          resource: "user",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: {
            targetUserId: input.targetUserId,
          },
        },
      });
    });
  }
}

export const userRepository = new UserRepository();