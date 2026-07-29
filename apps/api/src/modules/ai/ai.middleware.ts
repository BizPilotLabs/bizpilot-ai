import type { NextFunction, Request, RequestHandler, Response } from "express";
import { env } from "../../config/index.js";
import { AppError } from "../../core/errors/index.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

interface RateLimitBucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, RateLimitBucket>();

export const aiRateLimit: RequestHandler = (request: Request, _response: Response, next: NextFunction): void => {
  const authenticatedRequest = request as AuthenticatedRequest;
  const now = Date.now();
  const key = `${authenticatedRequest.auth.organizationId}:${authenticatedRequest.auth.userId}`;
  const existing = buckets.get(key);

  if (existing === undefined || existing.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + env.AI_RATE_LIMIT_WINDOW_MS });
    next();
    return;
  }

  if (existing.count >= env.AI_RATE_LIMIT_MAX_REQUESTS) {
    next(new AppError({ statusCode: 429, message: "AI request limit exceeded. Please try again later.", code: "AI_RATE_LIMIT_EXCEEDED" }));
    return;
  }

  existing.count += 1;
  next();
};

export const resetAiRateLimitForTests = (): void => {
  buckets.clear();
};
