import { env } from "./env.js";

export const config = {
  nodeEnv: env.NODE_ENV,
  isProduction: env.NODE_ENV === "production",
  isTest: env.NODE_ENV === "test",
  port: env.PORT,
  host: env.HOST,
  databaseUrl: env.DATABASE_URL,
  jwtSecret: env.JWT_SECRET,
  jwtIssuer: env.JWT_ISSUER,
  jwtAudience: env.JWT_AUDIENCE,
  jwtAccessTokenExpiresIn: env.JWT_ACCESS_TOKEN_EXPIRES_IN,
  refreshTokenExpiresInDays: env.REFRESH_TOKEN_EXPIRES_IN_DAYS,
  sessionExpiresInDays: env.SESSION_EXPIRES_IN_DAYS,
  refreshTokenCookieName: env.REFRESH_TOKEN_COOKIE_NAME,
  corsOrigin: env.CORS_ORIGIN,
  logLevel: env.LOG_LEVEL,
  shutdownTimeoutMs: env.SHUTDOWN_TIMEOUT_MS,
} as const;