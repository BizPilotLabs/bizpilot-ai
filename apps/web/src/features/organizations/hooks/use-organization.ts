import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store";
import { organizationService } from "../services";
import type { OrganizationProfile, UpdateOrganizationInput, UpdateOrganizationSettingsInput } from "../types";
import { organizationQueryKeys } from "./organization-query-keys";

const toAuthOrganization = (organization: OrganizationProfile) => ({
  id: organization.id,
  name: organization.name,
  slug: organization.slug,
  logo: organization.logo,
  timezone: organization.timezone,
  country: organization.country,
  currency: organization.currency,
  plan: organization.plan
});

const syncOrganization = (organization: OrganizationProfile): void => {
  useAuthStore.getState().setOrganization(toAuthOrganization(organization));
};

export function useCurrentOrganization() {
  return useQuery({
    queryKey: organizationQueryKeys.current(),
    queryFn: () => organizationService.getCurrentOrganization(),
    staleTime: 60_000
  });
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationInput) => organizationService.updateOrganization(input),
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationQueryKeys.current(), organization);
      syncOrganization(organization);
    }
  });
}

export function useUpdateOrganizationSettings() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: UpdateOrganizationSettingsInput) => organizationService.updateOrganizationSettings(input),
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationQueryKeys.current(), organization);
      syncOrganization(organization);
    }
  });
}

export function useUpdateOrganizationLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logo: string | null) => organizationService.updateOrganizationLogo(logo),
    onSuccess: (organization) => {
      queryClient.setQueryData(organizationQueryKeys.current(), organization);
      syncOrganization(organization);
    }
  });
}
