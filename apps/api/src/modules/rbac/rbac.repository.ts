import type { Permission, Prisma } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type {
  PermissionCatalogItem,
  PermissionAssignmentInput,
  RbacUserRecord,
  RequestMetadata,
  RoleCreateInput,
  RoleUpdateInput,
  RoleWithPermissions,
  UserRoleAssignmentInput,
} from "./rbac.types.js";

const roleInclude = {
  permissions: {
    include: {
      permission: true,
    },
  },
} satisfies Prisma.RoleInclude;

const userInclude = {
  roles: {
    include: {
      role: {
        include: roleInclude,
      },
    },
  },
} satisfies Prisma.UserInclude;

export class RbacRepository {
  public async upsertPermissions(permissions: readonly PermissionCatalogItem[]): Promise<void> {
    await prisma.$transaction(
      permissions.map((permission) =>
        prisma.permission.upsert({
          where: { key: permission.key },
          update: {
            name: permission.name,
            description: permission.description,
            resource: permission.resource,
            action: permission.action,
            deletedAt: null,
          },
          create: permission,
        }),
      ),
    );
  }

  public async ensureDefaultRoles(input: {
    organizationId: string;
    rolePermissions: Readonly<Record<string, readonly string[]>>;
  }): Promise<void> {
    const permissions = await prisma.permission.findMany({
      where: { deletedAt: null },
      select: { id: true, key: true },
    });
    const permissionByKey = new Map(permissions.map((permission) => [permission.key, permission.id]));

    await prisma.$transaction(async (transaction) => {
      for (const [roleName, permissionKeys] of Object.entries(input.rolePermissions)) {
        const role = await transaction.role.upsert({
          where: {
            organizationId_name: {
              organizationId: input.organizationId,
              name: roleName,
            },
          },
          update: {
            isSystem: true,
            deletedAt: null,
          },
          create: {
            organizationId: input.organizationId,
            name: roleName,
            description: `${roleName} system role`,
            isSystem: true,
          },
        });

        const rolePermissionIds = permissionKeys
          .map((permissionKey) => permissionByKey.get(permissionKey))
          .filter((permissionId): permissionId is string => permissionId !== undefined);

        if (rolePermissionIds.length > 0) {
          await transaction.rolePermission.createMany({
            data: rolePermissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
            skipDuplicates: true,
          });
        }
      }
    });
  }

  public async findOrganizationById(organizationId: string): Promise<{ id: string; deletedAt: Date | null } | null> {
    return prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, deletedAt: true },
    });
  }

  public async findUserByIdInOrganization(input: { userId: string; organizationId: string }): Promise<RbacUserRecord | null> {
    const user = await prisma.user.findFirst({
      where: {
        id: input.userId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      include: userInclude,
    });

    return user as RbacUserRecord | null;
  }

  public async findRolesByOrganization(organizationId: string): Promise<RoleWithPermissions[]> {
    const roles = await prisma.role.findMany({
      where: {
        organizationId,
        deletedAt: null,
      },
      include: roleInclude,
      orderBy: [{ isSystem: "desc" }, { name: "asc" }],
    });

    return roles as RoleWithPermissions[];
  }

  public async findRoleByIdInOrganization(input: { roleId: string; organizationId: string }): Promise<RoleWithPermissions | null> {
    const role = await prisma.role.findFirst({
      where: {
        id: input.roleId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      include: roleInclude,
    });

    return role as RoleWithPermissions | null;
  }

  public async findPermissions(): Promise<Permission[]> {
    return prisma.permission.findMany({
      where: { deletedAt: null },
      orderBy: [{ resource: "asc" }, { action: "asc" }],
    });
  }

  public async createRole(input: {
    organizationId: string;
    actorUserId: string;
    data: RoleCreateInput;
    metadata: RequestMetadata;
  }): Promise<RoleWithPermissions> {
    return prisma.$transaction(async (transaction) => {
      const role = await transaction.role.create({
        data: {
          organizationId: input.organizationId,
          name: input.data.name,
          description: input.data.description ?? null,
          isSystem: false,
        },
      });

      if (input.data.permissionIds !== undefined && input.data.permissionIds.length > 0) {
        await transaction.rolePermission.createMany({
          data: input.data.permissionIds.map((permissionId) => ({ roleId: role.id, permissionId })),
          skipDuplicates: true,
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "role.create",
          resource: "role",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: { roleId: role.id, name: role.name },
        },
      });

      const createdRole = await transaction.role.findUniqueOrThrow({ where: { id: role.id }, include: roleInclude });
      return createdRole as RoleWithPermissions;
    });
  }

  public async updateRole(input: {
    roleId: string;
    organizationId: string;
    actorUserId: string;
    data: RoleUpdateInput;
    metadata: RequestMetadata;
  }): Promise<RoleWithPermissions> {
    return prisma.$transaction(async (transaction) => {
      const data: Prisma.RoleUpdateInput = {};

      if (input.data.name !== undefined) {
        data.name = input.data.name;
      }

      if (input.data.description !== undefined) {
        data.description = input.data.description;
      }

      const role = await transaction.role.update({
        where: { id: input.roleId },
        data,
        include: roleInclude,
      });

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "role.update",
          resource: "role",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: { roleId: role.id },
        },
      });

      return role as RoleWithPermissions;
    });
  }

  public async deleteRole(input: { roleId: string; organizationId: string; actorUserId: string; metadata: RequestMetadata }): Promise<void> {
    await prisma.$transaction(async (transaction) => {
      await transaction.role.update({
        where: { id: input.roleId },
        data: { deletedAt: new Date() },
      });

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "role.delete",
          resource: "role",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: { roleId: input.roleId },
        },
      });
    });
  }

  public async updateRolePermissions(input: {
    roleId: string;
    organizationId: string;
    actorUserId: string;
    data: PermissionAssignmentInput;
    metadata: RequestMetadata;
  }): Promise<RoleWithPermissions> {
    return prisma.$transaction(async (transaction) => {
      await transaction.rolePermission.deleteMany({ where: { roleId: input.roleId } });

      if (input.data.permissionIds.length > 0) {
        await transaction.rolePermission.createMany({
          data: input.data.permissionIds.map((permissionId) => ({ roleId: input.roleId, permissionId })),
          skipDuplicates: true,
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "role.permissions.update",
          resource: "role",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: { roleId: input.roleId, permissionIds: input.data.permissionIds },
        },
      });

      const role = await transaction.role.findUniqueOrThrow({ where: { id: input.roleId }, include: roleInclude });
      return role as RoleWithPermissions;
    });
  }

  public async updateUserRoles(input: {
    targetUserId: string;
    organizationId: string;
    actorUserId: string;
    data: UserRoleAssignmentInput;
    metadata: RequestMetadata;
  }): Promise<RbacUserRecord> {
    return prisma.$transaction(async (transaction) => {
      await transaction.userRole.deleteMany({ where: { userId: input.targetUserId } });

      if (input.data.roleIds.length > 0) {
        await transaction.userRole.createMany({
          data: input.data.roleIds.map((roleId) => ({ userId: input.targetUserId, roleId })),
          skipDuplicates: true,
        });
      }

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "user.roles.update",
          resource: "user",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: { targetUserId: input.targetUserId, roleIds: input.data.roleIds },
        },
      });

      const user = await transaction.user.findUniqueOrThrow({ where: { id: input.targetUserId }, include: userInclude });
      return user as RbacUserRecord;
    });
  }
}

export const rbacRepository = new RbacRepository();