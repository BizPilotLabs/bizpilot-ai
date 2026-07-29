import type { NextFunction, Request, RequestHandler, Response } from "express";
import { createAiError } from "./ai.failure.js";
import { aiRateLimitStore, applyAiRateLimitHeaders, resetAiRateLimitStoreForTests } from "./ai.rate-limit.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

export const aiRateLimit: RequestHandler = (request: Request, response: Response, next: NextFunction): void => {
  const authenticatedRequest = request as AuthenticatedRequest;

  void aiRateLimitStore.consume({ userId: authenticatedRequest.auth.userId, organizationId: authenticatedRequest.auth.organizationId })
    .then((result) => {
      applyAiRateLimitHeaders(response, result);
      if (!result.allowed) {
        next(createAiError("AI_RATE_LIMIT_EXCEEDED"));
        return;
      }
      next();
    })
    .catch(() => {
      next(createAiError("AI_CONTEXT_UNAVAILABLE"));
    });
};

export const resetAiRateLimitForTests = (): void => {
  resetAiRateLimitStoreForTests();
};
