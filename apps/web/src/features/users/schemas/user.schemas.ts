import { z } from "zod";

export const userSortDirectionSchema = z.enum(["asc", "desc"]);

const emailSchema = z.string().trim().email("Enter a valid email address.").max(320, "Email is too long.").transform((email) => email.toLowerCase());
const roleIdsSchema = z.array(z.string().uuid("Role id must be a valid UUID.")).min(1, "Select at least one role.").max(20, "Select fewer roles.");

const nullableAvatarSchema = z
  .union([z.string().trim().url("Avatar must be a valid URL.").max(2048, "Avatar URL is too long."), z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>) =>
  schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided."
  });

export const userListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sort: userSortDirectionSchema.optional()
});

export const createUserSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name.").max(100, "First name is too long."),
  lastName: z.string().trim().min(1, "Enter a last name.").max(100, "Last name is too long."),
  email: emailSchema,
  password: z.string().min(12, "Password must be at least 12 characters.").max(72, "Password cannot exceed 72 characters."),
  roleIds: roleIdsSchema
});

export const updateUserSchema = requireAtLeastOneField(
  z.object({
    firstName: z.string().trim().min(1, "Enter a first name.").max(100, "First name is too long.").optional(),
    lastName: z.string().trim().min(1, "Enter a last name.").max(100, "Last name is too long.").optional(),
    avatar: nullableAvatarSchema.optional()
  })
);

export const updateUserRolesSchema = z.object({
  roleIds: roleIdsSchema
});

export type CreateUserValues = z.infer<typeof createUserSchema>;
export type UpdateUserValues = z.infer<typeof updateUserSchema>;
export type UpdateUserRolesValues = z.infer<typeof updateUserRolesSchema>;
