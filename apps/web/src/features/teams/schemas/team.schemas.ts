import { z } from "zod";

export const teamSortDirectionSchema = z.enum(["asc", "desc"]);

const nullableStringSchema = (max: number) =>
  z.union([z.string().trim().max(max), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));

const nullableUuidSchema = z.union([z.string().uuid(), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>) =>
  schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided."
  });

export const teamListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sort: teamSortDirectionSchema.optional(),
  archived: z.boolean().optional()
});

export const teamIdSchema = z.string().uuid("Team id must be a valid UUID.");
export const teamMemberUserIdSchema = z.string().uuid("User id must be a valid UUID.");

export const createTeamSchema = z.object({
  name: z.string().trim().min(1, "Team name is required.").max(160, "Team name is too long."),
  description: nullableStringSchema(5000).optional(),
  color: nullableStringSchema(32).optional(),
  leadId: nullableUuidSchema.optional(),
  archived: z.boolean().optional()
});

export const updateTeamSchema = requireAtLeastOneField(
  z.object({
    name: z.string().trim().min(1, "Team name is required.").max(160, "Team name is too long.").optional(),
    description: nullableStringSchema(5000).optional(),
    color: nullableStringSchema(32).optional(),
    leadId: nullableUuidSchema.optional(),
    archived: z.boolean().optional()
  })
);

export const addTeamMemberSchema = z.object({
  userId: teamMemberUserIdSchema
});

export type TeamListQueryValues = z.infer<typeof teamListQuerySchema>;
export type CreateTeamValues = z.infer<typeof createTeamSchema>;
export type UpdateTeamValues = z.infer<typeof updateTeamSchema>;
export type AddTeamMemberValues = z.infer<typeof addTeamMemberSchema>;
