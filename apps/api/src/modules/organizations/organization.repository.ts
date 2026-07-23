import type { Organization, Prisma } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { OrganizationSettingsInput, OrganizationUpdateInput, OrganizationUser, RequestMetadata } from "./organization.types.js";

const organizationUserInclude = {
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

const toOrganizationUpdateData = (input: OrganizationUpdateInput): Prisma.OrganizationUpdateInput => {
  const data: Prisma.OrganizationUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name;
  }

  if (input.logo !== undefined) {
    data.logo = input.logo;
  }

  if (input.timezone !== undefined) {
    data.timezone = input.timezone;
  }

  if (input.country !== undefined) {
    data.country = input.country;
  }

  if (input.currency !== undefined) {
    data.currency = input.currency;
  }

  return data;
};

const toOrganizationSettingsData = (input: OrganizationSettingsInput): Prisma.OrganizationUpdateInput => {
  const data: Prisma.OrganizationUpdateInput = {};

  if (input.timezone !== undefined) {
    data.timezone = input.timezone;
  }

  if (input.currency !== undefined) {
    data.currency = input.currency;
  }

  return data;
};

export class OrganizationRepository {
  public async findOrganizationById(organizationId: string): Promise<Organization | null> {
    return prisma.organization.findUnique({
      where: { id: organizationId },
    });
  }

  public async findOrganizationUser(input: { userId: string; organizationId: string }): Promise<OrganizationUser | null> {
    return prisma.user.findFirst({
      where: {
        id: input.userId,
        organizationId: input.organizationId,
        deletedAt: null,
      },
      include: organizationUserInclude,
    }) as Promise<OrganizationUser | null>;
  }

  public async updateOrganization(input: {
    organizationId: string;
    actorUserId: string;
    data: OrganizationUpdateInput;
    metadata: RequestMetadata;
  }): Promise<Organization> {
    return prisma.$transaction(async (transaction) => {
      const organization = await transaction.organization.update({
        where: { id: input.organizationId },
        data: toOrganizationUpdateData(input.data),
      });

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "organization.update",
          resource: "organization",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: {
            fields: Object.keys(input.data).filter((key) => input.data[key as keyof OrganizationUpdateInput] !== undefined),
          },
        },
      });

      return organization;
    });
  }

  public async updateOrganizationSettings(input: {
    organizationId: string;
    actorUserId: string;
    data: OrganizationSettingsInput;
    metadata: RequestMetadata;
  }): Promise<Organization> {
    return prisma.$transaction(async (transaction) => {
      const organization = await transaction.organization.update({
        where: { id: input.organizationId },
        data: toOrganizationSettingsData(input.data),
      });

      await transaction.auditLog.create({
        data: {
          userId: input.actorUserId,
          organizationId: input.organizationId,
          action: "organization.settings.update",
          resource: "organization",
          ipAddress: input.metadata.ipAddress ?? null,
          userAgent: input.metadata.userAgent ?? null,
          metadata: {
            fields: Object.keys(input.data).filter((key) => input.data[key as keyof OrganizationSettingsInput] !== undefined),
          },
        },
      });

      return organization;
    });
  }
}

export const organizationRepository = new OrganizationRepository();