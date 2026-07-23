import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

import { AppError } from "../../core/errors/index.js";
import { rbacRepository } from "./rbac.repository.js";
import type {
  PermissionAssignmentInput,
  PermissionCatalogItem,
  PermissionResponse,
  RbacUserRecord,
  RequestMetadata,
  RoleCreateInput,
  RoleResponse,
  RoleUpdateInput,
  RoleWithPermissions,
  UserRoleAssignmentInput,
  UserRoleResponse,
} from "./rbac.types.js";

const permissionCatalog = [
  ["users.read", "Read users", "users", "read"],
  ["users.create", "Create users", "users", "create"],
  ["users.update", "Update users", "users", "update"],
  ["users.delete", "Delete users", "users", "delete"],
  ["organizations.read", "Read organizations", "organizations", "read"],
  ["organizations.update", "Update organizations", "organizations", "update"],
  ["roles.read", "Read roles", "roles", "read"],
  ["roles.create", "Create roles", "roles", "create"],
  ["roles.update", "Update roles", "roles", "update"],
  ["roles.delete", "Delete roles", "roles", "delete"],
  ["projects.read", "Read projects", "projects", "read"],
  ["projects.create", "Create projects", "projects", "create"],
  ["projects.update", "Update projects", "projects", "update"],
  ["projects.delete", "Delete projects", "projects", "delete"],
  ["tasks.read", "Read tasks", "tasks", "read"],
  ["tasks.create", "Create tasks", "tasks", "create"],
  ["tasks.update", "Update tasks", "tasks", "update"],
  ["tasks.delete", "Delete tasks", "tasks", "delete"],
  ["crm.read", "Read CRM", "crm", "read"],
  ["crm.create", "Create CRM records", "crm", "create"],
  ["crm.update", "Update CRM records", "crm", "update"],
  ["crm.delete", "Delete CRM records", "crm", "delete"],
  ["billing.read", "Read billing", "billing", "read"],
  ["billing.update", "Update billing", "billing", "update"],
  ["ai.use", "Use AI", "ai", "use"],
] as const;

const permissions: PermissionCatalogItem[] = permissionCatalog.map(([key, name, resource, action]) => ({
  key,
  name,
  resource,
  action,
  description: `${name} permission.`,
}));

const ownerPermissionKeys = permissions.map((permission) => permission.key);
const adminPermissionKeys = ownerPermissionKeys.filter((permissionKey) => permissionKey !== "billing.update");
const managerPermissionKeys = [
  "users.read",
  "organizations.read",
  "roles.read",
  "projects.read",
  "projects.create",
  "projects.update",
  "tasks.read",
  "tasks.create",
  "tasks.update",
  "crm.read",
  "crm.create",
  "crm.update",
  "ai.use",
] as const;
const memberPermissionKeys = ["users.read", "organizations.read", "projects.read", "tasks.read", "crm.read", "ai.use"] as const;

const defaultRolePermissions = {
  Owner: ownerPermissionKeys,
  Admin: adminPermissionKeys,
  Manager: managerPermissionKeys,
  Member: memberPermissionKeys,
} as const;

const toPermissionResponse = (permission: {
  id: string;
  key: string;
  name: string;
  description: string | null;
  resource: string;
  action: string;
}): PermissionResponse => ({
  id: permission.id,
  key: permission.key,
  name: permission.name,
  description: permission.description,
  resource: permission.resource,
  action: permission.action,
});

const toRoleResponse = (role: RoleWithPermissions): RoleResponse => ({
  id: role.id,
  organizationId: role.organizationId,
  name: role.name,
  description: role.description,
  isSystem: role.isSystem,
  createdAt: role.createdAt,
  updatedAt: role.updatedAt,
  permissions: role.permissions
    .filter(({ permission }) => permission.deletedAt === null)
    .map(({ permission }) => toPermissionResponse(permission))
    .sort((left, right) => left.key.localeCompare(right.key)),
});

const isOwnerOrAdmin = (user: RbacUserRecord): boolean => {
  return user.roles.some(({ role }) => role.deletedAt === null && (role.name === "Owner" || role.name === "Admin"));
};

export class RbacService {
  public async listRoles(input: { actorUserId: string; organizationId: string }): Promise<RoleResponse[]> {
    await this.prepareOrganization(input.organizationId);
    await this.assertCanReadRoles(input.actorUserId, input.organizationId);
    const roles = await rbacRepository.findRolesByOrganization(input.organizationId);
    return roles.map(toRoleResponse);
  }

  public async createRole(input: {
    actorUserId: string;
    organizationId: string;
    data: RoleCreateInput;
    metadata: RequestMetadata;
  }): Promise<RoleResponse> {
    await this.prepareOrganization(input.organizationId);
    await this.assertCanManageRoles(input.actorUserId, input.organizationId);
    await this.assertPermissionsExist(input.data.permissionIds ?? []);

    try {
      const role = await rbacRepository.createRole(input);
      return toRoleResponse(role);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError({ statusCode: 409, message: "Role name already exists.", code: "ROLE_NAME_CONFLICT" });
      }
      throw error;
    }
  }

  public async getRole(input: { actorUserId: string; organizationId: string; roleId: string }): Promise<RoleResponse> {
    await this.prepareOrganization(input.organizationId);
    await this.assertCanReadRoles(input.actorUserId, input.organizationId);
    const role = await rbacRepository.findRoleByIdInOrganization({ roleId: input.roleId, organizationId: input.organizationId });

    if (role === null) {
      throw new AppError({ statusCode: 404, message: "Role not found.", code: "ROLE_NOT_FOUND" });
    }

    return toRoleResponse(role);
  }

  public async updateRole(input: {
    actorUserId: string;
    organizationId: string;
    roleId: string;
    data: RoleUpdateInput;
    metadata: RequestMetadata;
  }): Promise<RoleResponse> {
    await this.prepareOrganization(input.organizationId);
    await this.assertCanManageRoles(input.actorUserId, input.organizationId);
    await this.assertRoleExists(input.roleId, input.organizationId);

    try {
      const role = await rbacRepository.updateRole(input);
      return toRoleResponse(role);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError({ statusCode: 409, message: "Role name already exists.", code: "ROLE_NAME_CONFLICT" });
      }
      throw error;
    }
  }

  public async deleteRole(input: { actorUserId: string; organizationId: string; roleId: string; metadata: RequestMetadata }): Promise<void> {
    await this.prepareOrganization(input.organizationId);
    await this.assertCanManageRoles(input.actorUserId, input.organizationId);
    const role = await this.assertRoleExists(input.roleId, input.organizationId);

    if (role.isSystem) {
      throw new AppError({ statusCode: 400, message: "System roles cannot be deleted.", code: "ROLE_SYSTEM_DELETE_FORBIDDEN" });
    }

    await rbacRepository.deleteRole(input);
  }

  public async listPermissions(): Promise<PermissionResponse[]> {
    await rbacRepository.upsertPermissions(permissions);
    const records = await rbacRepository.findPermissions();
    return records.map(toPermissionResponse);
  }

  public async updateRolePermissions(input: {
    actorUserId: string;
    organizationId: string;
    roleId: string;
    data: PermissionAssignmentInput;
    metadata: RequestMetadata;
  }): Promise<RoleResponse> {
    await this.prepareOrganization(input.organizationId);
    await this.assertCanManageRoles(input.actorUserId, input.organizationId);
    await this.assertRoleExists(input.roleId, input.organizationId);
    await this.assertPermissionsExist(input.data.permissionIds);
    const role = await rbacRepository.updateRolePermissions(input);
    return toRoleResponse(role);
  }

  public async getUserRoles(input: { actorUserId: string; organizationId: string; targetUserId: string }): Promise<UserRoleResponse> {
    await this.prepareOrganization(input.organizationId);
    await this.assertCanReadRoles(input.actorUserId, input.organizationId);
    const user = await rbacRepository.findUserByIdInOrganization({ userId: input.targetUserId, organizationId: input.organizationId });

    if (user === null) {
      throw new AppError({ statusCode: 404, message: "User not found.", code: "USER_NOT_FOUND" });
    }

    return {
      userId: user.id,
      roles: user.roles.map(({ role }) => toRoleResponse(role)).sort((left, right) => left.name.localeCompare(right.name)),
    };
  }

  public async updateUserRoles(input: {
    actorUserId: string;
    organizationId: string;
    targetUserId: string;
    data: UserRoleAssignmentInput;
    metadata: RequestMetadata;
  }): Promise<UserRoleResponse> {
    await this.prepareOrganization(input.organizationId);
    await this.assertCanManageRoles(input.actorUserId, input.organizationId);
    const user = await rbacRepository.findUserByIdInOrganization({ userId: input.targetUserId, organizationId: input.organizationId });

    if (user === null) {
      throw new AppError({ statusCode: 404, message: "User not found.", code: "USER_NOT_FOUND" });
    }

    const roles = await Promise.all(
      input.data.roleIds.map((roleId) => rbacRepository.findRoleByIdInOrganization({ roleId, organizationId: input.organizationId })),
    );

    if (roles.some((role) => role === null)) {
      throw new AppError({ statusCode: 400, message: "One or more roles are invalid.", code: "ROLE_INVALID_ASSIGNMENT" });
    }

    const updatedUser = await rbacRepository.updateUserRoles(input);

    return {
      userId: updatedUser.id,
      roles: updatedUser.roles.map(({ role }) => toRoleResponse(role)).sort((left, right) => left.name.localeCompare(right.name)),
    };
  }

  private async prepareOrganization(organizationId: string): Promise<void> {
    const organization = await rbacRepository.findOrganizationById(organizationId);

    if (organization === null || organization.deletedAt !== null) {
      throw new AppError({ statusCode: 404, message: "Organization not found.", code: "ORGANIZATION_NOT_FOUND" });
    }

    await rbacRepository.upsertPermissions(permissions);
    await rbacRepository.ensureDefaultRoles({ organizationId, rolePermissions: defaultRolePermissions });
  }

  private async assertCanReadRoles(userId: string, organizationId: string): Promise<RbacUserRecord> {
    const user = await rbacRepository.findUserByIdInOrganization({ userId, organizationId });

    if (user === null || user.status !== "ACTIVE") {
      throw new AppError({ statusCode: 403, message: "You do not have permission to access roles.", code: "RBAC_PERMISSION_DENIED" });
    }

    const canRead = isOwnerOrAdmin(user) || user.roles.some(({ role }) => {
      return role.permissions.some(({ permission }) => permission.deletedAt === null && permission.key === "roles.read");
    });

    if (!canRead) {
      throw new AppError({ statusCode: 403, message: "You do not have permission to access roles.", code: "RBAC_PERMISSION_DENIED" });
    }

    return user;
  }

  private async assertCanManageRoles(userId: string, organizationId: string): Promise<RbacUserRecord> {
    const user = await rbacRepository.findUserByIdInOrganization({ userId, organizationId });

    if (user === null || user.status !== "ACTIVE" || !isOwnerOrAdmin(user)) {
      throw new AppError({ statusCode: 403, message: "Only Owner or Admin can manage roles.", code: "RBAC_PERMISSION_DENIED" });
    }

    return user;
  }

  private async assertRoleExists(roleId: string, organizationId: string): Promise<RoleWithPermissions> {
    const role = await rbacRepository.findRoleByIdInOrganization({ roleId, organizationId });

    if (role === null) {
      throw new AppError({ statusCode: 404, message: "Role not found.", code: "ROLE_NOT_FOUND" });
    }

    return role;
  }

  private async assertPermissionsExist(permissionIds: string[]): Promise<void> {
    if (permissionIds.length === 0) {
      return;
    }

    const permissionsInDatabase = await rbacRepository.findPermissions();
    const validPermissionIds = new Set(permissionsInDatabase.map((permission) => permission.id));

    if (permissionIds.some((permissionId) => !validPermissionIds.has(permissionId))) {
      throw new AppError({ statusCode: 400, message: "One or more permissions are invalid.", code: "PERMISSION_INVALID_ASSIGNMENT" });
    }
  }
}

export const rbacService = new RbacService();