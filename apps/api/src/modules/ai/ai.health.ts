import { performance } from "node:perf_hooks";
import { env } from "../../config/index.js";
import { metricsClient } from "../../core/metrics/index.js";
import { durationCategory } from "./ai.failure.js";
import { aiProvider } from "./ai.provider.js";
import { aiRateLimitStore, getAiRateLimitPolicy } from "./ai.rate-limit.js";
import type { AiProviderHealth, AiProviderHealthStatus } from "./ai.types.js";

interface CachedHealth {
  value: AiProviderHealth;
  expiresAt: number;
}

const statusFromProvider = (health: Awaited<ReturnType<typeof aiProvider.health>>): AiProviderHealthStatus => {
  if (aiProvider.metadata.provider === "disabled") return "disabled";
  if (health.available) return "healthy";
  return "unavailable";
};

const withTimeout = async <T>(promise: Promise<T>, timeoutMs: number, fallback: T): Promise<T> => {
  let timeout: NodeJS.Timeout | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<T>((resolve) => {
        timeout = setTimeout(() => resolve(fallback), timeoutMs);
      })
    ]);
  } finally {
    if (timeout !== undefined) clearTimeout(timeout);
  }
};

export class AiHealthService {
  private cached: CachedHealth | null = null;
  private pending: Promise<AiProviderHealth> | null = null;

  public async getHealth(input?: { refresh?: boolean | undefined }): Promise<AiProviderHealth> {
    const now = Date.now();
    if (input?.refresh !== true && this.cached !== null && this.cached.expiresAt > now) return this.cached.value;
    if (this.pending !== null) return this.pending;

    this.pending = this.probe();
    try {
      const value = await this.pending;
      this.cached = { value, expiresAt: Date.now() + env.AI_HEALTH_CACHE_TTL_MS };
      return value;
    } finally {
      this.pending = null;
    }
  }

  public reset(): void {
    this.cached = null;
    this.pending = null;
  }

  private async probe(): Promise<AiProviderHealth> {
    const startedAt = performance.now();
    const readiness = await aiRateLimitStore.readiness();
    const policy = getAiRateLimitPolicy();
    const providerTimeoutFallback = { available: false, reason: "AI provider health check timed out." };
    const providerHealth = await withTimeout(aiProvider.health(), env.AI_HEALTH_TIMEOUT_MS, providerTimeoutFallback);
    const providerStatus = statusFromProvider(providerHealth);
    const rateLimitReady = readiness.ready;
    const status: AiProviderHealthStatus = rateLimitReady ? providerStatus : "degraded";
    const degradedReasonCode = !rateLimitReady ? "AI_RATE_LIMIT_STORE_UNAVAILABLE" : providerStatus === "disabled" ? "AI_DISABLED" : providerHealth.available ? undefined : "AI_PROVIDER_UNAVAILABLE";

    metricsClient.setDependencyState("ai_provider", providerStatus, 1);
    metricsClient.setDependencyState("ai_rate_limit", rateLimitReady ? "healthy" : "unavailable", 1);

    return {
      enabled: env.AI_ENABLED,
      configured: env.AI_ENABLED && aiProvider.metadata.provider !== "disabled",
      available: providerHealth.available && rateLimitReady,
      status,
      provider: aiProvider.metadata.provider,
      model: aiProvider.metadata.model,
      checkedAt: new Date().toISOString(),
      latencyCategory: durationCategory(performance.now() - startedAt),
      ...(degradedReasonCode === undefined ? {} : { degradedReasonCode }),
      ...(providerHealth.reason === undefined ? {} : { reason: providerHealth.reason }),
      rateLimit: {
        store: readiness.store,
        distributed: readiness.distributed,
        windowMs: policy.windowMs,
        userLimit: policy.userLimit,
        organizationLimit: policy.organizationLimit,
        available: readiness.ready,
        detail: readiness.detail
      },
      persistence: { promptsStored: false, responsesStored: false, conversationHistoryStored: false },
      mode: "read_only"
    };
  }
}

export const aiHealthService = new AiHealthService();
export const resetAiHealthForTests = (): void => aiHealthService.reset();
