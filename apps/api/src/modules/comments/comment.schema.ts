import { z } from "zod";

export const listCommentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("asc"),
});

export const taskCommentParamsSchema = z.object({
  taskId: z.string().uuid(),
});

export const commentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export const updateCommentSchema = z.object({
  content: z.string().trim().min(1).max(5000),
});

export type ListCommentsQuerySchema = z.infer<typeof listCommentsQuerySchema>;
export type CreateCommentSchema = z.infer<typeof createCommentSchema>;
export type UpdateCommentSchema = z.infer<typeof updateCommentSchema>;