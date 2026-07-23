import type { Prisma, RefreshToken, Session, User } from "@prisma/client";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { prisma } from "../../core/database/index.js";
import type { RequestMetadata, UserWithAuthRelations } from "./auth.types.js";

const userAuthInclude = {
  organization: true,
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

export class AuthRepository {
  public async findUserByEmail(email: string): Promise<UserWithAuthRelations | null> {
    return prisma.user.findUnique({
      where: { email },
      include: userAuthInclude,
    }) as Promise<UserWithAuthRelations | null>;
  }

  public async findUserById(userId: string): Promise<UserWithAuthRelations | null> {
    return prisma.user.findUnique({
      where: { id: userId },
      include: userAuthInclude,
    }) as Promise<UserWithAuthRelations | null>;
  }

  public async createOwnerRegistration(input: {
    organizationName: string;
    organizationSlug: string;
    email: string;
    passwordHash: string;
    firstName: string;
    lastName: string;
    timezone: string;
    country?: string | undefined;
    currency: string;
    metadata: RequestMetadata;
    sessionExpiresAt: Date;
    refreshTokenHash: string;
    refreshTokenFamilyId: string;
    refreshTokenExpiresAt: Date;
  }): Promise<{ user: UserWithAuthRelations; session: Session; refreshToken: RefreshToken }> {
    try {
      return await prisma.$transaction(async (transaction) => {
        const organization = await transaction.organization.create({
          data: {
            name: input.organizationName,
            slug: input.organizationSlug,
            timezone: input.timezone,
            country: input.country ?? null,
            currency: input.currency,
          },
        });

        const user = await transaction.user.create({
          data: {
            email: input.email,
            passwordHash: input.passwordHash,
            firstName: input.firstName,
            lastName: input.lastName,
            status: "ACTIVE",
            organizationId: organization.id,
          },
        });

        const role = await transaction.role.create({
          data: {
            organizationId: organization.id,
            name: "Owner",
            description: "Organization owner with full administrative access.",
            isSystem: true,
          },
        });

        await transaction.userRole.create({
          data: {
            userId: user.id,
            roleId: role.id,
          },
        });

        const permissions = await transaction.permission.findMany({
          where: { deletedAt: null },
          select: { id: true },
        });

        if (permissions.length > 0) {
          await transaction.rolePermission.createMany({
            data: permissions.map((permission) => ({
              roleId: role.id,
              permissionId: permission.id,
            })),
          });
        }

        const session = await transaction.session.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            ipAddress: input.metadata.ipAddress ?? null,
            userAgent: input.metadata.userAgent ?? null,
            lastSeenAt: new Date(),
            expiresAt: input.sessionExpiresAt,
          },
        });

        const refreshToken = await transaction.refreshToken.create({
          data: {
            tokenHash: input.refreshTokenHash,
            tokenFamilyId: input.refreshTokenFamilyId,
            userId: user.id,
            organizationId: organization.id,
            sessionId: session.id,
            expiresAt: input.refreshTokenExpiresAt,
          },
        });

        await transaction.auditLog.create({
          data: {
            userId: user.id,
            organizationId: organization.id,
            action: "auth.register",
            resource: "auth",
            ipAddress: input.metadata.ipAddress ?? null,
            userAgent: input.metadata.userAgent ?? null,
            metadata: {
              organizationSlug: organization.slug,
            },
          },
        });

        const createdUser = await transaction.user.findUniqueOrThrow({
          where: { id: user.id },
          include: userAuthInclude,
        });

        return { user: createdUser as UserWithAuthRelations, session, refreshToken };
      });
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new Error("REGISTRATION_CONFLICT");
      }

      throw error;
    }
  }

  public async createLoginSession(input: {
    user: UserWithAuthRelations;
    metadata: RequestMetadata;
    sessionExpiresAt: Date;
    refreshTokenHash: string;
    refreshTokenFamilyId: string;
    refreshTokenExpiresAt: Date;
  }): Promise<{ user: UserWithAuthRelations; session: Session; refreshToken: RefreshToken }> {
    return prisma.$transaction(async (transaction) => {
      const session = await transaction.session.create({
        data: {
          userId: input.user.id,
          organizationId: input.user.organizationId,
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          lastSeenAt: new Date(),
          expiresAt: input.sessionExpiresAt,
        },
      });

      const refreshToken = await transaction.refreshToken.create({
        data: {
          tokenHash: input.refreshTokenHash,
          tokenFamilyId: input.refreshTokenFamilyId,
          userId: input.user.id,
          organizationId: input.user.organizationId,
          sessionId: session.id,
          expiresAt: input.refreshTokenExpiresAt,
        },
      });

      const user = await transaction.user.update({
        where: { id: input.user.id },
        data: {
          lastLoginAt: new Date(),
          failedLoginAttempts: 0,
          lockedUntil: null,
        },
        include: userAuthInclude,
      });

      await transaction.loginHistory.create({
        data: {
          userId: input.user.id,
          organizationId: input.user.organizationId,
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          success: true,
        },
      });

      await transaction.auditLog.create({
        data: {
          userId: input.user.id,
          organizationId: input.user.organizationId,
          action: "auth.login",
          resource: "auth",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
        },
      });

      return { user: user as UserWithAuthRelations, session, refreshToken };
    });
  }

  public async recordFailedLogin(input: { user?: User; email: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      if (input.user !== undefined) {
        await transaction.user.update({
          where: { id: input.user.id },
          data: {
            failedLoginAttempts: { increment: 1 },
          },
        });

        await transaction.loginHistory.create({
          data: {
            userId: input.user.id,
            organizationId: input.user.organizationId,
            ipAddress: input.metadata.ipAddress ?? null,
            userAgent: input.metadata.userAgent ?? null,
            success: false,
          },
        });
      }
    });
  }

  public async findActiveRefreshToken(tokenHash: string): Promise<(RefreshToken & { user: UserWithAuthRelations; session: Session | null }) | null> {
    const token = await prisma.refreshToken.findUnique({
      where: { tokenHash },
      include: {
        session: true,
        user: {
          include: userAuthInclude,
        },
      },
    });

    return token as (RefreshToken & { user: UserWithAuthRelations; session: Session | null }) | null;
  }

  public async rotateRefreshToken(input: {
    currentToken: RefreshToken;
    newTokenHash: string;
    newRefreshTokenExpiresAt: Date;
    metadata: RequestMetadata;
  }): Promise<{ user: UserWithAuthRelations; refreshToken: RefreshToken }> {
    return prisma.$transaction(async (transaction) => {
      const newRefreshToken = await transaction.refreshToken.create({
        data: {
          tokenHash: input.newTokenHash,
          tokenFamilyId: input.currentToken.tokenFamilyId,
          parentTokenId: input.currentToken.id,
          userId: input.currentToken.userId,
          organizationId: input.currentToken.organizationId,
          sessionId: input.currentToken.sessionId,
          expiresAt: input.newRefreshTokenExpiresAt,
        },
      });

      await transaction.refreshToken.update({
        where: { id: input.currentToken.id },
        data: {
          rotatedAt: new Date(),
          revokedAt: new Date(),
          revokedReason: "rotated",
          replacedByTokenId: newRefreshToken.id,
        },
      });

      if (input.currentToken.sessionId !== null) {
        await transaction.session.update({
          where: { id: input.currentToken.sessionId },
          data: {
            lastSeenAt: new Date(),
            ipAddress: input.metadata.ipAddress ?? null,
            userAgent: input.metadata.userAgent ?? null,
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: input.currentToken.userId,
          organizationId: input.currentToken.organizationId,
          action: "auth.refresh",
          resource: "auth",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
        },
      });

      const user = await transaction.user.findUniqueOrThrow({
        where: { id: input.currentToken.userId },
        include: userAuthInclude,
      });

      return { user: user as UserWithAuthRelations, refreshToken: newRefreshToken };
    });
  }

  public async revokeRefreshToken(input: { tokenHash: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const refreshToken = await transaction.refreshToken.findUnique({
        where: { tokenHash: input.tokenHash },
      });

      if (refreshToken === null) {
        return;
      }

      const revokedAt = new Date();
      await transaction.refreshToken.update({
        where: { id: refreshToken.id },
        data: {
          revokedAt,
          revokedReason: "logout",
        },
      });

      if (refreshToken.sessionId !== null) {
        await transaction.session.update({
          where: { id: refreshToken.sessionId },
          data: {
            revokedAt,
            revokedReason: "logout",
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: refreshToken.userId,
          organizationId: refreshToken.organizationId,
          action: "auth.logout",
          resource: "auth",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
        },
      });
    });
  }

  public async markRefreshTokenReuse(input: { refreshToken: RefreshToken; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      const detectedAt = new Date();

      await transaction.refreshToken.updateMany({
        where: {
          tokenFamilyId: input.refreshToken.tokenFamilyId,
          revokedAt: null,
        },
        data: {
          revokedAt: detectedAt,
          revokedReason: "reuse_detected",
          reuseDetectedAt: detectedAt,
        },
      });

      if (input.refreshToken.sessionId !== null) {
        await transaction.session.update({
          where: { id: input.refreshToken.sessionId },
          data: {
            revokedAt: detectedAt,
            revokedReason: "refresh_token_reuse_detected",
          },
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: input.refreshToken.userId,
          organizationId: input.refreshToken.organizationId,
          action: "auth.refresh_token_reuse_detected",
          resource: "auth",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
        },
      });
    });
  }
}

export const authRepository = new AuthRepository();