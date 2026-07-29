import crypto from "node:crypto";
import { performance } from "node:perf_hooks";

import { env } from "../../config/index.js";
import { logger } from "../../core/logger/index.js";
import { aiContextBuilder, hasAiPermission } from "./ai.context.js";
import { aiFailureDefinitions, createAiError, durationCategory, getAiFailureDefinition } from "./ai.failure.js";
import { aiHealthService } from "./ai.health.js";
import { aiProvider } from "./ai.provider.js";
import { buildAiPrompt } from "./ai.prompt.js";
import { aiRepository } from "./ai.repository.js";
import { aiLimits } from "./ai.schema.js";
import type { AiCopilotRequestInput, AiCopilotResponse, AiProviderMetadata, AiProviderUsage, AiRequestMetadata, AiScopeInput, AiSourceReference } from "./ai.types.js";

const writeIntentPattern = /\b(create|update|edit|delete|remove|archive|restore|assign|unassign|upload|invite|approve|change\s+role|change\s+permission|modify\s+organization|change\s+organization|settings|revoke|grant|disable|enable)\b/iu;

const readonlyRefusal = "I cannot perform create, update, delete, archive, assignment, upload, invitation, role, organization-setting, or other write actions. I can answer read-only questions from authorized BizPilot data and explain where you can make changes in the app.";

const refusalProviderMetadata = { provider: "policy", model: "read-only-governance" } satisfies AiProviderMetadata;

const removeUnsafeLabelCharacters = (value: string): string => [...value].map((character) => {
  const code = character.charCodeAt(0);
  return code < 32 || code === 127 ? " " : character;
}).join("");

const safeLabel = (value: string): string => removeUnsafeLabelCharacters(value).replace(/\s+/gu, " ").trim().slice(0, 160) || "Untitled source";

const validateAnswer = (answer: string, sources: AiSourceReference[]): { answer: string; sources: AiSourceReference[]; unverifiedMarkerCount: number } => {
  const trimmed = answer.trim();
  if (trimmed.length === 0) {
    throw createAiError("AI_PROVIDER_INVALID_RESPONSE");
  }

  const limited = trimmed.length > aiLimits.answerMaxLength ? `${trimmed.slice(0, aiLimits.answerMaxLength)} [truncated]` : trimmed;
  const validMarkers = new Set(sources.map((source) => source.marker));
  const markers = limited.match(/\[S\d+\]/gu) ?? [];
  const unverifiedMarkerCount = markers.filter((marker) => !validMarkers.has(marker)).length;
  const verifiedMarkers = new Set(markers.filter((marker) => validMarkers.has(marker)));
  const normalizedSources = sources
    .filter((source) => verifiedMarkers.has(source.marker) || markers.length === 0)
    .map((source) => ({ ...source, label: safeLabel(source.label) }));

  if (unverifiedMarkerCount > 0) {
    return {
      answer: `${limited}\n\nSome source markers from the provider could not be verified and were omitted from the source list.`,
      sources: normalizedSources,
      unverifiedMarkerCount
    };
  }

  return { answer: limited, sources: normalizedSources, unverifiedMarkerCount };
};

interface RecordUsageInput {
  userId: string;
  organizationId: string;
  request: { scope: AiScopeInput };
  metadata: AiRequestMetadata;
  requestId: string;
  action: "ai.query" | "ai.query.refused" | "ai.query.failed";
  provider: string;
  model: string;
  durationMs: number;
  sourceCount: number;
  resultCategory: string;
  success: boolean;
  usage?: AiProviderUsage | undefined;
}

export class AiService {
  public async ask(input: { userId: string; organizationId: string; request: AiCopilotRequestInput; metadata: AiRequestMetadata }): Promise<AiCopilotResponse> {
    const requestId = input.metadata.requestId ?? crypto.randomUUID();
    const start = performance.now();
    let sourceCount = 0;

    try {
      const { context, permissions } = await aiContextBuilder.build(input);
      sourceCount = context.sources.length;

      if (!hasAiPermission(permissions, "ai.use")) {
        throw createAiError("AI_CONTEXT_PERMISSION_DENIED");
      }

      if (writeIntentPattern.test(input.request.question)) {
        const durationMs = performance.now() - start;
        await this.recordUsage({ ...input, requestId, action: "ai.query.refused", provider: refusalProviderMetadata.provider, model: refusalProviderMetadata.model, durationMs, sourceCount, resultCategory: aiFailureDefinitions.AI_READ_ONLY_REFUSED.resultCategory, success: true });
        logger.info({ requestId, organizationId: input.organizationId, userId: input.userId, scope: input.request.scope, resultCategory: aiFailureDefinitions.AI_READ_ONLY_REFUSED.resultCategory, durationCategory: durationCategory(durationMs), sourceCount }, "AI copilot refused write-intent request");
        return {
          requestId,
          answer: readonlyRefusal,
          sources: [],
          provider: refusalProviderMetadata,
          metadata: { requestId, resultCategory: aiFailureDefinitions.AI_READ_ONLY_REFUSED.resultCategory, durationCategory: durationCategory(durationMs), sourceCount: 0 },
          scope: input.request.scope,
          limitations: ["This assistant is read-only and cannot perform write or destructive actions."]
        };
      }

      const prompt = buildAiPrompt({ question: input.request.question, context, ...(input.request.history === undefined ? {} : { history: input.request.history }) });
      const providerResponse = await aiProvider.generate({ prompt, maxOutputCharacters: env.AI_MAX_OUTPUT_CHARS });
      const validation = validateAnswer(providerResponse.answer, context.sources);
      const durationMs = performance.now() - start;
      const resultCategory = validation.unverifiedMarkerCount > 0 ? "success_with_unverified_sources" : "success";

      await this.recordUsage({ ...input, requestId, action: "ai.query", provider: providerResponse.metadata.provider, model: providerResponse.metadata.model, durationMs, sourceCount: validation.sources.length, resultCategory, success: true, usage: providerResponse.usage });
      logger.info({ requestId, organizationId: input.organizationId, userId: input.userId, scope: input.request.scope, provider: providerResponse.metadata.provider, model: providerResponse.metadata.model, durationCategory: durationCategory(durationMs), sourceCount: validation.sources.length, resultCategory, inputTokens: providerResponse.usage?.inputTokens, outputTokens: providerResponse.usage?.outputTokens }, "AI copilot query completed");

      return {
        requestId,
        answer: validation.answer,
        sources: validation.sources,
        provider: providerResponse.metadata,
        ...(providerResponse.usage === undefined ? {} : { usage: providerResponse.usage }),
        metadata: { requestId, resultCategory, durationCategory: durationCategory(durationMs), sourceCount: validation.sources.length },
        scope: input.request.scope,
        limitations: [
          "AI answers are generated from bounded authorized BizPilot context and may be incomplete.",
          "Attachment file contents are not included; only metadata is available."
        ]
      };
    } catch (error) {
      const durationMs = performance.now() - start;
      const definition = getAiFailureDefinition(error);
      await this.recordUsage({ ...input, requestId, action: "ai.query.failed", provider: aiProvider.metadata.provider, model: aiProvider.metadata.model, durationMs, sourceCount, resultCategory: definition.resultCategory, success: false });
      logger.warn({ requestId, organizationId: input.organizationId, userId: input.userId, scope: input.request.scope, resultCategory: definition.resultCategory, durationCategory: durationCategory(durationMs), sourceCount }, "AI copilot query failed");
      throw error;
    }
  }

  public async health(): Promise<Awaited<ReturnType<typeof aiHealthService.getHealth>>> {
    return aiHealthService.getHealth();
  }

  private async recordUsage(input: RecordUsageInput): Promise<void> {
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
        durationCategory: durationCategory(input.durationMs),
        sourceCount: input.sourceCount,
        resultCategory: input.resultCategory,
        success: input.success,
        inputTokens: input.usage?.inputTokens ?? null,
        outputTokens: input.usage?.outputTokens ?? null,
        totalTokens: input.usage?.totalTokens ?? null
      }
    });
  }
}

export const aiService = new AiService();

