import { z } from "zod";

const nullableDescriptionSchema = z
  .union([z.string().trim().max(500, "Description is too long."), z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));

const permissionIdsSchema = z.array(z.string().uuid("Permission id must be a valid UUID."));
const reservedRoleNames = new Set(["owner", "admin", "manager", "member"]);

const requireAtLeastOneField = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>) =>
  schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided."
  });

const roleNameSchema = z
  .string()
  .trim()
  .min(2, "Role name must be at least 2 characters.")
  .max(120, "Role name is too long.")
  .refine((value) => !reservedRoleNames.has(value.toLowerCase()), "System role names are reserved.");

export const createRoleSchema = z.object({
  name: roleNameSchema,
  description: nullableDescriptionSchema.optional(),
  permissionIds: permissionIdsSchema.default([])
});

export const updateRoleSchema = requireAtLeastOneField(
  z.object({
    name: roleNameSchema.optional(),
    description: nullableDescriptionSchema.optional()
  })
);

export const rolePermissionsSchema = z.object({
  permissionIds: permissionIdsSchema
});

export type CreateRoleValues = z.infer<typeof createRoleSchema>;
export type UpdateRoleValues = z.infer<typeof updateRoleSchema>;
export type RolePermissionsValues = z.infer<typeof rolePermissionsSchema>;
