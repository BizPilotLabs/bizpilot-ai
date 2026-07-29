import { beforeEach, describe, expect, it, vi } from "vitest";

const redisClientMock = vi.hoisted(() => ({
  connect: vi.fn(),
  quit: vi.fn(),
  destroy: vi.fn(),
  ping: vi.fn(),
  eval: vi.fn(),
  on: vi.fn(),
  isOpen: false
}));

const metricsClientMock = vi.hoisted(() => ({
  recordRedisCommandFailure: vi.fn(),
  observeRedisHealth: vi.fn(),
  setDependencyState: vi.fn(),
  recordHttpRequest: vi.fn(),
  incrementActiveHttpRequests: vi.fn(),
  decrementActiveHttpRequests: vi.fn(),
  recordAiQuery: vi.fn(),
  recordAiFailure: vi.fn(),
  observeAiProviderDuration: vi.fn(),
  observeAiContextDuration: vi.fn(),
  observeAiSourceCount: vi.fn(),
  incrementAiTokens: vi.fn(),
  recordAiRateLimit: vi.fn(),
  observeAiRateLimitCommand: vi.fn(),
  metrics: vi.fn().mockResolvedValue(""),
  contentType: vi.fn().mockReturnValue("text/plain; version=0.0.4; charset=utf-8"),
  reset: vi.fn()
}));
const createClientMock = vi.hoisted(() => vi.fn(() => redisClientMock));

vi.mock("redis", () => ({ createClient: createClientMock }));
vi.mock("../../src/core/metrics/index.js", async (importOriginal) => {
  const actual = await importOriginal();
  return { ...(actual as object), metricsClient: metricsClientMock };
});

const loadRedisModule = async (overrides: Record<string, string | undefined>) => {
  vi.resetModules();
  for (const [key, value] of Object.entries(overrides)) {
    if (value === undefined) Reflect.deleteProperty(process.env, key);
    else process.env[key] = value;
  }
  return import("../../src/core/redis/redis.client.js");
};

describe("ManagedRedisConnection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    redisClientMock.isOpen = false;
    redisClientMock.connect.mockResolvedValue(redisClientMock);
    redisClientMock.quit.mockResolvedValue("OK");
    redisClientMock.ping.mockResolvedValue("PONG");
    redisClientMock.eval.mockResolvedValue([1, 1, 1, 1000, 1000, 0, 0]);
  });

  it("stays disabled without creating a Redis client", async () => {
    const { ManagedRedisConnection } = await loadRedisModule({ REDIS_ENABLED: "false", AI_RATE_LIMIT_STORE: "memory", REDIS_URL: undefined });
    const connection = new ManagedRedisConnection();

    await connection.connect();
    const health = await connection.health({ refresh: true });

    expect(health).toMatchObject({ enabled: false, available: false, status: "disabled", failureCategory: "disabled" });
    expect(createClientMock).not.toHaveBeenCalled();
    expect(metricsClientMock.setDependencyState).toHaveBeenCalledWith("redis", "disabled", 1);
  }, 15_000);

  it("connects once, pings health, and closes gracefully", async () => {
    const { ManagedRedisConnection } = await loadRedisModule({ REDIS_ENABLED: "true", REDIS_URL: "redis://:secret@example.local:6379/0", AI_RATE_LIMIT_STORE: "memory" });
    const connection = new ManagedRedisConnection();

    await connection.connect();
    redisClientMock.isOpen = true;
    const first = await connection.health({ refresh: true });
    const second = await connection.health();
    await connection.disconnect();

    expect(first).toMatchObject({ enabled: true, configured: true, available: true, status: "healthy" });
    expect(second.checkedAt).toBe(first.checkedAt);
    expect(createClientMock).toHaveBeenCalledTimes(1);
    expect(redisClientMock.ping).toHaveBeenCalledTimes(1);
    expect(redisClientMock.quit).toHaveBeenCalledTimes(1);
    expect(JSON.stringify(first)).not.toContain("secret");
    expect(JSON.stringify(first)).not.toContain("example.local");
    expect(metricsClientMock.observeRedisHealth).toHaveBeenCalledWith(expect.objectContaining({ status: "healthy", failureCategory: "none" }), expect.any(Number));
    expect(metricsClientMock.setDependencyState).toHaveBeenCalledWith("redis", "healthy", 1);
  });

  it("classifies failed connections safely", async () => {
    redisClientMock.connect.mockRejectedValue(new Error("redis://:secret@example.local exploded"));
    const { ManagedRedisConnection } = await loadRedisModule({ REDIS_ENABLED: "true", REDIS_URL: "redis://:secret@example.local:6379/0", AI_RATE_LIMIT_STORE: "redis" });
    const connection = new ManagedRedisConnection();

    const health = await connection.health({ refresh: true });

    expect(health).toMatchObject({ enabled: true, available: false, status: "unavailable", failureCategory: "connection_failed" });
    expect(JSON.stringify(health)).not.toContain("secret");
    expect(JSON.stringify(health)).not.toContain("example.local");
    expect(metricsClientMock.recordRedisCommandFailure).toHaveBeenCalledWith("ping", "connection_failed");
    expect(metricsClientMock.observeRedisHealth).toHaveBeenCalledWith(expect.objectContaining({ status: "unavailable", failureCategory: "connection_failed" }), expect.any(Number));
  });

  it("does not create duplicate clients for concurrent connection attempts", async () => {
    redisClientMock.connect.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve(redisClientMock), 10)));
    const { ManagedRedisConnection } = await loadRedisModule({ REDIS_ENABLED: "true", REDIS_URL: "redis://localhost:6379/0", AI_RATE_LIMIT_STORE: "redis" });
    const connection = new ManagedRedisConnection();

    await Promise.all([connection.connect(), connection.connect()]);

    expect(createClientMock).toHaveBeenCalledTimes(1);
  });
});

