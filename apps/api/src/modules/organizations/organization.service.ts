import { AppError } from "../../core/errors/index.js";
import { organizationRepository } from "./organization.repository.js";
import type {
  OrganizationProfile,
  OrganizationSettingsInput,
  OrganizationUpdateInput,
  OrganizationUser,
  RequestMetadata,
} from "./organization.types.js";

const toOrganizationProfile = (organization: {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string;
  country: string | null;
  currency: string;
  plan: OrganizationProfile["plan"];
  createdAt: Date;
  updatedAt: Date;
}): OrganizationProfile => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  logo: organization.logo,
  timezone: organization.timezone,
  country: organization.country,
  currency: organization.currency,
  plan: organization.plan,
  createdAt: organization.createdAt,
  updatedAt: organization.updatedAt,
});

const hasOrganizationManagePermission = (user: OrganizationUser): boolean => {
  return user.roles.some(({ role }) => {
    if (role.deletedAt !== null) {
      return false;
    }

    if (role.name === "Owner" || role.name === "Admin") {
      return true;
    }

    return role.permissions.some(({ permission }) => permission.deletedAt === null && permission.key === "organizations.manage");
  });
};

export class OrganizationService {
  public async getCurrentOrganization(input: { userId: string; organizationId: string }): Promise<OrganizationProfile> {
    const [organization, user] = await Promise.all([
      organizationRepository.findOrganizationById(input.organizationId),
      organizationRepository.findOrganizationUser(input),
    ]);

    if (organization === null || organization.deletedAt !== null || user === null) {
      throw new AppError({
        statusCode: 404,
        message: "Organization not found.",
        code: "ORGANIZATION_NOT_FOUND",
      });
    }

    return toOrganizationProfile(organization);
  }

  public async updateCurrentOrganization(input: {
    userId: string;
    organizationId: string;
    data: OrganizationUpdateInput;
    metadata: RequestMetadata;
  }): Promise<OrganizationProfile> {
    await this.assertCanManageOrganization(input.userId, input.organizationId);

    const organization = await organizationRepository.updateOrganization({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      data: input.data,
      metadata: input.metadata,
    });

    return toOrganizationProfile(organization);
  }

  public async updateCurrentOrganizationSettings(input: {
    userId: string;
    organizationId: string;
    data: OrganizationSettingsInput;
    metadata: RequestMetadata;
  }): Promise<OrganizationProfile> {
    await this.assertCanManageOrganization(input.userId, input.organizationId);

    const organization = await organizationRepository.updateOrganizationSettings({
      organizationId: input.organizationId,
      actorUserId: input.userId,
      data: input.data,
      metadata: input.metadata,
    });

    return toOrganizationProfile(organization);
  }

  private async assertCanManageOrganization(userId: string, organizationId: string): Promise<void> {
    const [organization, user] = await Promise.all([
      organizationRepository.findOrganizationById(organizationId),
      organizationRepository.findOrganizationUser({ userId, organizationId }),
    ]);

    if (organization === null || organization.deletedAt !== null || user === null) {
      throw new AppError({
        statusCode: 404,
        message: "Organization not found.",
        code: "ORGANIZATION_NOT_FOUND",
      });
    }

    if (user.status !== "ACTIVE") {
      throw new AppError({
        statusCode: 403,
        message: "User is not active.",
        code: "ORGANIZATION_USER_INACTIVE",
      });
    }

    if (!hasOrganizationManagePermission(user)) {
      throw new AppError({
        statusCode: 403,
        message: "You do not have permission to update this organization.",
        code: "ORGANIZATION_PERMISSION_DENIED",
      });
    }
  }
}

export const organizationService = new OrganizationService();