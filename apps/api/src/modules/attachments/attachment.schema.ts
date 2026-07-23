import { z } from "zod";

export const maximumAttachmentSizeBytes = 25 * 1024 * 1024;

export const allowedAttachmentMimeTypes = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
  "image/png",
  "image/jpeg",
] as const;

const allowedMimeTypeSchema = z.enum(allowedAttachmentMimeTypes);

export const listAttachmentsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sort: z.enum(["asc", "desc"]).default("desc"),
});

export const taskAttachmentParamsSchema = z.object({
  taskId: z.string().uuid(),
});

export const attachmentIdParamsSchema = z.object({
  id: z.string().uuid(),
});

export const createAttachmentSchema = z.object({
  originalName: z.string().trim().min(1).max(255),
  storedName: z.string().trim().min(1).max(255),
  mimeType: allowedMimeTypeSchema,
  fileSize: z.coerce.number().int().positive().max(maximumAttachmentSizeBytes),
  storagePath: z.string().trim().min(1).max(2048),
});

export type ListAttachmentsQuerySchema = z.infer<typeof listAttachmentsQuerySchema>;
export type CreateAttachmentSchema = z.infer<typeof createAttachmentSchema>;