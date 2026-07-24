import { z } from "zod";

export const projectStatusSchema = z.enum(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]);
export const projectSortDirectionSchema = z.enum(["asc", "desc"]);

const nullableStringSchema = (max: number) =>
  z.union([z.string().trim().max(max), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));

const nullableDateSchema = z.union([z.string().datetime(), z.date(), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>) =>
  schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided."
  });

export const projectListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sort: projectSortDirectionSchema.optional(),
  status: projectStatusSchema.optional(),
  archived: z.boolean().optional()
});

export const projectIdSchema = z.string().uuid("Project id must be a valid UUID.");

export const createProjectSchema = z.object({
  name: z.string().trim().min(1, "Project name is required.").max(160, "Project name is too long."),
  description: nullableStringSchema(5000).optional(),
  status: projectStatusSchema.optional(),
  startDate: nullableDateSchema.optional(),
  endDate: nullableDateSchema.optional(),
  color: nullableStringSchema(32).optional(),
  archived: z.boolean().optional()
});

export const updateProjectSchema = requireAtLeastOneField(
  z.object({
    name: z.string().trim().min(1, "Project name is required.").max(160, "Project name is too long.").optional(),
    description: nullableStringSchema(5000).optional(),
    status: projectStatusSchema.optional(),
    startDate: nullableDateSchema.optional(),
    endDate: nullableDateSchema.optional(),
    color: nullableStringSchema(32).optional(),
    archived: z.boolean().optional()
  })
);

export type ProjectListQueryValues = z.infer<typeof projectListQuerySchema>;
export type CreateProjectValues = z.infer<typeof createProjectSchema>;
export type UpdateProjectValues = z.infer<typeof updateProjectSchema>;

