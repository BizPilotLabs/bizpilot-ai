import { z } from "zod";

export const taskStatusSchema = z.enum(["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"]);
export const taskPrioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);
export const taskSortDirectionSchema = z.enum(["asc", "desc"]);

const nullableStringSchema = (max: number) =>
  z.union([z.string().trim().max(max), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));

const nullableDateSchema = z.union([z.string().datetime(), z.date(), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));
const nullableUuidSchema = z.union([z.string().uuid(), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));
const decimalValueSchema = z.union([z.number().nonnegative().max(999999.99), z.string().trim().min(1), z.literal(""), z.null()]).transform((value) => (value === "" ? null : value));

const requireAtLeastOneField = <TShape extends z.ZodRawShape>(schema: z.ZodObject<TShape>) =>
  schema.refine((value) => Object.values(value).some((fieldValue) => fieldValue !== undefined), {
    message: "At least one field must be provided."
  });

export const taskListQuerySchema = z.object({
  page: z.number().int().positive().optional(),
  limit: z.number().int().positive().max(100).optional(),
  search: z.string().trim().min(1).max(120).optional(),
  sort: taskSortDirectionSchema.optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  assigneeId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  overdue: z.boolean().optional()
});

export const taskIdSchema = z.string().uuid("Task id must be a valid UUID.");

export const createTaskSchema = z.object({
  projectId: z.string().uuid("Project id must be a valid UUID."),
  title: z.string().trim().min(1, "Task title is required.").max(200, "Task title is too long."),
  description: nullableStringSchema(5000).optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  dueDate: nullableDateSchema.optional(),
  assigneeId: nullableUuidSchema.optional(),
  estimatedHours: decimalValueSchema.optional(),
  actualHours: decimalValueSchema.optional(),
  archived: z.boolean().optional()
});

export const updateTaskSchema = requireAtLeastOneField(
  z.object({
    title: z.string().trim().min(1, "Task title is required.").max(200, "Task title is too long.").optional(),
    description: nullableStringSchema(5000).optional(),
    status: taskStatusSchema.optional(),
    priority: taskPrioritySchema.optional(),
    dueDate: nullableDateSchema.optional(),
    assigneeId: nullableUuidSchema.optional(),
    estimatedHours: decimalValueSchema.optional(),
    actualHours: decimalValueSchema.optional(),
    archived: z.boolean().optional()
  })
);

export const updateTaskStatusSchema = z.object({ status: taskStatusSchema });
export const updateTaskAssigneeSchema = z.object({ assigneeId: nullableUuidSchema });

export type TaskListQueryValues = z.infer<typeof taskListQuerySchema>;
export type CreateTaskValues = z.infer<typeof createTaskSchema>;
export type UpdateTaskValues = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusValues = z.infer<typeof updateTaskStatusSchema>;
export type UpdateTaskAssigneeValues = z.infer<typeof updateTaskAssigneeSchema>;

