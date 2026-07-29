import { env } from "../../config/index.js";
import { AppError } from "../../core/errors/index.js";
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
    throw new AppError({ statusCode: 502, message: "AI provider returned an invalid response.", code: "AI_PROVIDER_INVALID_RESPONSE" });
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
    throw new AppError({ statusCode: 503, message: "AI assistant is not configured.", code: "AI_PROVIDER_UNAVAILABLE" });
  }

  public async health(): Promise<{ available: boolean; reason?: string }> {
    return { available: false, reason: "AI provider is disabled." };
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
        throw new AppError({ statusCode: 503, message: "AI provider is unavailable.", code: "AI_PROVIDER_UNAVAILABLE" });
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
      if (error instanceof Error && error.name === "AbortError") {
        throw new AppError({ statusCode: 504, message: "AI provider request timed out.", code: "AI_PROVIDER_TIMEOUT" });
      }
      throw new AppError({ statusCode: 503, message: "AI provider is unavailable.", code: "AI_PROVIDER_UNAVAILABLE" });
    } finally {
      clearTimeout(timeout);
    }
  }

  public async health(): Promise<{ available: boolean; reason?: string }> {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), Math.min(env.AI_REQUEST_TIMEOUT_MS, 3000));
      const response = await fetch(new URL("/api/tags", env.AI_OLLAMA_BASE_URL), { signal: controller.signal });
      clearTimeout(timeout);
      return response.ok ? { available: true } : { available: false, reason: "Ollama returned an unhealthy response." };
    } catch {
      return { available: false, reason: "Ollama is unreachable." };
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

