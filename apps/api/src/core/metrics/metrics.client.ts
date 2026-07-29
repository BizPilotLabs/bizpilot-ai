import { collectDefaultMetrics, Counter, Gauge, Histogram, Registry } from "prom-client";

import { env } from "../../config/index.js";
import { logger } from "../logger/index.js";
import type { AiFailureMetricLabels, AiQueryMetricLabels, AiRateLimitMetricLabels, AttachmentExtractionMetricLabels, BackgroundJobMetricLabels, BackgroundWorkerStateLabels, HttpMetricLabels, MetricsClient, MetricsDependencyName, MetricsOutcome, MetricsStatus, MetricsStoreType, MetricsTokenDirection, RedisHealthMetricLabels } from "./metrics.types.js";

const forbiddenLabelPattern = /(question|answer|prompt|context|token|authorization|cookie|password|email|userId|organizationId|projectId|taskId|commentId|attachmentId|redisUrl|redisKey|stack|message)/iu;
const safeValuePattern = /^[a-zA-Z0-9_.:/ -]{1,120}$/u;
const statusValues = ["disabled", "healthy", "degraded", "unavailable"] as const;

const sanitizeLabelValue = (value: string): string => {
  const normalized = value.trim().slice(0, 120);
  if (normalized.length === 0) return "unknown";
  return safeValuePattern.test(normalized) ? normalized : "redacted";
};

const sanitizeLabels = <T extends Record<string, string>>(labels: T): T => {
  for (const key of Object.keys(labels)) {
    if (forbiddenLabelPattern.test(key)) {
      throw new Error(`Metric label is not allowed: ${key}`);
    }
  }

  return Object.fromEntries(Object.entries(labels).map(([key, value]) => [key, sanitizeLabelValue(value)])) as T;
};

const safely = (operation: () => void): void => {
  try {
    operation();
  } catch (error) {
    logger.warn({ err: error }, "Metrics emission failed");
  }
};

const createName = (name: string): string => `${env.METRICS_PREFIX}_${name}`;

export class NoopMetricsClient implements MetricsClient {
  public recordHttpRequest(_labels: HttpMetricLabels, _durationSeconds: number): void { return; }
  public incrementActiveHttpRequests(): void { return; }
  public decrementActiveHttpRequests(): void { return; }
  public recordAiQuery(_labels: AiQueryMetricLabels, _durationSeconds: number): void { return; }
  public recordAiFailure(_labels: AiFailureMetricLabels): void { return; }
  public observeAiProviderDuration(_provider: string, _model: string, _durationSeconds: number): void { return; }
  public observeAiContextDuration(_scopeType: string, _durationSeconds: number): void { return; }
  public observeAiSourceCount(_scopeType: string, _count: number): void { return; }
  public incrementAiTokens(_provider: string, _model: string, _direction: MetricsTokenDirection, _count: number): void { return; }
  public recordAiRateLimit(_labels: AiRateLimitMetricLabels): void { return; }
  public observeAiRateLimitCommand(_store: MetricsStoreType, _outcome: MetricsOutcome, _durationSeconds: number): void { return; }
  public recordRedisCommandFailure(_operation: string, _failureCategory: string): void { return; }
  public observeRedisHealth(_labels: RedisHealthMetricLabels, _durationSeconds: number): void { return; }
  public setDependencyState(_dependency: MetricsDependencyName, _status: MetricsStatus, _value: number): void { return; }
  public recordAttachmentExtraction(_labels: AttachmentExtractionMetricLabels, _durationSeconds: number): void { return; }
  public recordBackgroundJob(_labels: BackgroundJobMetricLabels): void { return; }
  public setBackgroundWorkerState(_labels: BackgroundWorkerStateLabels): void { return; }
  public async metrics(): Promise<string> { return ""; }
  public contentType(): string { return "text/plain; version=0.0.4; charset=utf-8"; }
  public reset(): void { return; }
}

export class PrometheusMetricsClient implements MetricsClient {
  private readonly registry: Registry;
  private readonly httpRequests: Counter;
  private readonly httpDuration: Histogram;
  private readonly activeHttpRequests: Gauge;
  private readonly aiQueries: Counter;
  private readonly aiQueryDuration: Histogram;
  private readonly aiFailures: Counter;
  private readonly aiProviderDuration: Histogram;
  private readonly aiContextDuration: Histogram;
  private readonly aiSourceCount: Histogram;
  private readonly aiTokens: Counter;
  private readonly aiRateLimitDecisions: Counter;
  private readonly aiRateLimitCommandDuration: Histogram;
  private readonly redisCommandFailures: Counter;
  private readonly redisHealthDuration: Histogram;
  private readonly dependencyState: Gauge;
  private readonly attachmentExtractionResults: Counter;
  private readonly attachmentExtractionDuration: Histogram;
  private readonly backgroundJobs: Counter;
  private readonly backgroundWorkerActive: Gauge;
  private readonly backgroundWorkerQueued: Gauge;

  public constructor(input?: { registry?: Registry | undefined; collectDefaultMetrics?: boolean | undefined }) {
    this.registry = input?.registry ?? new Registry();
    this.registry.setDefaultLabels({ app: "bizpilot_ai_api" });

    if (input?.collectDefaultMetrics ?? env.METRICS_DEFAULT_METRICS_ENABLED) {
      collectDefaultMetrics({ register: this.registry, prefix: `${env.METRICS_PREFIX}_node_` });
    }

    this.httpRequests = new Counter({ name: createName("http_requests_total"), help: "Total HTTP requests by method, normalized route and status class.", labelNames: ["method", "route", "status_class"], registers: [this.registry] });
    this.httpDuration = new Histogram({ name: createName("http_request_duration_seconds"), help: "HTTP request duration in seconds.", labelNames: ["method", "route", "status_class"], buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10], registers: [this.registry] });
    this.activeHttpRequests = new Gauge({ name: createName("http_active_requests"), help: "Active HTTP requests currently being processed.", registers: [this.registry] });
    this.aiQueries = new Counter({ name: createName("ai_queries_total"), help: "AI Copilot queries by safe result category.", labelNames: ["scope_type", "result_category", "provider", "model"], registers: [this.registry] });
    this.aiQueryDuration = new Histogram({ name: createName("ai_query_duration_seconds"), help: "Total AI Copilot request duration in seconds.", labelNames: ["scope_type", "result_category", "provider", "model"], buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 30, 60], registers: [this.registry] });
    this.aiFailures = new Counter({ name: createName("ai_failures_total"), help: "AI operational failures by safe category.", labelNames: ["failure_category", "provider"], registers: [this.registry] });
    this.aiProviderDuration = new Histogram({ name: createName("ai_provider_duration_seconds"), help: "AI provider generation duration in seconds.", labelNames: ["provider", "model"], buckets: [0.05, 0.1, 0.25, 0.5, 1, 2, 5, 10, 20, 30, 60], registers: [this.registry] });
    this.aiContextDuration = new Histogram({ name: createName("ai_context_duration_seconds"), help: "AI context-building duration in seconds.", labelNames: ["scope_type"], buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5], registers: [this.registry] });
    this.aiSourceCount = new Histogram({ name: createName("ai_source_count"), help: "Number of safe source references returned with AI responses.", labelNames: ["scope_type"], buckets: [0, 1, 2, 4, 8, 12, 20, 40], registers: [this.registry] });
    this.aiTokens = new Counter({ name: createName("ai_tokens_total"), help: "AI token counts reported by provider metadata.", labelNames: ["provider", "model", "direction"], registers: [this.registry] });
    this.aiRateLimitDecisions = new Counter({ name: createName("ai_rate_limit_decisions_total"), help: "AI rate-limit decisions by store, dimension and outcome.", labelNames: ["store", "dimension", "outcome"], registers: [this.registry] });
    this.aiRateLimitCommandDuration = new Histogram({ name: createName("ai_rate_limit_command_duration_seconds"), help: "AI rate-limit store command duration in seconds.", labelNames: ["store", "outcome"], buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2], registers: [this.registry] });
    this.redisCommandFailures = new Counter({ name: createName("redis_command_failures_total"), help: "Redis command failures by operation and safe category.", labelNames: ["operation", "failure_category"], registers: [this.registry] });
    this.redisHealthDuration = new Histogram({ name: createName("redis_health_check_duration_seconds"), help: "Redis health probe duration in seconds.", labelNames: ["status", "enabled", "required", "failure_category"], buckets: [0.001, 0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2], registers: [this.registry] });
    this.dependencyState = new Gauge({ name: createName("dependency_state"), help: "Dependency readiness state. A value of 1 marks the current state for the dependency.", labelNames: ["dependency", "status"], registers: [this.registry] });
    this.attachmentExtractionResults = new Counter({ name: createName("attachment_extraction_results_total"), help: "Attachment text extraction results by safe category.", labelNames: ["mime_category", "extractor", "result", "truncated"], registers: [this.registry] });
    this.attachmentExtractionDuration = new Histogram({ name: createName("attachment_extraction_duration_seconds"), help: "Attachment text extraction duration in seconds.", labelNames: ["mime_category", "extractor", "result", "truncated"], buckets: [0.01, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10, 15, 30, 60], registers: [this.registry] });
    this.backgroundJobs = new Counter({ name: createName("background_jobs_total"), help: "Background job dispatch and execution outcomes.", labelNames: ["worker_type", "job_name", "result"], registers: [this.registry] });
    this.backgroundWorkerActive = new Gauge({ name: createName("background_worker_active_jobs"), help: "Active in-process background jobs.", labelNames: ["worker_type"], registers: [this.registry] });
    this.backgroundWorkerQueued = new Gauge({ name: createName("background_worker_queued_jobs"), help: "Queued in-process background jobs.", labelNames: ["worker_type"], registers: [this.registry] });
  }

  public recordHttpRequest(labels: HttpMetricLabels, durationSeconds: number): void {
    safely(() => {
      const safe = sanitizeLabels({ method: labels.method, route: labels.route, status_class: labels.statusClass });
      this.httpRequests.inc(safe);
      this.httpDuration.observe(safe, durationSeconds);
    });
  }

  public incrementActiveHttpRequests(): void { safely(() => this.activeHttpRequests.inc()); }
  public decrementActiveHttpRequests(): void { safely(() => this.activeHttpRequests.dec()); }

  public recordAiQuery(labels: AiQueryMetricLabels, durationSeconds: number): void {
    safely(() => {
      const safe = sanitizeLabels({ scope_type: labels.scopeType, result_category: labels.resultCategory, provider: labels.provider, model: labels.model });
      this.aiQueries.inc(safe);
      this.aiQueryDuration.observe(safe, durationSeconds);
    });
  }

  public recordAiFailure(labels: AiFailureMetricLabels): void {
    safely(() => this.aiFailures.inc(sanitizeLabels({ failure_category: labels.failureCategory, provider: labels.provider })));
  }

  public observeAiProviderDuration(provider: string, model: string, durationSeconds: number): void {
    safely(() => this.aiProviderDuration.observe(sanitizeLabels({ provider, model }), durationSeconds));
  }

  public observeAiContextDuration(scopeType: string, durationSeconds: number): void {
    safely(() => this.aiContextDuration.observe(sanitizeLabels({ scope_type: scopeType }), durationSeconds));
  }

  public observeAiSourceCount(scopeType: string, count: number): void {
    safely(() => this.aiSourceCount.observe(sanitizeLabels({ scope_type: scopeType }), count));
  }

  public incrementAiTokens(provider: string, model: string, direction: MetricsTokenDirection, count: number): void {
    if (!Number.isFinite(count) || count <= 0) return;
    safely(() => this.aiTokens.inc(sanitizeLabels({ provider, model, direction }), count));
  }

  public recordAiRateLimit(labels: AiRateLimitMetricLabels): void {
    safely(() => this.aiRateLimitDecisions.inc(sanitizeLabels({ store: labels.store, dimension: labels.dimension, outcome: labels.outcome })));
  }

  public observeAiRateLimitCommand(store: MetricsStoreType, outcome: MetricsOutcome, durationSeconds: number): void {
    safely(() => this.aiRateLimitCommandDuration.observe(sanitizeLabels({ store, outcome }), durationSeconds));
  }

  public recordRedisCommandFailure(operation: string, failureCategory: string): void {
    safely(() => this.redisCommandFailures.inc(sanitizeLabels({ operation, failure_category: failureCategory })));
  }

  public observeRedisHealth(labels: RedisHealthMetricLabels, durationSeconds: number): void {
    safely(() => this.redisHealthDuration.observe(sanitizeLabels({ status: labels.status, enabled: labels.enabled, required: labels.required, failure_category: labels.failureCategory }), durationSeconds));
  }

  public setDependencyState(dependency: MetricsDependencyName, status: MetricsStatus, value: number): void {
    safely(() => {
      for (const currentStatus of statusValues) {
        this.dependencyState.set(sanitizeLabels({ dependency, status: currentStatus }), currentStatus === status ? value : 0);
      }
    });
  }

  public recordAttachmentExtraction(labels: AttachmentExtractionMetricLabels, durationSeconds: number): void {
    safely(() => {
      const safe = sanitizeLabels({ mime_category: labels.mimeCategory, extractor: labels.extractor, result: labels.result, truncated: labels.truncated });
      this.attachmentExtractionResults.inc(safe);
      this.attachmentExtractionDuration.observe(safe, durationSeconds);
    });
  }

  public recordBackgroundJob(labels: BackgroundJobMetricLabels): void {
    safely(() => this.backgroundJobs.inc(sanitizeLabels({ worker_type: labels.workerType, job_name: labels.jobName, result: labels.result })));
  }

  public setBackgroundWorkerState(labels: BackgroundWorkerStateLabels): void {
    safely(() => {
      const safe = sanitizeLabels({ worker_type: labels.workerType });
      this.backgroundWorkerActive.set(safe, labels.activeCount);
      this.backgroundWorkerQueued.set(safe, labels.queuedCount);
    });
  }

  public async metrics(): Promise<string> {
    return this.registry.metrics();
  }

  public contentType(): string {
    return this.registry.contentType;
  }

  public reset(): void {
    this.registry.resetMetrics();
  }
}

export const createMetricsClient = (): MetricsClient => env.METRICS_ENABLED ? new PrometheusMetricsClient() : new NoopMetricsClient();
export let metricsClient: MetricsClient = createMetricsClient();

export const setMetricsClientForTests = (client: MetricsClient): void => {
  metricsClient = client;
};

export const resetMetricsClientForTests = (): void => {
  metricsClient.reset();
  metricsClient = createMetricsClient();
};

export const normalizeMetricRoute = (method: string, path: string, routePath?: string | undefined): string => {
  if (routePath !== undefined && routePath.length > 0) return routePath.startsWith("/") ? routePath : `/${routePath}`;
  const pathname = path.split("?")[0] ?? "/";
  const normalized = pathname
    .replace(/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}/giu, ":id")
    .replace(/\b\d+\b/gu, ":id");
  return normalized.length > 120 ? `${method.toLowerCase()}_route_overflow` : normalized;
};

export const statusClass = (statusCode: number): "1xx" | "2xx" | "3xx" | "4xx" | "5xx" => {
  if (statusCode < 200) return "1xx";
  if (statusCode < 300) return "2xx";
  if (statusCode < 400) return "3xx";
  if (statusCode < 500) return "4xx";
  return "5xx";
};