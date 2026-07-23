import { z } from "zod";

const nullableStringSchema = (max: number) => {
  return z.union([z.string().trim().max(max), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));
};

const nullableUuidSchema = z.union([z.string().uuid(), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodEffects<z.ZodObject<T>> => {
  return schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), { message: "At least one field must be provided." });
};

export const listTeamsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
  archived: z.coerce.boolean().optional(),
});

export const teamIdParamsSchema = z.object({ id: z.string().uuid() });

export const teamMemberParamsSchema = z.object({
  id: z.string().uuid(),
  userId: z.string().uuid(),
});

export const createTeamSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: nullableStringSchema(5000).optional(),
  color: nullableStringSchema(32).optional(),
  leadId: nullableUuidSchema.optional(),
  archived: z.boolean().default(false),
});

export const updateTeamSchema = requireAtLeastOneField(z.object({
  name: z.string().trim().min(1).max(160).optional(),
  description: nullableStringSchema(5000).optional(),
  color: nullableStringSchema(32).optional(),
  leadId: nullableUuidSchema.optional(),
  archived: z.boolean().optional(),
}));

export const addTeamMemberSchema = z.object({
  userId: z.string().uuid(),
});

export type ListTeamsQuerySchema = z.infer<typeof listTeamsQuerySchema>;
export type CreateTeamSchema = z.infer<typeof createTeamSchema>;
export type UpdateTeamSchema = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberSchema = z.infer<typeof addTeamMemberSchema>;