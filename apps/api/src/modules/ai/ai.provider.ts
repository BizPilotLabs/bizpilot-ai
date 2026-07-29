import { env } from "../../config/index.js";
import { AppError } from "../../core/errors/index.js";
import { createAiError } from "./ai.failure.js";
import type { AiProvider, AiProviderRequest, AiProviderResponse } from "./ai.types.js";

interface OllamaGenerateResponse {
  response: string;
  model?: string | undefined;
  prompt_eval_count?: number | undefined;
  eval_count?: number | undefined;
}

const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null;

const parseOllamaResponse = (value: unknown): OllamaGenerateResponse => {
  if (!isRecord(value) || typeof value.response !== "string") {
    throw createAiError("AI_PROVIDER_INVALID_RESPONSE");
  }

  const parsed: OllamaGenerateResponse = { response: value.response };
  if (typeof value.model === "string") parsed.model = value.model;
  if (typeof value.prompt_eval_count === "number") parsed.prompt_eval_count = value.prompt_eval_count;
  if (typeof value.eval_count === "number") parsed.eval_count = value.eval_count;
  return parsed;
};

export class DisabledAiProvider implements AiProvider {
  public readonly metadata = { provider: "disabled", model: "disabled" };

  public async generate(_input: AiProviderRequest): Promise<AiProviderResponse> {
    throw createAiError("AI_DISABLED");
  }

  public async health(): Promise<{ available: boolean; reason?: string }> {
    return { available: false, reason: "AI is disabled for this deployment." };
  }
}

export class OllamaAiProvider implements AiProvider {
  public readonly metadata = { provider: "ollama", model: env.AI_MODEL };

  public async generate(input: AiProviderRequest): Promise<AiProviderResponse> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), env.AI_REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(new URL("/api/generate", env.AI_OLLAMA_BASE_URL), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: env.AI_MODEL,
          prompt: input.prompt,
          stream: false,
          options: { num_predict: Math.ceil(input.maxOutputCharacters / 4) }
        }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw createAiError("AI_PROVIDER_UNAVAILABLE");
      }

      const result = parseOllamaResponse(await response.json());
      return {
        answer: result.response,
        metadata: { provider: "ollama", model: result.model ?? env.AI_MODEL },
        usage: {
          ...(result.prompt_eval_count === undefined ? {} : { inputTokens: result.prompt_eval_count }),
          ...(result.eval_count === undefined ? {} : { outputTokens: result.eval_count }),
          ...(result.prompt_eval_count !== undefined || result.eval_count !== undefined ? { totalTokens: (result.prompt_eval_count ?? 0) + (result.eval_count ?? 0) } : {})
        }
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      if (error instanceof Error && error.name === "AbortError") throw createAiError("AI_PROVIDER_TIMEOUT", error);
      throw createAiError("AI_PROVIDER_UNAVAILABLE", error);
    } finally {
      clearTimeout(timeout);
    }
  }

  public async health(): Promise<{ available: boolean; reason?: string }> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), Math.min(env.AI_HEALTH_TIMEOUT_MS, env.AI_REQUEST_TIMEOUT_MS));

    try {
      const response = await fetch(new URL("/api/tags", env.AI_OLLAMA_BASE_URL), { signal: controller.signal });
      return response.ok ? { available: true } : { available: false, reason: "AI provider returned an unhealthy response." };
    } catch {
      return { available: false, reason: "AI provider is unreachable or timed out." };
    } finally {
      clearTimeout(timeout);
    }
  }
}

export const createAiProvider = (): AiProvider => {
  if (!env.AI_ENABLED || env.AI_PROVIDER === "disabled") {
    return new DisabledAiProvider();
  }

  if (env.AI_PROVIDER === "ollama") {
    return new OllamaAiProvider();
  }

  return new DisabledAiProvider();
};

export const aiProvider = createAiProvider();

