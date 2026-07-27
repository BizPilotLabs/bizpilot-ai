import { z } from "zod";

const emailSchema = z.string().trim().email().max(320).transform((email) => email.toLowerCase());

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

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1).max(100),
  lastName: z.string().trim().min(1).max(100),
  email: emailSchema,
  password: z.string().min(12).max(72),
  roleIds: z.array(z.string().uuid()).min(1).max(20),
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
export type CreateUserSchema = z.infer<typeof createUserSchema>;
export type UpdateUserSchema = z.infer<typeof updateUserSchema>;
