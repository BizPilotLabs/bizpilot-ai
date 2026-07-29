import { z } from "zod";

export const aiScopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("organization"), entityId: z.string().optional() }),
  z.object({ type: z.literal("project"), entityId: z.string().uuid("Enter a valid project ID.") }),
  z.object({ type: z.literal("task"), entityId: z.string().uuid("Enter a valid task ID.") })
]);

export const aiQuestionSchema = z.object({
  question: z.string().trim().min(1, "Ask a question first.").max(1000, "Question must be 1,000 characters or fewer."),
  scope: aiScopeSchema
});

export type AiQuestionFormValues = z.infer<typeof aiQuestionSchema>;
