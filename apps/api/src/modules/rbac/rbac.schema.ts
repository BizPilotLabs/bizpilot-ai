import { z } from "zod";

const nullableDescriptionSchema = z
  .union([z.string().trim().max(500), z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodEffects<z.ZodObject<T>> => {
  return schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided.",
  });
};

export const roleIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const userIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createRoleSchema = z.object({
  name: z.string().trim().min(2).max(120),
  description: nullableDescriptionSchema.optional(),
  permissionIds: z.array(z.string().uuid()).default([]),
});

export const updateRoleSchema = requireAtLeastOneField(
  z.object({
    name: z.string().trim().min(2).max(120).optional(),
    description: nullableDescriptionSchema.optional(),
  }),
);

export const updateRolePermissionsSchema = z.object({
  permissionIds: z.array(z.string().uuid()),
});

export const updateUserRolesSchema = z.object({
  roleIds: z.array(z.string().uuid()),
});

export type CreateRoleSchema = z.infer<typeof createRoleSchema>;
export type UpdateRoleSchema = z.infer<typeof updateRoleSchema>;
export type UpdateRolePermissionsSchema = z.infer<typeof updateRolePermissionsSchema>;
export type UpdateUserRolesSchema = z.infer<typeof updateUserRolesSchema>;