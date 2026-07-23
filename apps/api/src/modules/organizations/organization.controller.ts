import type { Response } from "express";

import { organizationService } from "./organization.service.js";
import { updateOrganizationSchema, updateOrganizationSettingsSchema } from "./organization.schema.js";
import type { OrganizationRequest, RequestMetadata } from "./organization.types.js";

interface SuccessResponse<T> {
  success: true;
  data: T;
}

const toMetadata = (request: OrganizationRequest): RequestMetadata => ({
  ipAddress: request.ip,
  userAgent: request.get("user-agent"),
});

const sendSuccess = <T>(response: Response, statusCode: number, data: T): void => {
  const body: SuccessResponse<T> = {
    success: true,
    data,
  };

  response.status(statusCode).json(body);
};

export class OrganizationController {
  public async getCurrentOrganization(request: OrganizationRequest, response: Response): Promise<void> {
    const organization = await organizationService.getCurrentOrganization({
      userId: request.auth.userId,
      organizationId: request.auth.organizationId,
    });

    sendSuccess(response, 200, { organization });
  }

  public async updateCurrentOrganization(request: OrganizationRequest, response: Response): Promise<void> {
    const input = updateOrganizationSchema.parse(request.body);
    const organization = await organizationService.updateCurrentOrganization({
      userId: request.auth.userId,
      organizationId: request.auth.organizationId,
      data: input,
      metadata: toMetadata(request),
    });

    sendSuccess(response, 200, { organization });
  }

  public async updateCurrentOrganizationSettings(request: OrganizationRequest, response: Response): Promise<void> {
    const input = updateOrganizationSettingsSchema.parse(request.body);
    const organization = await organizationService.updateCurrentOrganizationSettings({
      userId: request.auth.userId,
      organizationId: request.auth.organizationId,
      data: input,
      metadata: toMetadata(request),
    });

    sendSuccess(response, 200, { organization });
  }
}

export const organizationController = new OrganizationController();