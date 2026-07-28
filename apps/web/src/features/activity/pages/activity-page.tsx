import { type ReactElement, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Alert, Pagination } from "@/components/ui";
import { useAuthStore } from "@/store";
import { ActivityDetailsDialog, ActivityEmptyState, ActivityErrorState, ActivityFilters, ActivityList, ActivityLoadingState, ActivityPageHeader, type ActivityFilterValues } from "../components";
import { getActivityErrorMessage, useActivities } from "../hooks";
import type { Activity, ActivityListQuery } from "../types";

const defaultFilters: ActivityFilterValues = {
  search: "",
  action: "",
  resource: "",
  startDate: "",
  endDate: "",
  sort: "desc"
};

const hasElevatedRole = (roleNames: string[]): boolean => roleNames.includes("Owner") || roleNames.includes("Admin");
const hasPermission = (permissionKeys: string[], permissionKey: string): boolean => permissionKeys.includes(permissionKey);

const getFilterValues = (searchParams: URLSearchParams): ActivityFilterValues => ({
  search: searchParams.get("search") ?? "",
  action: searchParams.get("action") ?? "",
  resource: searchParams.get("resource") ?? "",
  startDate: searchParams.get("startDate") ?? "",
  endDate: searchParams.get("endDate") ?? "",
  sort: searchParams.get("sort") === "asc" ? "asc" : "desc"
});

const toApiDate = (date: string, endOfDay = false): string | undefined => {
  if (date.length === 0) return undefined;
  return `${date}T${endOfDay ? "23:59:59.999" : "00:00:00.000"}Z`;
};

const toQuery = (filters: ActivityFilterValues, page: number): ActivityListQuery => {
  const query: ActivityListQuery = {
    page,
    limit: 12,
    sort: filters.sort
  };

  if (filters.search.length > 0) query.search = filters.search;
  if (filters.action.length > 0) query.action = filters.action;
  if (filters.resource.length > 0) query.resource = filters.resource;

  const startDate = toApiDate(filters.startDate);
  const endDate = toApiDate(filters.endDate, true);
  if (startDate !== undefined) query.startDate = startDate;
  if (endDate !== undefined) query.endDate = endDate;

  return query;
};

const hasActiveFilters = (filters: ActivityFilterValues): boolean =>
  filters.search.length > 0 || filters.action.length > 0 || filters.resource.length > 0 || filters.startDate.length > 0 || filters.endDate.length > 0 || filters.sort !== "desc";

export function ActivityPage(): ReactElement {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedActivity, setSelectedActivity] = useState<Activity | null>(null);
  const roles = useAuthStore((state) => state.roles);
  const permissions = useAuthStore((state) => state.permissions);
  const roleNames = useMemo(() => roles.map((role) => role.name), [roles]);
  const permissionKeys = useMemo(() => permissions.map((permission) => permission.key), [permissions]);
  const canRead = hasElevatedRole(roleNames) || hasPermission(permissionKeys, "activities.read");
  const filters = useMemo(() => getFilterValues(searchParams), [searchParams]);
  const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
  const activitiesQuery = useActivities(toQuery(filters, page));
  const activities = activitiesQuery.data?.activities ?? [];
  const pagination = activitiesQuery.data?.pagination;

  const setFilters = (nextFilters: ActivityFilterValues): void => {
    const next = new URLSearchParams();
    for (const [key, value] of Object.entries(nextFilters)) {
      if (value.length > 0 && !(key === "sort" && value === "desc")) {
        next.set(key, value);
      }
    }
    next.set("page", "1");
    setSearchParams(next);
  };

  const setPage = (nextPage: number): void => {
    const next = new URLSearchParams(searchParams);
    next.set("page", String(nextPage));
    setSearchParams(next);
  };

  if (!canRead) {
    return <Alert variant="danger" title="Access denied">You do not have permission to view organization activity.</Alert>;
  }

  return (
    <div className="grid gap-6">
      <ActivityPageHeader />
      <ActivityFilters values={filters} onChange={setFilters} onClear={() => setFilters(defaultFilters)} />
      {activitiesQuery.isLoading ? <ActivityLoadingState /> : null}
      {activitiesQuery.isError ? <ActivityErrorState message={getActivityErrorMessage(activitiesQuery.error)} isRetrying={activitiesQuery.isFetching} onRetry={() => void activitiesQuery.refetch()} /> : null}
      {activitiesQuery.isSuccess && activities.length === 0 ? <ActivityEmptyState filtered={hasActiveFilters(filters)} /> : null}
      {activitiesQuery.isSuccess && activities.length > 0 ? <ActivityList activities={activities} onViewDetails={setSelectedActivity} /> : null}
      {activitiesQuery.isSuccess && pagination && pagination.totalPages > 1 ? (
        <Pagination className="justify-center" page={pagination.page} totalPages={pagination.totalPages} onPageChange={setPage} />
      ) : null}
      <ActivityDetailsDialog activity={selectedActivity} open={selectedActivity !== null} onOpenChange={(open) => !open && setSelectedActivity(null)} />
    </div>
  );
}

