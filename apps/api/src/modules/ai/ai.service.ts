import crypto from "node:crypto";
import { performance } from "node:perf_hooks";

import { env } from "../../config/index.js";
import { AppError } from "../../core/errors/index.js";
import { logger } from "../../core/logger/index.js";
import { aiContextBuilder, hasAiPermission } from "./ai.context.js";
import { aiProvider } from "./ai.provider.js";
import { buildAiPrompt } from "./ai.prompt.js";
import { aiRepository } from "./ai.repository.js";
import { aiLimits } from "./ai.schema.js";
import type { AiCopilotRequestInput, AiCopilotResponse, AiRequestMetadata, AiScopeInput, AiSourceReference } from "./ai.types.js";

const writeIntentPattern = /\b(create|update|edit|delete|remove|archive|restore|assign|unassign|upload|invite|change|modify|revoke|grant|disable|enable)\b/iu;

const readonlyRefusal = "I cannot perform create, update, delete, archive, assignment, upload, invitation, role, or other write actions. I can answer read-only questions from authorized BizPilot data and explain where you can make changes in the app.";

const providerUnavailableMetadata = { provider: "disabled", model: "disabled" };

const validateAnswer = (answer: string, sources: AiSourceReference[]): string => {
  const trimmed = answer.trim();
  if (trimmed.length === 0) {
    throw new AppError({ statusCode: 502, message: "AI provider returned an empty response.", code: "AI_PROVIDER_INVALID_RESPONSE" });
  }

  const limited = trimmed.length > aiLimits.answerMaxLength ? `${trimmed.slice(0, aiLimits.answerMaxLength)} [truncated]` : trimmed;
  const validMarkers = new Set(sources.map((source) => source.marker));
  const markers = limited.match(/\[S\d+\]/gu) ?? [];

  if (markers.some((marker) => !validMarkers.has(marker))) {
    return `${limited}\n\nSome source markers from the provider could not be verified and were omitted from the source list.`;
  }

  return limited;
};

export class AiService {
  public async ask(input: { userId: string; organizationId: string; request: AiCopilotRequestInput; metadata: AiRequestMetadata }): Promise<AiCopilotResponse> {
    const requestId = input.metadata.requestId ?? crypto.randomUUID();
    const start = performance.now();
    const { context, permissions } = await aiContextBuilder.build(input);

    if (!hasAiPermission(permissions, "ai.use")) {
      throw new AppError({ statusCode: 403, message: "You do not have permission to use AI.", code: "RBAC_PERMISSION_DENIED" });
    }

    if (writeIntentPattern.test(input.request.question)) {
      await this.recordUsage({ ...input, requestId, action: "ai.query.refused", provider: providerUnavailableMetadata.provider, model: providerUnavailableMetadata.model, durationMs: performance.now() - start, sourceCount: context.sources.length, success: true });
      return {
        requestId,
        answer: readonlyRefusal,
        sources: [],
        provider: providerUnavailableMetadata,
        scope: input.request.scope,
        limitations: ["This assistant is read-only and cannot perform write or destructive actions."]
      };
    }

    const prompt = buildAiPrompt({ question: input.request.question, context, ...(input.request.history === undefined ? {} : { history: input.request.history }) });
    const providerResponse = await aiProvider.generate({ prompt, maxOutputCharacters: env.AI_MAX_OUTPUT_CHARS });
    const answer = validateAnswer(providerResponse.answer, context.sources);
    const durationMs = performance.now() - start;

    await this.recordUsage({ ...input, requestId, action: "ai.query", provider: providerResponse.metadata.provider, model: providerResponse.metadata.model, durationMs, sourceCount: context.sources.length, success: true });
    logger.info({ requestId, organizationId: input.organizationId, userId: input.userId, scope: input.request.scope, provider: providerResponse.metadata.provider, model: providerResponse.metadata.model, durationMs, sourceCount: context.sources.length }, "AI copilot query completed");

    return {
      requestId,
      answer,
      sources: context.sources,
      provider: providerResponse.metadata,
      ...(providerResponse.usage === undefined ? {} : { usage: providerResponse.usage }),
      scope: input.request.scope,
      limitations: [
        "AI answers are generated from bounded authorized BizPilot context and may be incomplete.",
        "Attachment file contents are not included; only metadata is available."
      ]
    };
  }

  public async health(): Promise<{ available: boolean; provider: string; model: string; reason?: string }> {
    const health = await aiProvider.health();
    return { ...health, provider: aiProvider.metadata.provider, model: aiProvider.metadata.model };
  }

  private async recordUsage(input: { userId: string; organizationId: string; request: { scope: AiScopeInput }; metadata: AiRequestMetadata; requestId: string; action: string; provider: string; model: string; durationMs: number; sourceCount: number; success: boolean }): Promise<void> {
    await aiRepository.recordUsage({
      userId: input.userId,
      organizationId: input.organizationId,
      action: input.action,
      ...(input.metadata.ipAddress === undefined ? {} : { ipAddress: input.metadata.ipAddress }),
      ...(input.metadata.userAgent === undefined ? {} : { userAgent: input.metadata.userAgent }),
      metadata: {
        requestId: input.requestId,
        scopeType: input.request.scope.type,
        scopeEntityId: input.request.scope.entityId ?? null,
        provider: input.provider,
        model: input.model,
        durationMs: Math.round(input.durationMs),
        sourceCount: input.sourceCount,
        success: input.success
      }
    });
  }
}

export const aiService = new AiService();

