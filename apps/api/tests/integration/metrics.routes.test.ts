import request from "supertest";
import { afterEach, describe, expect, it, vi } from "vitest";

const configureMetricsEnvironment = (enabled: boolean): void => {
  process.env.METRICS_ENABLED = enabled ? "true" : "false";
  process.env.METRICS_PATH = "/metrics";
  process.env.METRICS_AUTH_TOKEN = "test-metrics-token-with-enough-length";
  process.env.METRICS_DEFAULT_METRICS_ENABLED = "false";
  process.env.METRICS_PREFIX = "bizpilot";
};

const loadApp = async (enabled: boolean) => {
  vi.resetModules();
  configureMetricsEnvironment(enabled);
  const { createApp } = await import("../../src/app.js");
  return createApp();
};

describe("metrics route", () => {
  afterEach(() => {
    vi.resetModules();
    configureMetricsEnvironment(false);
  });

  it("is not registered when metrics are disabled", async () => {
    const app = await loadApp(false);

    const response = await request(app).get("/metrics").set("Authorization", "Bearer test-metrics-token-with-enough-length");

    expect(response.status).toBe(404);
  }, 15_000);

  it("rejects missing or invalid metrics authorization without exposing the endpoint", async () => {
    const app = await loadApp(true);

    const missing = await request(app).get("/metrics");
    const invalid = await request(app).get("/metrics").set("Authorization", "Bearer wrong-token");

    expect(missing.status).toBe(404);
    expect(invalid.status).toBe(404);
  }, 15_000);

  it("returns Prometheus text for authorized scrapes and excludes dynamic resource IDs", async () => {
    const app = await loadApp(true);
    const resourceId = "3f50c5ce-fd7a-4c5f-b3c1-6d783a6dd90a";

    await request(app).get(`/projects/${resourceId}`);
    const response = await request(app).get("/metrics").set("Authorization", "Bearer test-metrics-token-with-enough-length");

    expect(response.status).toBe(200);
    expect(response.headers["content-type"]).toContain("text/plain");
    expect(response.text).toContain("bizpilot_http_requests_total");
    expect(response.text).not.toContain(resourceId);
    expect(response.text).not.toContain("test-metrics-token");
    expect(response.text).not.toContain("question");
    expect(response.text).not.toContain("answer");
  }, 15_000);
});