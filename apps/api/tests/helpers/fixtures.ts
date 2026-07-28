import type { OrganizationPlan, Role, UserStatus } from "@prisma/client";
import type { OrganizationUser } from "../../src/modules/organizations/organization.types.js";
import type { RbacUserRecord, RoleWithPermissions } from "../../src/modules/rbac/rbac.types.js";
import type { UserRecord } from "../../src/modules/users/user.types.js";

export const ids = {
  organizationA: "11111111-1111-4111-8111-111111111111",
  organizationB: "22222222-2222-4222-8222-222222222222",
  ownerUser: "33333333-3333-4333-8333-333333333333",
  adminUser: "44444444-4444-4444-8444-444444444444",
  memberUser: "55555555-5555-4555-8555-555555555555",
  targetUser: "66666666-6666-4666-8666-666666666666",
  ownerRole: "77777777-7777-4777-8777-777777777777",
  adminRole: "88888888-8888-4888-8888-888888888888",
  memberRole: "99999999-9999-4999-8999-999999999999",
  customRole: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  permissionReadUsers: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
  permissionUpdateOrg: "cccccccc-cccc-4ccc-8ccc-cccccccccccc"
} as const;

const now = new Date("2026-01-01T00:00:00.000Z");

export const organization = {
  id: ids.organizationA,
  name: "BizPilot Test",
  slug: "bizpilot-test",
  logo: null,
  timezone: "UTC",
  country: "US",
  currency: "USD",
  plan: "FREE" as OrganizationPlan,
  createdAt: now,
  updatedAt: now,
  deletedAt: null
};

export const permission = (overrides: Partial<RoleWithPermissions["permissions"][number]["permission"]> = {}): RoleWithPermissions["permissions"][number]["permission"] => ({
  id: ids.permissionReadUsers,
  key: "users.read",
  name: "Read users",
  description: "Read users permission.",
  resource: "users",
  action: "read",
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  ...overrides
});

export const role = (overrides: Partial<RoleWithPermissions> = {}): RoleWithPermissions => ({
  id: ids.customRole,
  organizationId: ids.organizationA,
  name: "Manager",
  description: "Manager role",
  isSystem: false,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  permissions: [{ permission: permission() }],
  _count: { users: 0 },
  ...overrides
});

export const prismaRole = (overrides: Partial<Role> = {}): Role => ({
  id: ids.customRole,
  organizationId: ids.organizationA,
  name: "Member",
  description: "Member role",
  isSystem: false,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  ...overrides
});

export const user = (overrides: Partial<UserRecord> = {}): UserRecord => ({
  id: ids.memberUser,
  email: "member@example.com",
  firstName: "Maya",
  lastName: "Member",
  avatar: null,
  phone: null,
  status: "ACTIVE" as UserStatus,
  emailVerified: true,
  lastLoginAt: null,
  organizationId: ids.organizationA,
  createdAt: now,
  updatedAt: now,
  deletedAt: null,
  roles: [{ role: role({ id: ids.memberRole, name: "Member", isSystem: true }) }],
  ...overrides
});

export const ownerUser = (): UserRecord => user({
  id: ids.ownerUser,
  email: "owner@example.com",
  roles: [{ role: role({ id: ids.ownerRole, name: "Owner", isSystem: true }) }]
});

export const adminUser = (): UserRecord => user({
  id: ids.adminUser,
  email: "admin@example.com",
  roles: [{ role: role({ id: ids.adminRole, name: "Admin", isSystem: true }) }]
});

export const organizationUser = (overrides: Partial<OrganizationUser> = {}): OrganizationUser => ({
  ...user(),
  roles: [{ role: role({ permissions: [{ permission: permission({ key: "organizations.update", resource: "organizations", action: "update" }) }] }) }],
  ...overrides
});

export const rbacUser = (overrides: Partial<RbacUserRecord> = {}): RbacUserRecord => ({
  id: ids.ownerUser,
  organizationId: ids.organizationA,
  status: "ACTIVE",
  deletedAt: null,
  roles: [{ role: role({ id: ids.ownerRole, name: "Owner", isSystem: true }) }],
  ...overrides
});
