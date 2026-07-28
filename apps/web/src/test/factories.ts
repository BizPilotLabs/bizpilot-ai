import type { AuthPermission, AuthRole, AuthUser } from "@/features/auth";
import type { OrganizationProfile } from "@/features/organizations";
import type { Role } from "@/features/rbac";
import type { UserProfile } from "@/features/users";

export const ids = {
  organization: "11111111-1111-4111-8111-111111111111",
  user: "22222222-2222-4222-8222-222222222222",
  role: "33333333-3333-4333-8333-333333333333",
  permission: "44444444-4444-4444-8444-444444444444"
} as const;

export const now = "2026-01-01T00:00:00.000Z";

export const authUser = (overrides: Partial<AuthUser> = {}): AuthUser => ({
  id: ids.user,
  email: "owner@example.com",
  firstName: "Ava",
  lastName: "Owner",
  avatar: null,
  phone: null,
  status: "ACTIVE",
  emailVerified: true,
  lastLoginAt: null,
  organizationId: ids.organization,
  ...overrides
});

export const organization = (overrides: Partial<OrganizationProfile> = {}): OrganizationProfile => ({
  id: ids.organization,
  name: "BizPilot Test",
  slug: "bizpilot-test",
  logo: null,
  timezone: "UTC",
  country: "US",
  currency: "USD",
  plan: "FREE",
  createdAt: now,
  updatedAt: now,
  ...overrides
});

export const authRole = (overrides: Partial<AuthRole> = {}): AuthRole => ({
  id: ids.role,
  name: "Owner",
  description: "Owner role",
  isSystem: true,
  ...overrides
});

export const authPermission = (key = "users.read", overrides: Partial<AuthPermission> = {}): AuthPermission => {
  const [resource = "users", action = "read"] = key.split(".");
  return {
    id: `${ids.permission.slice(0, -1)}${Math.min(key.length, 9)}`,
    key,
    name: key,
    resource,
    action,
    ...overrides
  };
};

export const userProfile = (overrides: Partial<UserProfile> = {}): UserProfile => ({
  id: ids.user,
  email: "ava@example.com",
  firstName: "Ava",
  lastName: "Admin",
  avatar: null,
  phone: null,
  status: "ACTIVE",
  emailVerified: true,
  lastLoginAt: null,
  organizationId: ids.organization,
  createdAt: now,
  updatedAt: now,
  roles: [{ id: ids.role, name: "Owner", description: "Owner role", isSystem: true }],
  ...overrides
});

export const rbacRole = (overrides: Partial<Role> = {}): Role => ({
  id: ids.role,
  organizationId: ids.organization,
  name: "Manager",
  description: "Manages delivery",
  isSystem: false,
  userCount: 0,
  createdAt: now,
  updatedAt: now,
  permissions: [
    { id: ids.permission, key: "users.read", name: "Read users", description: "Read users permission.", resource: "users", action: "read" }
  ],
  ...overrides
});
