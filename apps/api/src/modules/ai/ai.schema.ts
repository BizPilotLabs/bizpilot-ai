import { z } from "zod";

export const aiLimits = {
  questionMaxLength: 1000,
  historyMessageMaxLength: 1200,
  historyMaxMessages: 6,
  answerMaxLength: 6000,
  contextMaxCharacters: 16000,
  projectsLimit: 8,
  tasksLimit: 12,
  commentsLimit: 8,
  attachmentsLimit: 8,
  activitiesLimit: 8,
  usersLimit: 10,
  textFieldMaxLength: 700
} as const;

const scopeSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("organization"), entityId: z.never().optional() }),
  z.object({ type: z.literal("project"), entityId: z.string().uuid() }),
  z.object({ type: z.literal("task"), entityId: z.string().uuid() })
]);

const conversationMessageSchema = z.object({
  role: z.enum(["user", "assistant"]),
  content: z.string().trim().min(1).max(aiLimits.historyMessageMaxLength)
});

export const aiCopilotRequestSchema = z.object({
  question: z.string().trim().min(1, "Question is required.").max(aiLimits.questionMaxLength),
  scope: scopeSchema.default({ type: "organization" }),
  history: z.array(conversationMessageSchema).max(aiLimits.historyMaxMessages).optional()
});

export type AiCopilotRequestSchema = z.infer<typeof aiCopilotRequestSchema>;
