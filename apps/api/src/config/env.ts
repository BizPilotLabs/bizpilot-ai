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