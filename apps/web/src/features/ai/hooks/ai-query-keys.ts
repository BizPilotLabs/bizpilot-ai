export const aiQueryKeys = {
  all: ["ai"] as const,
  health: () => [...aiQueryKeys.all, "health"] as const
};
