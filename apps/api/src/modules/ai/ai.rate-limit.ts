import crypto from "node:crypto";
import type { Response } from "express";
import { env } from "../../config/index.js";
import { RedisOperationError, redisConnection, type RedisCommandClient } from "../../core/redis/index.js";

export type AiRateLimitDimension = "user" | "organization";
export type AiRateLimitStoreType = "memory" | "redis";

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
  store: AiRateLimitStoreType;
  distributed: boolean;
}

export interface AiRateLimitReadiness {
  ready: boolean;
  store: AiRateLimitStoreType;
  distributed: boolean;
  detail: string;
  failureCategory?: string | undefined;
}

export interface AiRateLimitStore {
  consume(input: AiRateLimitConsumeInput): Promise<AiRateLimitResult>;
  readiness(): Promise<AiRateLimitReadiness>;
  reset(): void;
}

interface Bucket {
  count: number;
  resetAt: number;
}

const redisConsumeScript = `
local userKey = KEYS[1]
local organizationKey = KEYS[2]
local windowMs = tonumber(ARGV[1])
local userLimit = tonumber(ARGV[2])
local organizationLimit = tonumber(ARGV[3])

local userCount = redis.call("INCR", userKey)
if userCount == 1 then
  redis.call("PEXPIRE", userKey, windowMs)
end

local organizationCount = redis.call("INCR", organizationKey)
if organizationCount == 1 then
  redis.call("PEXPIRE", organizationKey, windowMs)
end

local userTtl = redis.call("PTTL", userKey)
local organizationTtl = redis.call("PTTL", organizationKey)
local userExceeded = userCount > userLimit and 1 or 0
local organizationExceeded = organizationCount > organizationLimit and 1 or 0

if userExceeded == 1 or organizationExceeded == 1 then
  redis.call("DECR", userKey)
  redis.call("DECR", organizationKey)
  return {0, userCount, organizationCount, userTtl, organizationTtl, userExceeded, organizationExceeded}
end

return {1, userCount, organizationCount, userTtl, organizationTtl, 0, 0}
`;

const hashKeyPart = (value: string): string => crypto.createHash("sha256").update(value).digest("hex").slice(0, 32);

const secondsUntil = (resetAt: number, now: number): number => Math.max(1, Math.ceil((resetAt - now) / 1000));

const parseRedisNumber = (value: unknown): number => {
  if (typeof value === "number") return value;
  if (typeof value === "bigint") return Number(value);
  if (typeof value === "string") {
    const parsed = Number.parseInt(value, 10);
    if (Number.isFinite(parsed)) return parsed;
  }
  return 0;
};

const parseRedisResult = (value: unknown): [number, number, number, number, number, number, number] => {
  if (!Array.isArray(value) || value.length < 7) return [0, 0, 0, 1, 1, 0, 0];
  return [parseRedisNumber(value[0]), parseRedisNumber(value[1]), parseRedisNumber(value[2]), parseRedisNumber(value[3]), parseRedisNumber(value[4]), parseRedisNumber(value[5]), parseRedisNumber(value[6])];
};

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

    const userRemaining = this.policy.userLimit - userBucket.count;
    const organizationRemaining = this.policy.organizationLimit - organizationBucket.count;
    const remaining = Math.min(userRemaining, organizationRemaining);
    return {
      allowed: true,
      dimension: userRemaining <= organizationRemaining ? "user" : "organization",
      limit: userRemaining <= organizationRemaining ? this.policy.userLimit : this.policy.organizationLimit,
      remaining: Math.max(0, remaining),
      resetAt: new Date(Math.min(userBucket.resetAt, organizationBucket.resetAt)),
      retryAfterSeconds: 0,
      store: "memory",
      distributed: false
    };
  }

  public async readiness(): Promise<AiRateLimitReadiness> {
    return {
      ready: true,
      store: "memory",
      distributed: false,
      detail: "In-memory AI rate limits are process-local and should be replaced by Redis before horizontal API scaling."
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

export class RedisAiRateLimitStore implements AiRateLimitStore {
  private readonly policy: AiRateLimitPolicy;
  private readonly client: RedisCommandClient;

  public constructor(input: { client: RedisCommandClient; policy?: AiRateLimitPolicy | undefined }) {
    this.client = input.client;
    this.policy = input.policy ?? getAiRateLimitPolicy();
  }

  public async consume(input: AiRateLimitConsumeInput): Promise<AiRateLimitResult> {
    const now = input.now ?? Date.now();
    const [allowed, userCount, organizationCount, userTtl, organizationTtl, userExceeded, organizationExceeded] = parseRedisResult(await this.client.eval(redisConsumeScript, {
      keys: [this.key("user", input.organizationId, input.userId, now), this.key("organization", input.organizationId, undefined, now)],
      arguments: [String(this.policy.windowMs), String(this.policy.userLimit), String(this.policy.organizationLimit)]
    }));

    const userRemaining = Math.max(0, this.policy.userLimit - userCount);
    const organizationRemaining = Math.max(0, this.policy.organizationLimit - organizationCount);
    const dimension: AiRateLimitDimension = organizationExceeded === 1 ? "organization" : userExceeded === 1 ? "user" : userRemaining <= organizationRemaining ? "user" : "organization";
    const relevantTtl = dimension === "organization" ? organizationTtl : userTtl;
    const resetAt = new Date(now + Math.max(1, relevantTtl));

    return {
      allowed: allowed === 1,
      dimension,
      limit: dimension === "organization" ? this.policy.organizationLimit : this.policy.userLimit,
      remaining: allowed === 1 ? Math.min(userRemaining, organizationRemaining) : 0,
      resetAt,
      retryAfterSeconds: allowed === 1 ? 0 : secondsUntil(resetAt.getTime(), now),
      store: "redis",
      distributed: true
    };
  }

  public async readiness(): Promise<AiRateLimitReadiness> {
    const health = await redisConnection.health();
    return {
      ready: health.available,
      store: "redis",
      distributed: true,
      detail: health.available ? "Redis-backed AI rate limiting is available." : "Redis-backed AI rate limiting is unavailable.",
      ...(health.failureCategory === undefined ? {} : { failureCategory: health.failureCategory })
    };
  }

  public reset(): void {
    return;
  }

  public static scriptForTests(): string {
    return redisConsumeScript;
  }

  public keyForTests(dimension: AiRateLimitDimension, organizationId: string, userId: string | undefined, now: number): string {
    return this.key(dimension, organizationId, userId, now);
  }

  private key(dimension: AiRateLimitDimension, organizationId: string, userId: string | undefined, now: number): string {
    const windowStart = Math.floor(now / this.policy.windowMs) * this.policy.windowMs;
    const tenantPart = hashKeyPart(organizationId);
    const identityPart = dimension === "organization" ? tenantPart : `${tenantPart}:${hashKeyPart(userId ?? "")}`;
    return `${env.REDIS_KEY_PREFIX}:${env.NODE_ENV}:ai-rate-limit:v1:${dimension}:${identityPart}:${windowStart}`;
  }
}

export const createAiRateLimitStore = (): AiRateLimitStore => env.AI_RATE_LIMIT_STORE === "redis" ? new RedisAiRateLimitStore({ client: redisConnection }) : new MemoryAiRateLimitStore();

export let aiRateLimitStore = createAiRateLimitStore();

export const applyAiRateLimitHeaders = (response: Response, result: AiRateLimitResult): void => {
  response.setHeader("X-RateLimit-Limit", String(result.limit));
  response.setHeader("X-RateLimit-Remaining", String(result.remaining));
  response.setHeader("X-RateLimit-Reset", result.resetAt.toISOString());
  response.setHeader("X-AI-RateLimit-Store", result.store);
  response.setHeader("X-AI-RateLimit-Distributed", String(result.distributed));
  if (!result.allowed) response.setHeader("Retry-After", String(result.retryAfterSeconds));
};

export const setAiRateLimitStoreForTests = (store: AiRateLimitStore): void => {
  aiRateLimitStore = store;
};

export const resetAiRateLimitStoreForTests = (): void => {
  aiRateLimitStore.reset();
  aiRateLimitStore = createAiRateLimitStore();
};

export const isRedisRateLimitFailure = (error: unknown): boolean => error instanceof RedisOperationError;

