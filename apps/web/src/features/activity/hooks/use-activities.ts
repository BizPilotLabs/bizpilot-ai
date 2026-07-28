import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { activityService } from "../services";
import type { ActivityListQuery } from "../types";
import { activityQueryKeys } from "./activity-query-keys";

export function useActivities(query: ActivityListQuery = {}) {
  return useQuery({
    queryKey: activityQueryKeys.list(query),
    queryFn: () => activityService.getActivities(query),
    placeholderData: keepPreviousData,
    staleTime: 20_000
  });
}

export function useActivity(activityId: string | null) {
  return useQuery({
    queryKey: activityId === null ? activityQueryKeys.details() : activityQueryKeys.detail(activityId),
    queryFn: () => activityService.getActivityById(activityId ?? ""),
    enabled: activityId !== null,
    staleTime: 60_000
  });
}
