import { beforeEach, describe, expect, it, vi } from "vitest";

const aiProviderMock = vi.hoisted(() => ({
  metadata: { provider: "test", model: "governance-model" },
  health: vi.fn()
}));

vi.mock("../../src/modules/ai/ai.provider.js", () => ({ aiProvider: aiProviderMock }));

const { aiHealthService } = await import("../../src/modules/ai/ai.health.js");

describe("AiHealthService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    aiHealthService.reset();
  });

  it("caches fresh provider health", async () => {
    aiProviderMock.health.mockResolvedValue({ available: true });

    const first = await aiHealthService.getHealth();
    const second = await aiHealthService.getHealth();

    expect(first).toMatchObject({ available: true, provider: "test", model: "governance-model", status: "healthy" });
    expect(second.checkedAt).toBe(first.checkedAt);
    expect(aiProviderMock.health).toHaveBeenCalledTimes(1);
  });

  it("deduplicates concurrent probes", async () => {
    aiProviderMock.health.mockImplementation(() => new Promise((resolve) => setTimeout(() => resolve({ available: true }), 10)));

    const [first, second] = await Promise.all([aiHealthService.getHealth({ refresh: true }), aiHealthService.getHealth({ refresh: true })]);

    expect(first.checkedAt).toBe(second.checkedAt);
    expect(aiProviderMock.health).toHaveBeenCalledTimes(1);
  });

  it("returns safe degraded fields for unavailable providers", async () => {
    aiProviderMock.health.mockResolvedValue({ available: false, reason: "AI provider is unreachable or timed out." });

    const result = await aiHealthService.getHealth({ refresh: true });

    expect(result).toMatchObject({ available: false, status: "unavailable", degradedReasonCode: "AI_PROVIDER_UNAVAILABLE", reason: "AI provider is unreachable or timed out." });
    expect(JSON.stringify(result)).not.toContain("localhost");
    expect(JSON.stringify(result)).not.toContain("11434");
  });
});
