import type { ActivityListQuery } from "../types";

export const activityQueryKeys = {
  all: ["activities"] as const,
  lists: () => [...activityQueryKeys.all, "list"] as const,
  list: (query: ActivityListQuery = {}) => [...activityQueryKeys.lists(), query] as const,
  details: () => [...activityQueryKeys.all, "detail"] as const,
  detail: (activityId: string) => [...activityQueryKeys.details(), activityId] as const
};
