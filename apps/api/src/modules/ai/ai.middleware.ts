import crypto from "node:crypto";
import type { NextFunction, Request, RequestHandler, Response } from "express";
import { metricsClient } from "../../core/metrics/index.js";
import { createAiError } from "./ai.failure.js";
import { aiRateLimitStore, applyAiRateLimitHeaders, isRedisRateLimitFailure, resetAiRateLimitStoreForTests } from "./ai.rate-limit.js";
import { aiRepository } from "./ai.repository.js";
import type { AiScopeInput } from "./ai.types.js";
import type { AuthenticatedRequest } from "../auth/auth.types.js";

const safeScope = (body: unknown): AiScopeInput => {
  if (typeof body !== "object" || body === null || !("scope" in body)) return { type: "organization" };
  const scope = (body as { scope?: unknown }).scope;
  if (typeof scope !== "object" || scope === null || !("type" in scope)) return { type: "organization" };
  const type = (scope as { type?: unknown }).type;
  const entityId = (scope as { entityId?: unknown }).entityId;
  if ((type === "project" || type === "task") && typeof entityId === "string") return { type, entityId };
  return { type: "organization" };
};

const recordLimiterRejection = async (request: AuthenticatedRequest, resultCategory: string): Promise<void> => {
  const scope = safeScope(request.body);
  await aiRepository.recordUsage({
    userId: request.auth.userId,
    organizationId: request.auth.organizationId,
    action: "ai.query.failed",
    ...(request.ip === undefined ? {} : { ipAddress: request.ip }),
    ...(request.get("user-agent") === undefined ? {} : { userAgent: request.get("user-agent") as string }),
    metadata: {
      requestId: request.get("x-request-id") ?? crypto.randomUUID(),
      scopeType: scope.type,
      scopeEntityId: scope.entityId ?? null,
      provider: null,
      model: null,
      durationMs: 0,
      durationCategory: "fast",
      sourceCount: 0,
      resultCategory,
      success: false,
      inputTokens: null,
      outputTokens: null,
      totalTokens: null
    }
  });
};

export const aiRateLimit: RequestHandler = (request: Request, response: Response, next: NextFunction): void => {
  const authenticatedRequest = request as AuthenticatedRequest;

  void aiRateLimitStore.consume({ userId: authenticatedRequest.auth.userId, organizationId: authenticatedRequest.auth.organizationId })
    .then(async (result) => {
      metricsClient.recordAiRateLimit({ store: result.store, dimension: result.dimension, outcome: result.allowed ? "allowed" : "rejected" });
      applyAiRateLimitHeaders(response, result);
      if (!result.allowed) {
        await recordLimiterRejection(authenticatedRequest, "rate_limited");
        next(createAiError("AI_RATE_LIMIT_EXCEEDED"));
        return;
      }
      next();
    })
    .catch((error: unknown) => {
      metricsClient.recordAiRateLimit({ store: isRedisRateLimitFailure(error) ? "redis" : "memory", dimension: "organization", outcome: "failed" });
      void recordLimiterRejection(authenticatedRequest, isRedisRateLimitFailure(error) ? "rate_limit_store_unavailable" : "context_unavailable")
        .finally(() => {
          next(createAiError(isRedisRateLimitFailure(error) ? "AI_RATE_LIMIT_STORE_UNAVAILABLE" : "AI_CONTEXT_UNAVAILABLE"));
        });
    });
};

export const resetAiRateLimitForTests = (): void => {
  resetAiRateLimitStoreForTests();
};

