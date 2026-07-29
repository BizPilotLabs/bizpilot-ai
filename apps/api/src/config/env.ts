import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const booleanSchema = z.preprocess((value) => {
  if (typeof value !== "string") return value;
  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off", ""].includes(normalized)) return false;
  return value;
}, z.boolean());

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
  METRICS_ENABLED: booleanSchema.default(false),
  METRICS_PATH: z.string().trim().regex(/^\/[a-zA-Z0-9/_-]*$/u).default("/metrics"),
  METRICS_AUTH_TOKEN: z.string().min(24).optional(),
  METRICS_DEFAULT_METRICS_ENABLED: booleanSchema.default(true),
  METRICS_PREFIX: z.string().trim().min(1).max(32).regex(/^[a-zA-Z_:][a-zA-Z0-9_:]*$/u).default("bizpilot"),
  SHUTDOWN_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  STORAGE_PROVIDER: z.enum(["disabled", "r2"]).default("disabled"),
  R2_ACCOUNT_ID: z.string().min(1).optional(),
  R2_ACCESS_KEY_ID: z.string().min(1).optional(),
  R2_SECRET_ACCESS_KEY: z.string().min(1).optional(),
  R2_BUCKET_NAME: z.string().min(1).optional(),
  R2_ENDPOINT: z.string().url().optional(),
  R2_PRESIGNED_UPLOAD_EXPIRES_SECONDS: z.coerce.number().int().positive().max(3600).default(600),
  R2_PRESIGNED_DOWNLOAD_EXPIRES_SECONDS: z.coerce.number().int().positive().max(3600).default(300),
  ATTACHMENT_EXTRACTION_ENABLED: booleanSchema.default(true),
  ATTACHMENT_EXTRACTION_MAX_FILE_BYTES: z.coerce.number().int().positive().max(25 * 1024 * 1024).default(8 * 1024 * 1024),
  ATTACHMENT_EXTRACTION_MAX_TEXT_CHARS: z.coerce.number().int().positive().max(200_000).default(60_000),
  ATTACHMENT_EXTRACTION_TIMEOUT_MS: z.coerce.number().int().positive().max(60_000).default(15_000),
  ATTACHMENT_EXTRACTION_WORKER_CONCURRENCY: z.coerce.number().int().positive().max(4).default(1),
  ATTACHMENT_EXTRACTION_WORKER_QUEUE_SIZE: z.coerce.number().int().positive().max(100).default(25),
  REDIS_ENABLED: booleanSchema.default(false),
  REDIS_URL: z.string().url().optional(),
  REDIS_CONNECT_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(5_000),
  REDIS_COMMAND_TIMEOUT_MS: z.coerce.number().int().positive().max(10_000).default(1_000),
  REDIS_HEALTH_CACHE_TTL_MS: z.coerce.number().int().positive().max(300_000).default(30_000),
  REDIS_MAX_RECONNECT_ATTEMPTS: z.coerce.number().int().min(0).max(20).default(3),
  REDIS_KEY_PREFIX: z.string().trim().min(1).max(48).regex(/^[a-zA-Z0-9:_-]+$/u).default("bizpilot"),
  REDIS_REQUIRED_IN_PRODUCTION: booleanSchema.default(false),
  AI_ENABLED: booleanSchema.default(false),
  AI_PROVIDER: z.enum(["disabled", "ollama"]).default("disabled"),
  AI_MODEL: z.string().min(1).default("llama3.2"),
  AI_OLLAMA_BASE_URL: z.string().url().default("http://localhost:11434"),
  AI_REQUEST_TIMEOUT_MS: z.coerce.number().int().positive().max(120_000).default(30_000),
  AI_MAX_CONTEXT_CHARS: z.coerce.number().int().positive().max(60_000).default(16_000),
  AI_MAX_OUTPUT_CHARS: z.coerce.number().int().positive().max(12_000).default(6_000),
  AI_RATE_LIMIT_STORE: z.enum(["memory", "redis"]).default("memory"),
  AI_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  AI_RATE_LIMIT_MAX_REQUESTS: z.coerce.number().int().positive().default(20),
  AI_RATE_LIMIT_MAX_ORGANIZATION_REQUESTS: z.coerce.number().int().positive().default(200),
  AI_HEALTH_CACHE_TTL_MS: z.coerce.number().int().positive().max(300_000).default(60_000),
  AI_HEALTH_TIMEOUT_MS: z.coerce.number().int().positive().max(30_000).default(3_000),
}).superRefine((value, context) => {
  if (value.METRICS_ENABLED && (value.METRICS_AUTH_TOKEN === undefined || value.METRICS_AUTH_TOKEN.trim().length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["METRICS_AUTH_TOKEN"], message: "METRICS_AUTH_TOKEN is required when metrics are enabled." });
  }

  if (value.AI_RATE_LIMIT_STORE === "redis" && (value.REDIS_URL === undefined || value.REDIS_URL.trim().length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["REDIS_URL"], message: "REDIS_URL is required when AI_RATE_LIMIT_STORE is redis." });
  }

  if (value.REDIS_REQUIRED_IN_PRODUCTION && value.NODE_ENV === "production" && (value.REDIS_URL === undefined || value.REDIS_URL.trim().length === 0)) {
    context.addIssue({ code: z.ZodIssueCode.custom, path: ["REDIS_URL"], message: "REDIS_URL is required when REDIS_REQUIRED_IN_PRODUCTION is true in production." });
  }

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





