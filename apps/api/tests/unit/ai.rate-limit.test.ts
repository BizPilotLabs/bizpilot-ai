import { describe, expect, it } from "vitest";
import { MemoryAiRateLimitStore } from "../../src/modules/ai/ai.rate-limit.js";

describe("MemoryAiRateLimitStore", () => {
  it("limits each user independently inside an organization", async () => {
    const store = new MemoryAiRateLimitStore({ windowMs: 60_000, userLimit: 1, organizationLimit: 10 });

    await expect(store.consume({ organizationId: "org-a", userId: "user-a", now: 1000 })).resolves.toMatchObject({ allowed: true, remaining: 0 });
    await expect(store.consume({ organizationId: "org-a", userId: "user-a", now: 1001 })).resolves.toMatchObject({ allowed: false, dimension: "user", retryAfterSeconds: 60 });
    await expect(store.consume({ organizationId: "org-a", userId: "user-b", now: 1002 })).resolves.toMatchObject({ allowed: true });
  });

  it("enforces organization limits across users", async () => {
    const store = new MemoryAiRateLimitStore({ windowMs: 60_000, userLimit: 10, organizationLimit: 2 });

    await store.consume({ organizationId: "org-a", userId: "user-a", now: 1000 });
    await store.consume({ organizationId: "org-a", userId: "user-b", now: 1001 });
    await expect(store.consume({ organizationId: "org-a", userId: "user-c", now: 1002 })).resolves.toMatchObject({ allowed: false, dimension: "organization" });
    await expect(store.consume({ organizationId: "org-b", userId: "user-c", now: 1002 })).resolves.toMatchObject({ allowed: true });
  });

  it("expires windows and cleans memory buckets", async () => {
    const store = new MemoryAiRateLimitStore({ windowMs: 100, userLimit: 1, organizationLimit: 1 });

    await store.consume({ organizationId: "org-a", userId: "user-a", now: 1000 });
    await expect(store.consume({ organizationId: "org-a", userId: "user-a", now: 1001 })).resolves.toMatchObject({ allowed: false });
    await expect(store.consume({ organizationId: "org-a", userId: "user-a", now: 1101 })).resolves.toMatchObject({ allowed: true });
  });

  it("reports process-local readiness honestly", () => {
    const store = new MemoryAiRateLimitStore({ windowMs: 100, userLimit: 1, organizationLimit: 1 });

    expect(store.readiness()).toEqual(expect.objectContaining({ ready: true, store: "memory", distributed: false }));
  });
});
