import { z } from "zod";

export const commentSortDirectionSchema = z.enum(["asc", "desc"]);

export const commentListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  sort: commentSortDirectionSchema.optional()
});

export const commentContentSchema = z.object({
  content: z.string().trim().min(1, "Comment cannot be empty.").max(5000, "Comment must be 5,000 characters or fewer.")
});

export type CommentListQueryValues = z.infer<typeof commentListQuerySchema>;
export type CommentContentValues = z.infer<typeof commentContentSchema>;