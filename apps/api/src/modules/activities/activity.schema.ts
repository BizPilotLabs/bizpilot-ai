import { z } from "zod";

export const listActivitiesQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(160).optional(),
  action: z.string().trim().min(1).max(120).optional(),
  resource: z.string().trim().min(1).max(120).optional(),
  userId: z.string().uuid().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export const activityIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export type ListActivitiesQuerySchema = z.infer<typeof listActivitiesQuerySchema>;