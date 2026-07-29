import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const environmentSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().max(65535).default(4000),
  HOST: z.string().min(1).default("0.0.0.0"),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_ISSUER: z.string().min(1).default("bizpilot-ai"),
  JWT_AUDIENCE: z.string().min(1).default("bizpilot-ai-api"),
  JWT_ACCESS_TOKEN_EXPIRES_IN: z.string().min(1).default("15m"),
  REFRESH_TOKEN_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
  SESSION_EXPIRES_IN_DAYS: z.coerce.number().int().positive().default(30),
  REFRESH_TOKEN_COOKIE_NAME: z.string().min(1).default("bizpilot_refresh_token"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:3000"),
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  STORAGE_PROVIDER: z.enum(["disabled", "r2"]).default("disabled"),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_PRESIGNED_UPLOAD_EXPIRES_SECONDS: z.coerce.number().int().positive().max(3600).default(600),
  R2_PRESIGNED_DOWNLOAD_EXPIRES_SECONDS: z.coerce.number().int().positive().max(3600).default(300),
  AI_ENABLED: z.coerce.boolean().default(false),
  AI_PROVIDER: z.enum(["disabled", "ollama"]).default("disabled"),
  AI_MODEL: z.string().min(1).default("llama3.2"),
  AI_OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(30_000),
  AI_MAX_CONTEXT_CHARS: z.coerce.number().int().positive().max(60_000).default(16_000),
  AI_MAX_OUTPUT_CHARS: z.coerce.number().int().positive().max(12_000).default(6_000),
  AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
}).superRefine((value, context) => {
  if (value.AI_ENABLED && value.AI_PROVIDER === "disabled") {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["AI_PROVIDER"], message: "AI_PROVIDER must not be disabled when AI_ENABLED is true." });
  }

  if (value.STORAGE_PROVIDER !== "r2") {
    return;
  }

  for (const key of ["R2_ACCOUNT_ID", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "R2_BUCKET_NAME"] as const) {
    if (value[key] === undefined || value[key]?.trim().length === 0) {
      context.addIssue({ code: z.ZodIssueCode.custom, path: [key], message: `${key} is required when STORAGE_PROVIDER is r2.` });
    }
  }
});

export type Environment = z.infer<typeof environmentSchema>;

const parseEnvironment = (): Environment => {
  const result = environmentSchema.safeParse(process.env);

  if (!result.success) {
    const formattedErrors = result.error.issues.map((issue) => ({
      path: issue.path.join("."),
      message: issue.message,
    }));

    throw new Error(`Invalid environment configuration: ${JSON.stringify(formattedErrors)}`);
  }

  return result.data;
};

export const env = parseEnvironment();

