import { describe, expect, it, vi } from "vitest";
import type { RedisCommandClient } from "../../src/core/redis/index.js";
import { RedisOperationError } from "../../src/core/redis/index.js";
import { RedisAiRateLimitStore } from "../../src/modules/ai/ai.rate-limit.js";

class FakeRedisClient implements RedisCommandClient {
  public readonly eval = vi.fn<RedisCommandClient["eval"]>();
  public readonly ping = vi.fn<RedisCommandClient["ping"]>();
}

describe("RedisAiRateLimitStore", () => {
  it("allows requests below both limits with effective remaining metadata", async () => {
    const client = new FakeRedisClient();
    client.eval.mockResolvedValue([1, 2, 5, 60_000, 60_000, 0, 0]);
    const store = new RedisAiRateLimitStore({ client, policy: { windowMs: 60_000, userLimit: 10, organizationLimit: 20 } });

    await expect(store.consume({ organizationId: "org-a", userId: "user-a", now: 1000 })).resolves.toMatchObject({ allowed: true, store: "redis", distributed: true, remaining: 8, dimension: "user" });
    expect(client.eval).toHaveBeenCalledTimes(1);
    const [script, options] = client.eval.mock.calls[0] ?? [];
    expect(script).toContain("redis.call(\"INCR\", userKey)");
    expect(script).toContain("redis.call(\"PEXPIRE\", userKey, windowMs)");
    expect(script).toContain("redis.call(\"DECR\", userKey)");
    expect(options?.keys).toHaveLength(2);
    expect(options?.keys.join(" ")).not.toContain("org-a");
    expect(options?.keys.join(" ")).not.toContain("user-a");
    expect(options?.arguments).toEqual(["60000", "10", "20"]);
  });

  it("rejects when the user limit is reached", async () => {
    const client = new FakeRedisClient();
    client.eval.mockResolvedValue([0, 11, 5, 30_000, 60_000, 1, 0]);
    const store = new RedisAiRateLimitStore({ client, policy: { windowMs: 60_000, userLimit: 10, organizationLimit: 20 } });

    await expect(store.consume({ organizationId: "org-a", userId: "user-a", now: 1000 })).resolves.toMatchObject({ allowed: false, dimension: "user", limit: 10, remaining: 0, retryAfterSeconds: 30 });
  });

  it("rejects when the organization limit is reached", async () => {
    const client = new FakeRedisClient();
    client.eval.mockResolvedValue([0, 3, 21, 60_000, 45_000, 0, 1]);
    const store = new RedisAiRateLimitStore({ client, policy: { windowMs: 60_000, userLimit: 10, organizationLimit: 20 } });

    await expect(store.consume({ organizationId: "org-a", userId: "user-a", now: 1000 })).resolves.toMatchObject({ allowed: false, dimension: "organization", limit: 20, retryAfterSeconds: 45 });
  });

  it("uses stable namespaced hashed keys with window separation", () => {
    const client = new FakeRedisClient();
    const store = new RedisAiRateLimitStore({ client, policy: { windowMs: 60_000, userLimit: 10, organizationLimit: 20 } });

    const first = store.keyForTests("user", "org-a", "user-a", 10_000);
    const second = store.keyForTests("user", "org-a", "user-a", 70_000);
    const organization = store.keyForTests("organization", "org-a", undefined, 10_000);

    expect(first).toContain(":ai-rate-limit:v1:user:");
    expect(organization).toContain(":ai-rate-limit:v1:organization:");
    expect(first).not.toBe(second);
    expect(first).not.toContain("org-a");
    expect(first).not.toContain("user-a");
  });

  it("propagates safe Redis operation failures", async () => {
    const client = new FakeRedisClient();
    client.eval.mockRejectedValue(new RedisOperationError("command_failed"));
    const store = new RedisAiRateLimitStore({ client, policy: { windowMs: 60_000, userLimit: 10, organizationLimit: 20 } });

    await expect(store.consume({ organizationId: "org-a", userId: "user-a", now: 1000 })).rejects.toMatchObject({ failureCategory: "command_failed", message: "Redis operation failed." });
  });
});
