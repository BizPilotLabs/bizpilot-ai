import type { Organization, Permission, Role, User } from "@prisma/client";
import type { Request } from "express";

export interface RegisterInput {
  organizationName: string;
  organizationSlug: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  timezone?: string | undefined;
  country?: string | undefined;
  currency?: string | undefined;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface RefreshTokenPayload {
  token: string;
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  avatar: string | null;
  phone: string | null;
  status: User["status"];
  emailVerified: boolean;
  lastLoginAt: Date | null;
  organizationId: string;
}

export interface AuthenticatedOrganization {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string;
  country: string | null;
  currency: string;
  plan: Organization["plan"];
}

export interface AuthenticatedRole {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
}

export interface AuthenticatedPermission {
  id: string;
  key: string;
  name: string;
  resource: string;
  action: string;
}

export interface AuthContext {
  userId: string;
  organizationId: string;
  sessionId: string;
  tokenVersion: number;
}

export interface AuthenticatedRequest extends Request {
  auth: AuthContext;
}

export interface AuthenticatedPrincipal {
  user: AuthenticatedUser;
  organization: AuthenticatedOrganization;
  roles: AuthenticatedRole[];
  permissions: AuthenticatedPermission[];
}

export interface AuthResult extends AuthenticatedPrincipal {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface RefreshResult {
  accessToken: string;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
}

export interface JwtAccessPayload {
  sub: string;
  organizationId: string;
  sessionId: string;
  email: string;
  roles: string[];
  tokenVersion: number;
}

export interface UserWithAuthRelations extends User {
  organization: Organization;
  roles: {
    role: Role & {
      permissions: {
        permission: Permission;
      }[];
    };
  }[];
}