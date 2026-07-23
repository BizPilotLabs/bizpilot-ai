import type { Organization, Permission, Role, User } from "@prisma/client";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string;
  country: string | null;
  currency: string;
  plan: Organization["plan"];
  createdAt: Date;
  updatedAt: Date;
}

export interface OrganizationUpdateInput {
  name?: string | undefined;
  logo?: string | null | undefined;
  timezone?: string | undefined;
  country?: string | null | undefined;
  currency?: string | undefined;
}

export interface OrganizationSettingsInput {
  timezone?: string | undefined;
  currency?: string | undefined;
}

export interface RequestMetadata {
  ipAddress: string | undefined;
  userAgent: string | undefined;
}

export interface OrganizationUser extends User {
  roles: {
    role: Role & {
      permissions: {
        permission: Permission;
      }[];
    };
  }[];
}

export type OrganizationRequest = AuthenticatedRequest;