export interface ApiSuccessResponse<TData> {
  success: true;
  data: TData;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    message: string;
    code: string;
    details?: unknown;
  };
}

export type OrganizationPlan = "FREE" | "STARTER" | "PROFESSIONAL" | "ENTERPRISE";

export interface OrganizationProfile {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  timezone: string;
  country: string | null;
  currency: string;
  plan: OrganizationPlan;
  createdAt: string;
  updatedAt: string;
}

export interface OrganizationResponse {
  organization: OrganizationProfile;
}

export interface UpdateOrganizationInput {
  name?: string;
  logo?: string | null;
  timezone?: string;
  country?: string | null;
  currency?: string;
}

export interface UpdateOrganizationSettingsInput {
  timezone?: string;
  currency?: string;
}
