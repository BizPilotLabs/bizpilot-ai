import { motion } from "framer-motion";
import { type ReactElement, useMemo } from "react";
import { Alert } from "@/components/ui";
import { pageTransition } from "@/lib";
import { useAuthStore } from "@/store";
import { getOrganizationErrorMessage, useCurrentOrganization } from "../hooks";
import {
  OrganizationEmptyState,
  OrganizationErrorState,
  OrganizationLoadingState,
  OrganizationPageHeader,
  OrganizationProfileForm,
  OrganizationSettingsForm,
  OrganizationSummaryCard
} from "../components";

const hasElevatedRole = (roleNames: string[]): boolean => roleNames.includes("Owner") || roleNames.includes("Admin");

export function OrganizationPage(): ReactElement {
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const organizationQuery = useCurrentOrganization();
  const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);
  const permissionKeys = useMemo(() => permissions.map((permission) => permission.key), [permissions]);
  const canManage = hasElevatedRole(roleNames) || permissionKeys.includes("organizations.update") || permissionKeys.includes("organizations.manage");
  const organization = organizationQuery.data ?? null;

  return (
    <motion.div className="grid gap-6" variants={pageTransition} initial="hidden" animate="visible">
      <OrganizationPageHeader organization={organization} />
      {!canManage ? (
        <Alert variant="warning" title="Read-only access">
          You can view organization settings, but only Owner/Admin users or users with organization update permission can make changes.
        </Alert>
      ) : null}
      {organizationQuery.isLoading ? <OrganizationLoadingState /> : null}
      {organizationQuery.isError ? (
        <OrganizationErrorState
          message={getOrganizationErrorMessage(organizationQuery.error)}
          isRetrying={organizationQuery.isFetching}
          onRetry={() => {
            void organizationQuery.refetch();
          }}
        />
      ) : null}
      {organizationQuery.isSuccess && organization === null ? <OrganizationEmptyState /> : null}
      {organization ? (
        <div className="grid gap-6 xl:grid-cols-[0.85fr_1.15fr] xl:items-start">
          <div className="xl:sticky xl:top-24">
            <OrganizationSummaryCard organization={organization} />
          </div>
          <div className="grid gap-6">
            <OrganizationProfileForm organization={organization} canManage={canManage} />
            <OrganizationSettingsForm organization={organization} canManage={canManage} />
          </div>
        </div>
      ) : null}
    </motion.div>
  );
}
