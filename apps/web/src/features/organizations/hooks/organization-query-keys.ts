export const organizationQueryKeys = {
  all: ["organizations"] as const,
  current: () => [...organizationQueryKeys.all, "current"] as const
};
