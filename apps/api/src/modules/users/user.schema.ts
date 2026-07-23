import { z } from "zod";

const nullableAvatarSchema = z
  .union([z.string().trim().url().max(2048), z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodEffects<z.ZodObject<T>> => {
  return schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided.",
  });
};

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const updateUserSchema = requireAtLeastOneField(
  z.object({
    firstName: z.string().trim().min(1).max(100).optional(),
    lastName: z.string().trim().min(1).max(100).optional(),
    avatar: nullableAvatarSchema.optional(),
  }),
);

export type ListUsersQuerySchema = z.infer<typeof listUsersQuerySchema>;
export type UserIdParamsSchema = z.infer<typeof userIdParamsSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;