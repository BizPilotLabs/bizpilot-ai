# Production Metrics, Telemetry and Alerting Readiness

This milestone adds a small backend metrics foundation for operational visibility. It does not add Grafana, hosted monitoring, OpenTelemetry collectors, distributed tracing, persistent telemetry tables, billing, queues, background jobs or frontend observability dashboards.

## Existing Observability Before This Milestone

BizPilot AI already had:

- Pino structured logs through `pino` and `pino-http`.
- Centralized Express error handling.
- Safe request rejection logs for application errors.
- `/health` liveness and Redis dependency readiness.
- AI audit metadata stored in `AuditLog` without prompts or answers.
- AI provider health caching.
- Redis health state and managed lifecycle.

Missing capabilities were Prometheus metrics, HTTP duration/count metrics, dependency gauges, AI operational counters, Redis command metrics and alert guidance.

## Capability Analysis

| Capability | Status | Notes |
| --- | --- | --- |
| Structured logs | Fully supported | Existing Pino remains the only logger. |
| Request IDs | Partially supported | Existing request ID headers are preserved in AI metadata and logs. |
| HTTP counts and latency | Fully supported | `httpMetrics` middleware records count, duration and active requests. |
| Error counts | Fully supported through status-class labels | HTTP metrics include `4xx` and `5xx`; AI has failure counters. |
| AI request counts | Fully supported | Result category, provider, model and scope type only. |
| AI provider latency | Fully supported | Timed around actual provider generation calls. |
| AI token usage | Fully supported when provider reports usage | Input, output and total token counters. |
| AI source counts | Fully supported | Histogram by scope type only. |
| AI rate-limit pressure | Fully supported | Store, dimension and bounded outcome labels. |
| Redis availability | Fully supported | Gauge and health probe histogram from existing health checks. |
| Redis command failures | Fully supported | Operation and safe failure category only. |
| Prometheus metrics | Fully supported when enabled | Uses `prom-client`. |
| OpenTelemetry and traces | Out of scope | No collector or tracing SDK added. |
| Alert rules | Documented | Starting-point Prometheus guidance only. |
| Dashboards | Documented as query guidance | No Grafana files added. |
| Persistent analytics and billing | Out of scope | No database migration. |

## Metrics Architecture

The implementation lives under `apps/api/src/core/metrics`:

```text
MetricsClient
|-- NoopMetricsClient
|-- PrometheusMetricsClient
|-- httpMetrics middleware
|-- optional metrics endpoint
```

Application code calls typed high-level methods such as `recordAiQuery`, `recordAiRateLimit`, `observeRedisHealth` and `recordHttpRequest`. Business modules do not call `prom-client` directly.

Metrics emission is fail-safe. If a metric call throws, the request continues and a safe warning is written through Pino.

## Dependency Decision

The API uses `prom-client` as the single metrics dependency because it provides:

- Counters, gauges and histograms.
- Prometheus text exposition format.
- TypeScript support.
- Registry isolation for tests.
- Optional default Node.js process metrics.
- No external service requirement at runtime.

OpenTelemetry was not added because the repository had no tracing or collector foundation and this milestone is deliberately scrape-metrics focused.

## Configuration

Backend-only environment variables:

- `METRICS_ENABLED` - enables the metrics route and Prometheus client.
- `METRICS_PATH` - metrics scrape path, default `/metrics`.
- `METRICS_AUTH_TOKEN` - required when metrics are enabled.
- `METRICS_DEFAULT_METRICS_ENABLED` - enables `prom-client` Node.js default metrics.
- `METRICS_PREFIX` - custom metric prefix, default `bizpilot`.

Metrics are disabled by default. Enabling metrics without `METRICS_AUTH_TOKEN` fails environment validation.

## Metric Names

Default prefix: `bizpilot`.

HTTP:

- `bizpilot_http_requests_total`
- `bizpilot_http_request_duration_seconds`
- `bizpilot_http_active_requests`

AI:

- `bizpilot_ai_queries_total`
- `bizpilot_ai_query_duration_seconds`
- `bizpilot_ai_failures_total`
- `bizpilot_ai_provider_duration_seconds`
- `bizpilot_ai_context_duration_seconds`
- `bizpilot_ai_source_count`
- `bizpilot_ai_tokens_total`
- `bizpilot_ai_rate_limit_decisions_total`
- `bizpilot_ai_rate_limit_command_duration_seconds`

Redis and dependencies:

- `bizpilot_redis_command_failures_total`
- `bizpilot_redis_health_check_duration_seconds`
- `bizpilot_dependency_state`

When default Node.js process metrics are enabled, they use the `bizpilot_node_` prefix.

## Label Policy

Allowed labels are low-cardinality operational categories:

- HTTP method, normalized route and status class.
- AI scope type, result category, provider and configured model.
- AI rate-limit store type, dimension and outcome.
- Redis operation and safe failure category.
- Dependency name and bounded health status.

Forbidden labels:

- Raw URL and query string.
- User ID, organization ID, email or account identifiers.
- Project, task, comment or attachment IDs.
- AI question, answer, prompt or retrieved context.
- Source labels or source IDs.
- Request ID.
- Redis URL, Redis key, host, port or credentials.
- Error message, stack trace, JWTs, cookies or presigned URLs.

The metrics boundary exposes typed methods rather than arbitrary label maps. Runtime label sanitization rejects unsafe label names and redacts unsafe values where practical.

## HTTP Metrics

`httpMetrics` records:

- Total requests.
- Request duration.
- Active requests.
- Status class.
- Normalized route.

Dynamic UUID path segments are normalized to `:id`. Request bodies, auth headers and cookies are never inspected. The metrics endpoint is excluded from HTTP request metrics to avoid scrape self-noise.

## AI Metrics

AI instrumentation records:

- Final query outcome exactly once for success, refusal or failure.
- Total AI request duration.
- Context-building duration.
- Provider generation duration when the provider is actually called.
- Source count.
- Token counts when provider metadata includes usage.
- Failure categories using the existing AI failure taxonomy.

No AI question, answer, prompt, source IDs or tenant identifiers are used in metrics.

## Rate-Limit Metrics

The AI rate-limit layer records:

- Allowed requests.
- Rejected requests.
- Store failures.
- Store type: `memory` or `redis`.
- Dimension: `user` or `organization`.

The Redis-backed limiter also records atomic Lua command duration with outcome `allowed`, `rejected` or `failed`.

## Redis Metrics

Redis metrics are emitted from the managed Redis connection and Redis AI limiter:

- Health probe duration.
- Current safe dependency state.
- Command failure counts for `ping` and `eval`.
- AI rate-limit Redis command latency.

Metrics do not include Redis URLs, hostnames, database numbers, keys, hashed identifiers or raw Redis errors.

## Health Metrics

`bizpilot_dependency_state` reports the active bounded state for:

- `application`
- `redis`
- `ai_provider`
- `ai_rate_limit`

Allowed states are `disabled`, `healthy`, `degraded` and `unavailable`. A value of `1` marks the active state for a dependency; other states are set to `0`.

Metrics consume existing health checks. Scraping `/metrics` does not trigger Ollama probes or Redis `PING` calls.

## Metrics Endpoint

When enabled, the API exposes Prometheus text format at `METRICS_PATH`, default `/metrics`.

Authorization:

```text
Authorization: Bearer <METRICS_AUTH_TOKEN>
```

Missing or invalid authorization returns a non-revealing `404`. Metrics should also be protected at the reverse proxy or network layer in production.

Example scrape config:

```yaml
scrape_configs:
  - job_name: bizpilot-api
    metrics_path: /metrics
    scheme: https
    bearer_token: ${BIZPILOT_METRICS_TOKEN}
    static_configs:
      - targets: ["api.internal.example:443"]
```

Use deployment-specific secret injection; do not commit real tokens.

## Alert Recommendations

These thresholds are starting points, not universal production values.

| Area | Metric | Suggested condition | Window | Severity | First response |
| --- | --- | --- | --- | --- | --- |
| API 5xx | `rate(bizpilot_http_requests_total{status_class="5xx"}[5m])` | Above baseline or > 1% of traffic | 5m | High | Inspect error logs by request ID and recent deploys. |
| API latency | `histogram_quantile(0.95, rate(bizpilot_http_request_duration_seconds_bucket[5m]))` | > 2s | 5m | Medium | Check database, Redis and upstream AI latency. |
| Readiness | `bizpilot_dependency_state{dependency="application",status="degraded"}` | Equals 1 | 2m | High | Check `/health` and Redis required mode. |
| AI provider timeout | `rate(bizpilot_ai_failures_total{failure_category="provider_timeout"}[5m])` | Sustained increase | 5m | Medium | Check provider process/network and `AI_REQUEST_TIMEOUT_MS`. |
| AI provider unavailable | `bizpilot_dependency_state{dependency="ai_provider",status="unavailable"}` | Equals 1 | 5m | High | Confirm provider health and AI configuration. |
| AI latency | `histogram_quantile(0.95, rate(bizpilot_ai_provider_duration_seconds_bucket[10m]))` | > 20s | 10m | Medium | Check model size, provider CPU/GPU and queueing outside the app. |
| Invalid AI responses | `rate(bizpilot_ai_failures_total{failure_category="provider_invalid_response"}[10m])` | Any sustained rate | 10m | Medium | Inspect provider compatibility and response parser. |
| Redis unavailable | `bizpilot_dependency_state{dependency="redis",status="unavailable"}` | Equals 1 | 2m | Critical if Redis required | Check Redis credentials, network, TLS and service availability. |
| Redis latency | `histogram_quantile(0.95, rate(bizpilot_redis_health_check_duration_seconds_bucket[5m]))` | > 250ms | 5m | Medium | Check Redis placement and network path. |
| Redis command failures | `rate(bizpilot_redis_command_failures_total[5m])` | Sustained increase | 5m | High | Inspect failure categories and Redis server logs. |
| Rate-limit spike | `rate(bizpilot_ai_rate_limit_decisions_total{outcome="rejected"}[5m])` | Sudden increase | 5m | Medium | Check abusive usage, configured limits and organization activity. |
| Store unavailable | `rate(bizpilot_ai_rate_limit_decisions_total{outcome="failed"}[5m])` | Any sustained rate | 5m | High | Check Redis AI limiter and fail-closed behavior. |

## Dashboard Query Guidance

Suggested Prometheus panels:

- AI queries by result: `sum by (result_category) (rate(bizpilot_ai_queries_total[5m]))`
- AI latency p95: `histogram_quantile(0.95, rate(bizpilot_ai_query_duration_seconds_bucket[5m]))`
- Provider latency p95: `histogram_quantile(0.95, rate(bizpilot_ai_provider_duration_seconds_bucket[5m]))`
- AI rate-limit rejections: `sum by (store, dimension) (rate(bizpilot_ai_rate_limit_decisions_total{outcome="rejected"}[5m]))`
- Redis health state: `bizpilot_dependency_state{dependency="redis"}`
- HTTP 5xx rate: `sum(rate(bizpilot_http_requests_total{status_class="5xx"}[5m]))`
- API latency p95: `histogram_quantile(0.95, rate(bizpilot_http_request_duration_seconds_bucket[5m]))`

No Grafana dashboard artifact is included because no dashboard convention exists in the repository.

## Operational Runbook

AI provider unavailable:

- Check `/ai/copilot/health` for safe status.
- Check `bizpilot_dependency_state{dependency="ai_provider"}`.
- Inspect Pino logs by request ID and result category.
- Disable AI with `AI_ENABLED=false` if needed; core application features remain available.

AI timeout spike:

- Check `bizpilot_ai_failures_total{failure_category="provider_timeout"}`.
- Compare provider and total AI latency histograms.
- Inspect provider resource pressure and network path.

Redis unavailable:

- Check `/health` dependency status.
- Check `bizpilot_dependency_state{dependency="redis"}`.
- Confirm whether Redis is optional or required.
- AI queries fail closed only when Redis is selected for AI rate limiting.

Redis latency spike:

- Check Redis health duration and AI rate-limit command duration.
- Verify Redis region, network path and server load.

Rate-limit rejection spike:

- Check `bizpilot_ai_rate_limit_decisions_total` by dimension.
- Confirm whether pressure is user-level or organization-level.
- Tune AI limits only after reviewing abuse and expected usage.

Metrics endpoint unavailable:

- Confirm `METRICS_ENABLED=true`.
- Confirm `METRICS_AUTH_TOKEN` is configured and sent as a bearer token.
- Check reverse proxy path and network restrictions.

Missing metrics:

- Confirm the route is scraped with valid auth.
- Confirm requests have exercised the relevant code paths.
- Check that metrics are not disabled in the environment.

Suspected sensitive-label leak:

- Stop scraping or restrict access immediately.
- Inspect metric series names and labels.
- Rotate any exposed secrets.
- Add regression tests for the leaked value class.

Disabling metrics safely:

- Set `METRICS_ENABLED=false` and redeploy.
- Remove scrape target or expect `404` from `/metrics`.

## Performance Review

Metric recording is in-process and does not perform network I/O. No request payloads are serialized for metrics. Labels are bounded and low-cardinality. Registries are created once, not per request. Default process metrics use the library-supported collection path.

## Security and Privacy Review

- Metrics are disabled by default.
- Enabled metrics require a backend-only bearer token.
- Tokens are compared with `crypto.timingSafeEqual`.
- Invalid access returns `404`.
- No tenant identifiers or AI content are labels.
- No Redis or provider URLs are exposed.
- Prometheus scraping does not trigger new provider or Redis probes.

## Known Limitations

- No OpenTelemetry traces.
- No hosted monitoring integration.
- No alert delivery integration.
- No Grafana dashboard JSON.
- No persistent metrics storage inside BizPilot AI.
- No per-tenant analytics or billing usage metrics.
- Reconnect count is not emitted because the Redis client event stream is not yet normalized into a reliable lifecycle counter.

## Recommended Next Milestone

Add production deployment manifests or infrastructure documentation that defines how Prometheus scrapes this endpoint securely, including reverse-proxy restrictions, secret injection and environment-specific alert thresholds.