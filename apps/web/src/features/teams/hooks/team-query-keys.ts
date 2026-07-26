import type { TeamListQuery } from "../types";

export const teamQueryKeys = {
  all: ["teams"] as const,
  lists: () => [...teamQueryKeys.all, "list"] as const,
  list: (query: TeamListQuery = {}) => [...teamQueryKeys.lists(), query] as const,
  details: () => [...teamQueryKeys.all, "detail"] as const,
  detail: (teamId: string) => [...teamQueryKeys.details(), teamId] as const,
  members: () => [...teamQueryKeys.all, "members"] as const,
  teamMembers: (teamId: string) => [...teamQueryKeys.members(), teamId] as const
};
