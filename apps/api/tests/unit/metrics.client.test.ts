import { Registry } from "prom-client";
import { describe, expect, it } from "vitest";

import { NoopMetricsClient, normalizeMetricRoute, PrometheusMetricsClient } from "../../src/core/metrics/index.js";

describe("metrics client", () => {
  it("keeps no-op metrics safe and inert", async () => {
    const client = new NoopMetricsClient();

    client.recordHttpRequest({ method: "GET", route: "/health", statusClass: "2xx" }, 0.01);
    client.recordAiRateLimit({ store: "memory", dimension: "user", outcome: "allowed" });

    await expect(client.metrics()).resolves.toBe("");
  });

  it("records Prometheus counters, histograms and gauges in an isolated registry", async () => {
    const client = new PrometheusMetricsClient({ registry: new Registry(), collectDefaultMetrics: false });

    client.recordHttpRequest({ method: "GET", route: "/projects/:id", statusClass: "2xx" }, 0.02);
    client.incrementActiveHttpRequests();
    client.decrementActiveHttpRequests();
    client.recordAiQuery({ scopeType: "project", resultCategory: "success", provider: "ollama", model: "llama3.2" }, 0.5);
    client.recordAiFailure({ failureCategory: "provider_timeout", provider: "ollama" });
    client.observeAiProviderDuration("ollama", "llama3.2", 0.4);
    client.observeAiContextDuration("project", 0.03);
    client.observeAiSourceCount("project", 3);
    client.incrementAiTokens("ollama", "llama3.2", "input", 12);
    client.recordAiRateLimit({ store: "redis", dimension: "organization", outcome: "rejected" });
    client.observeAiRateLimitCommand("redis", "rejected", 0.004);
    client.recordRedisCommandFailure("eval", "command_timeout");
    client.observeRedisHealth({ status: "healthy", enabled: "true", required: "true", failureCategory: "none" }, 0.003);
    client.setDependencyState("redis", "healthy", 1);

    const output = await client.metrics();

    expect(output).toContain("bizpilot_http_requests_total");
    expect(output).toContain('route="/projects/:id"');
    expect(output).toContain("bizpilot_ai_queries_total");
    expect(output).toContain("bizpilot_ai_rate_limit_decisions_total");
    expect(output).toContain("bizpilot_redis_command_failures_total");
    expect(output).not.toContain("organizationId");
    expect(output).not.toContain("userId");
  });

  it("normalizes dynamic resource identifiers instead of using raw URLs as labels", () => {
    const normalized = normalizeMetricRoute("GET", "/projects/3f50c5ce-fd7a-4c5f-b3c1-6d783a6dd90a?expand=true");

    expect(normalized).toBe("/projects/:id");
    expect(normalized).not.toContain("3f50c5ce");
  });
});