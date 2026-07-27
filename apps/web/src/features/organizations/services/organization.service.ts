import { httpClient } from "@/services";
import type { ApiSuccessResponse, OrganizationResponse, OrganizationProfile, UpdateOrganizationInput, UpdateOrganizationSettingsInput } from "../types";

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

const toPayload = <TInput extends UpdateOrganizationInput | UpdateOrganizationSettingsInput>(input: TInput): Record<string, unknown> => {
  const payload: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(input)) {
    if (value !== undefined) {
      payload[key] = value;
    }
  }

  return payload;
};

export const organizationService = {
  async getCurrentOrganization(): Promise<OrganizationProfile> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<OrganizationResponse>>("/organizations/me"));
    return result.organization;
  },

  async updateOrganization(input: UpdateOrganizationInput): Promise<OrganizationProfile> {
    const result = unwrap(await httpClient.put<ApiSuccessResponse<OrganizationResponse>>("/organizations/me", toPayload(input)));
    return result.organization;
  },

  async updateOrganizationSettings(input: UpdateOrganizationSettingsInput): Promise<OrganizationProfile> {
    const result = unwrap(await httpClient.patch<ApiSuccessResponse<OrganizationResponse>>("/organizations/me/settings", toPayload(input)));
    return result.organization;
  },

  async updateOrganizationLogo(logo: string | null): Promise<OrganizationProfile> {
    const result = unwrap(await httpClient.put<ApiSuccessResponse<OrganizationResponse>>("/organizations/me", { logo }));
    return result.organization;
  }
};
