import { Prisma } from "@prisma/client";
import { z } from "zod";

const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]);
const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

const nullableStringSchema = (max: number): z.ZodEffects<z.ZodUnion<[z.ZodString, z.ZodLiteral<"">, z.ZodNull]>, string | null, string | null> => {
  return z.union([z.string().trim().max(max), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));
};

const nullableDateSchema = z.union([z.coerce.date(), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));
const nullableUuidSchema = z.union([z.string().uuid(), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));
const decimalSchema = z.coerce.number().nonnegative().max(999999.99).transform((value) => new Prisma.Decimal(value));
const nullableDecimalSchema = z.union([decimalSchema, z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <T extends z.ZodRawShape>(schema: z.ZodObject<T>): z.ZodEffects<z.ZodObject<T>> => {
  return schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), { message: "At least one field must be provided." });
};

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  search: z.string().trim().min(1).max(120).optional(),
  sort: z.enum(["asc", "desc"]).default("desc"),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  overdue: z.coerce.boolean().optional(),
});

export const taskIdParamsSchema = z.object({ id: z.string().uuid() });

export const createTaskSchema = z.object({
  projectId: z.string().uuid(),
  title: z.string().trim().min(1).max(200),
  description: nullableStringSchema(5000).optional(),
  status: taskStatusSchema.default("TODO"),
  priority: taskPrioritySchema.default("MEDIUM"),
  dueDate: nullableDateSchema.optional(),
  assigneeId: nullableUuidSchema.optional(),
  estimatedHours: nullableDecimalSchema.optional(),
  actualHours: nullableDecimalSchema.optional(),
  archived: z.boolean().default(false),
});

export const updateTaskSchema = requireAtLeastOneField(z.object({
  title: z.string().trim().min(1).max(200).optional(),
  description: nullableStringSchema(5000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: nullableDateSchema.optional(),
  assigneeId: nullableUuidSchema.optional(),
  estimatedHours: nullableDecimalSchema.optional(),
  actualHours: nullableDecimalSchema.optional(),
  archived: z.boolean().optional(),
}));

export const updateTaskStatusSchema = z.object({ status: taskStatusSchema });
export const updateTaskAssigneeSchema = z.object({ assigneeId: nullableUuidSchema });
export type ListTasksQuerySchema = z.infer<typeof listTasksQuerySchema>;
export type CreateTaskSchema = z.infer<typeof createTaskSchema>;
export type UpdateTaskSchema = z.infer<typeof updateTaskSchema>;