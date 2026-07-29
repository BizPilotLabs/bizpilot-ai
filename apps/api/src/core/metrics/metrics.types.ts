export type MetricsStatus = "disabled" | "healthy" | "degraded" | "unavailable";
export type MetricsStatusClass = "1xx" | "2xx" | "3xx" | "4xx" | "5xx";
export type MetricsOutcome = "allowed" | "rejected" | "failed";
export type MetricsStoreType = "memory" | "redis";
export type MetricsRateLimitDimension = "user" | "organization";
export type MetricsDependencyName = "redis" | "ai_provider" | "ai_rate_limit" | "application";
export type MetricsTokenDirection = "input" | "output" | "total";
export type AttachmentExtractionResult = "requested" | "completed" | "failed" | "unsupported";
export type BackgroundJobResult = "accepted" | "duplicate" | "rejected" | "shutting_down" | "failed";

export interface HttpMetricLabels {
  method: string;
  route: string;
  statusClass: MetricsStatusClass;
}

export interface AiQueryMetricLabels {
  scopeType: string;
  resultCategory: string;
  provider: string;
  model: string;
}

export interface AiFailureMetricLabels {
  failureCategory: string;
  provider: string;
}

export interface AiRateLimitMetricLabels {
  store: MetricsStoreType;
  dimension: MetricsRateLimitDimension;
  outcome: MetricsOutcome;
}


export interface AttachmentExtractionMetricLabels {
  mimeCategory: string;
  extractor: string;
  result: AttachmentExtractionResult;
  truncated: "true" | "false";
}

export interface BackgroundJobMetricLabels {
  workerType: string;
  jobName: string;
  result: BackgroundJobResult;
}

export interface BackgroundWorkerStateLabels {
  workerType: string;
  activeCount: number;
  queuedCount: number;
}

export interface RedisHealthMetricLabels {
  status: MetricsStatus;
  enabled: "true" | "false";
  required: "true" | "false";
  failureCategory: string;
}

export interface MetricsClient {
  recordHttpRequest(labels: HttpMetricLabels, durationSeconds: number): void;
  incrementActiveHttpRequests(): void;
  decrementActiveHttpRequests(): void;
  recordAiQuery(labels: AiQueryMetricLabels, durationSeconds: number): void;
  recordAiFailure(labels: AiFailureMetricLabels): void;
  observeAiProviderDuration(provider: string, model: string, durationSeconds: number): void;
  observeAiContextDuration(scopeType: string, durationSeconds: number): void;
  observeAiSourceCount(scopeType: string, count: number): void;
  incrementAiTokens(provider: string, model: string, direction: MetricsTokenDirection, count: number): void;
  recordAiRateLimit(labels: AiRateLimitMetricLabels): void;
  observeAiRateLimitCommand(store: MetricsStoreType, outcome: MetricsOutcome, durationSeconds: number): void;
  recordRedisCommandFailure(operation: string, failureCategory: string): void;
  observeRedisHealth(labels: RedisHealthMetricLabels, durationSeconds: number): void;
  recordAttachmentExtraction(labels: AttachmentExtractionMetricLabels, durationSeconds: number): void;
  recordBackgroundJob(labels: BackgroundJobMetricLabels): void;
  setBackgroundWorkerState(labels: BackgroundWorkerStateLabels): void;
  setDependencyState(dependency: MetricsDependencyName, status: MetricsStatus, value: number): void;
  metrics(): Promise<string>;
  contentType(): string;
  reset(): void;
}