import crypto from "node:crypto";
import type { Response } from "express";
import { env } from "../../config/index.js";

export type AiRateLimitDimension = "user" | "organization";

export interface AiRateLimitPolicy {
  windowMs: number;
  userLimit: number;
  organizationLimit: number;
}

export interface AiRateLimitConsumeInput {
  userId: string;
  organizationId: string;
  now?: number | undefined;
}

export interface AiRateLimitResult {
  allowed: boolean;
  dimension: AiRateLimitDimension;
  limit: number;
  remaining: number;
  resetAt: Date;
  retryAfterSeconds: number;
  store: "memory";
  distributed: false;
}

export interface AiRateLimitReadiness {
  ready: boolean;
  store: "memory";
  distributed: false;
  detail: string;
}

export interface AiRateLimitStore {
  consume(input: AiRateLimitConsumeInput): Promise<AiRateLimitResult>;
  readiness(): AiRateLimitReadiness;
  reset(): void;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const hashKeyPart = (value: string): string => crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);

const secondsUntil = (resetAt: number, now: number): number => Math.max(1, Math.ceil((resetAt - now) / 1000));

export const getAiRateLimitPolicy = (): AiRateLimitPolicy => ({
  windowMs: env.AI_RATE_LIMIT_WINDOW_MS,
  userLimit: env.AI_RATE_LIMIT_MAX_REQUESTS,
  organizationLimit: env.AI_RATE_LIMIT_MAX_ORGANIZATION_REQUESTS
});

export class MemoryAiRateLimitStore implements AiRateLimitStore {
  private readonly buckets = new Map<string, Bucket>();
  private readonly policy: AiRateLimitPolicy;

  public constructor(policy: AiRateLimitPolicy = getAiRateLimitPolicy()) {
    this.policy = policy;
  }

  public async consume(input: AiRateLimitConsumeInput): Promise<AiRateLimitResult> {
    const now = input.now ?? Date.now();
    this.cleanup(now);

    const userKey = this.key("user", input.organizationId, input.userId);
    const organizationKey = this.key("organization", input.organizationId);
    const userBucket = this.getActiveBucket(userKey, now);
    const organizationBucket = this.getActiveBucket(organizationKey, now);

    if (organizationBucket.count >= this.policy.organizationLimit) {
      return this.denied("organization", organizationBucket, this.policy.organizationLimit, now);
    }

    if (userBucket.count >= this.policy.userLimit) {
      return this.denied("user", userBucket, this.policy.userLimit, now);
    }

    userBucket.count += 1;
    organizationBucket.count += 1;
    this.buckets.set(userKey, userBucket);
    this.buckets.set(organizationKey, organizationBucket);

    const remaining = Math.min(this.policy.userLimit - userBucket.count, this.policy.organizationLimit - organizationBucket.count);
    return {
      allowed: true,
      dimension: remaining === this.policy.userLimit - userBucket.count ? "user" : "organization",
      limit: Math.min(this.policy.userLimit, this.policy.organizationLimit),
      remaining: Math.max(0, remaining),
      resetAt: new Date(Math.min(userBucket.resetAt, organizationBucket.resetAt)),
      retryAfterSeconds: 0,
      store: "memory",
      distributed: false
    };
  }

  public readiness(): AiRateLimitReadiness {
    return {
      ready: true,
      store: "memory",
      distributed: false,
      detail: "In-memory AI rate limits are process-local and should be replaced by a shared atomic store before horizontal API scaling."
    };
  }

  public reset(): void {
    this.buckets.clear();
  }

  private key(dimension: AiRateLimitDimension, organizationId: string, userId?: string): string {
    const tenantPart = hashKeyPart(organizationId);
    if (dimension === "organization") return `ai:rate:${dimension}:${tenantPart}`;
    return `ai:rate:${dimension}:${tenantPart}:${hashKeyPart(userId ?? "")}`;
  }

  private getActiveBucket(key: string, now: number): Bucket {
    const existing = this.buckets.get(key);
    if (existing !== undefined && existing.resetAt > now) return existing;
    return { count: 0, resetAt: now + this.policy.windowMs };
  }

  private denied(dimension: AiRateLimitDimension, bucket: Bucket, limit: number, now: number): AiRateLimitResult {
    return {
      allowed: false,
      dimension,
      limit,
      remaining: 0,
      resetAt: new Date(bucket.resetAt),
      retryAfterSeconds: secondsUntil(bucket.resetAt, now),
      store: "memory",
      distributed: false
    };
  }

  private cleanup(now: number): void {
    for (const [key, bucket] of this.buckets.entries()) {
      if (bucket.resetAt <= now) this.buckets.delete(key);
    }
  }
}

export const aiRateLimitStore = new MemoryAiRateLimitStore();

export const applyAiRateLimitHeaders = (response: Response, result: AiRateLimitResult): void => {
  response.setHeader("X-RateLimit-Limit", String(result.limit));
  response.setHeader("X-RateLimit-Remaining", String(result.remaining));
  response.setHeader("X-RateLimit-Reset", result.resetAt.toISOString());
  response.setHeader("X-AI-RateLimit-Store", result.store);
  if (!result.allowed) response.setHeader("Retry-After", String(result.retryAfterSeconds));
};

export const resetAiRateLimitStoreForTests = (): void => {
  aiRateLimitStore.reset();
};
