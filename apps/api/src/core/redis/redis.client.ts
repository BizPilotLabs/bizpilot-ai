import { performance } from "node:perf_hooks";
import { createClient, type RedisClientType } from "redis";
import { env } from "../../config/index.js";
import { logger } from "../logger/index.js";
import type { RedisCommandClient, RedisEvalOptions, RedisFailureCategory, RedisHealthState, RedisLatencyCategory } from "./redis.types.js";

const latencyCategory = (durationMs: number): RedisLatencyCategory => {
  if (durationMs >= env.REDIS_COMMAND_TIMEOUT_MS) return "timeout";
  if (durationMs >= 250) return "slow";
  if (durationMs >= 50) return "normal";
  return "fast";
};

const timeout = <T>(promise: Promise<T>, timeoutMs: number, failureCategory: RedisFailureCategory): Promise<T> => {
  let handle: NodeJS.Timeout | undefined;
  return Promise.race([
    promise,
    new Promise<T>((_resolve, reject) => {
      handle = setTimeout(() => reject(new RedisOperationError(failureCategory)), timeoutMs);
    })
  ]).finally(() => {
    if (handle !== undefined) clearTimeout(handle);
  });
};

export class RedisOperationError extends Error {
  public readonly failureCategory: RedisFailureCategory;

  public constructor(failureCategory: RedisFailureCategory) {
    super("Redis operation failed.");
    this.name = "RedisOperationError";
    this.failureCategory = failureCategory;
  }
}

interface RedisHealthCache {
  value: RedisHealthState;
  expiresAt: number;
}

export class ManagedRedisConnection implements RedisCommandClient {
  private client: RedisClientType | null = null;
  private connectionPromise: Promise<RedisClientType> | null = null;
  private healthCache: RedisHealthCache | null = null;

  public isEnabled(): boolean {
    return env.REDIS_ENABLED || env.AI_RATE_LIMIT_STORE === "redis";
  }

  public isRequired(): boolean {
    return env.AI_RATE_LIMIT_STORE === "redis" || (env.NODE_ENV === "production" && env.REDIS_REQUIRED_IN_PRODUCTION);
  }

  public async connect(): Promise<void> {
    if (!this.isEnabled()) return;
    await this.getClient();
    logger.info({ store: "redis" }, "Redis connection established");
  }

  public async disconnect(): Promise<void> {
    const current = this.client;
    this.client = null;
    this.connectionPromise = null;
    this.healthCache = null;
    if (current === null) return;
    await current.quit();
    logger.info({ store: "redis" }, "Redis connection closed");
  }

  public async eval(script: string, options: RedisEvalOptions): Promise<unknown> {
    const client = await this.getClient();
    return timeout(client.eval(script, { keys: options.keys, arguments: options.arguments }), env.REDIS_COMMAND_TIMEOUT_MS, "command_timeout");
  }

  public async ping(): Promise<string> {
    const client = await this.getClient();
    return timeout(client.ping(), env.REDIS_COMMAND_TIMEOUT_MS, "command_timeout");
  }

  public async health(input?: { refresh?: boolean | undefined }): Promise<RedisHealthState> {
    if (!this.isEnabled()) return this.disabledHealth();
    const now = Date.now();
    if (input?.refresh !== true && this.healthCache !== null && this.healthCache.expiresAt > now) return this.healthCache.value;

    const startedAt = performance.now();
    try {
      await this.ping();
      const value: RedisHealthState = {
        enabled: true,
        configured: env.REDIS_URL !== undefined,
        required: this.isRequired(),
        available: true,
        status: "healthy",
        checkedAt: new Date().toISOString(),
        latencyCategory: latencyCategory(performance.now() - startedAt)
      };
      this.healthCache = { value, expiresAt: Date.now() + env.REDIS_HEALTH_CACHE_TTL_MS };
      return value;
    } catch (error) {
      const failureCategory = error instanceof RedisOperationError ? error.failureCategory : "connection_failed";
      const value: RedisHealthState = {
        enabled: true,
        configured: env.REDIS_URL !== undefined,
        required: this.isRequired(),
        available: false,
        status: this.isRequired() ? "unavailable" : "degraded",
        checkedAt: new Date().toISOString(),
        latencyCategory: latencyCategory(performance.now() - startedAt),
        failureCategory
      };
      this.healthCache = { value, expiresAt: Date.now() + env.REDIS_HEALTH_CACHE_TTL_MS };
      logger.warn({ store: "redis", failureCategory, required: value.required }, "Redis health check failed");
      return value;
    }
  }

  public resetForTests(): void {
    this.client = null;
    this.connectionPromise = null;
    this.healthCache = null;
  }

  private disabledHealth(): RedisHealthState {
    return {
      enabled: false,
      configured: env.REDIS_URL !== undefined,
      required: false,
      available: false,
      status: "disabled",
      checkedAt: new Date().toISOString(),
      latencyCategory: "fast",
      failureCategory: "disabled"
    };
  }

  private async getClient(): Promise<RedisClientType> {
    if (!this.isEnabled()) throw new RedisOperationError("disabled");
    if (this.client !== null && this.client.isOpen) return this.client;
    if (env.REDIS_URL === undefined) throw new RedisOperationError("not_configured");
    if (this.connectionPromise !== null) return this.connectionPromise;

    const client = createClient({
      url: env.REDIS_URL,
      socket: {
        connectTimeout: env.REDIS_CONNECT_TIMEOUT_MS,
        reconnectStrategy: (retries) => retries > env.REDIS_MAX_RECONNECT_ATTEMPTS ? false : Math.min(100 * 2 ** retries, 1_000)
      }
    });

    client.on("error", () => {
      logger.warn({ store: "redis", failureCategory: "connection_failed" }, "Redis client error");
    });

    this.connectionPromise = timeout(client.connect(), env.REDIS_CONNECT_TIMEOUT_MS, "connection_timeout")
      .then(() => {
        this.client = client;
        return client;
      })
      .catch((error: unknown) => {
        this.connectionPromise = null;
        this.client = null;
        void client.destroy();
        if (error instanceof RedisOperationError) throw error;
        throw new RedisOperationError("connection_failed");
      });

    return this.connectionPromise;
  }
}

export const redisConnection = new ManagedRedisConnection();
export const connectRedis = async (): Promise<void> => redisConnection.connect();
export const disconnectRedis = async (): Promise<void> => redisConnection.disconnect();
