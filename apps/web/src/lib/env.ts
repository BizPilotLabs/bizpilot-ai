import { z } from "zod";

const envSchema = z.object({
  VITE_API_BASE_URL: z.string().trim().url().default("http://localhost:4000"),
  VITE_APP_NAME: z.string().trim().min(1).default("BizPilot AI")
});

const parsedEnv = envSchema.safeParse(import.meta.env);

if (!parsedEnv.success) {
  throw new Error("Invalid frontend environment configuration.");
}

export const env = {
  apiBaseUrl: parsedEnv.data.VITE_API_BASE_URL,
  appName: parsedEnv.data.VITE_APP_NAME
} as const;

