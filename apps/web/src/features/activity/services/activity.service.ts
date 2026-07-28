import { httpClient } from "@/services";
import type { Activity, ActivityDetailResponse, ActivityListQuery, ActivityListResult, ApiSuccessResponse } from "../types";

const unwrap = <TData>(response: { data: ApiSuccessResponse<TData> }): TData => response.data.data;

const toQueryParams = (query: ActivityListQuery = {}): URLSearchParams => {
  const params = new URLSearchParams();

  if (query.page !== undefined) params.set("page", String(query.page));
  if (query.limit !== undefined) params.set("limit", String(query.limit));
  if (query.search !== undefined && query.search.trim().length > 0) params.set("search", query.search.trim());
  if (query.action !== undefined && query.action.trim().length > 0) params.set("action", query.action.trim());
  if (query.resource !== undefined && query.resource.trim().length > 0) params.set("resource", query.resource.trim());
  if (query.userId !== undefined && query.userId.trim().length > 0) params.set("userId", query.userId.trim());
  if (query.startDate !== undefined && query.startDate.trim().length > 0) params.set("startDate", query.startDate);
  if (query.endDate !== undefined && query.endDate.trim().length > 0) params.set("endDate", query.endDate);
  if (query.sort !== undefined) params.set("sort", query.sort);

  return params;
};

export const activityService = {
  async getActivities(query: ActivityListQuery = {}): Promise<ActivityListResult> {
    const params = toQueryParams(query);
    return unwrap(await httpClient.get<ApiSuccessResponse<ActivityListResult>>("/activities", { params }));
  },

  async getActivityById(activityId: string): Promise<Activity> {
    const result = unwrap(await httpClient.get<ApiSuccessResponse<ActivityDetailResponse>>(`/activities/${activityId}`));
    return result.activity;
  }
};
