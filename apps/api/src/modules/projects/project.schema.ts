import { z } from "zod";

const projectStatusSchema = z.enum(["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"]);

const nullableStringSchema = (max: number): z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">, z.ZodNull]>, string | null, string | null> => {
  return z.union([z.string().trim().max(max), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));
};

const nullableDateSchema = z
  .union([z.coerce.date(), z.literal(""), z.null()])
  .transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodEffects<z.ZodObject<T>> => {
  return schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided.",
  });
};

export const listProjectsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
  status: projectStatusSchema.optional(),
  archived: z.coerce.boolean().optional(),
});

export const projectIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(160),
  description: nullableStringSchema(5000).optional(),
  status: projectStatusSchema.default("PLANNED"),
  startDate: nullableDateSchema.optional(),
  endDate: nullableDateSchema.optional(),
  color: nullableStringSchema(32).optional(),
  archived: z.boolean().default(false),
});

export const updateProjectSchema = requireAtLeastOneField(
  z.object({
    name: z.string().trim().min(1).max(160).optional(),
    description: nullableStringSchema(5000).optional(),
    status: projectStatusSchema.optional(),
    startDate: nullableDateSchema.optional(),
    endDate: nullableDateSchema.optional(),
    color: nullableStringSchema(32).optional(),
    archived: z.boolean().optional(),
  }),
);

export type ListProjectsQuerySchema = z.infer<typeof listProjectsQuerySchema>;
export type ProjectIdParamsSchema = z.infer<typeof projectIdParamsSchema>;
export type CreateProjectSchema = z.infer<typeof createProjectSchema>;
export type UpdateProjectSchema = z.infer<typeof updateProjectSchema>;