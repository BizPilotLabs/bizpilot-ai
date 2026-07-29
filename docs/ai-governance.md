# AI Usage Governance and Operational Readiness

BizPilot AI Copilot remains request-scoped and read-only. This milestone adds operational controls around the existing Copilot without adding autonomous actions, embeddings, vector search, OCR, persistent chat, billing, or database telemetry.

## Repository Inspection Summary

No Redis, shared key-value store, distributed lock service, BullMQ queue, OpenTelemetry pipeline, Prometheus exporter, health registry, feature flag framework, organization AI settings schema, or platform-superadmin architecture exists in the current repository. The active implementation therefore uses provider-abstracted in-memory governance controls and documents the horizontal-scaling gap instead of adding speculative infrastructure.

Existing supporting infrastructure used by this milestone:

- Express middleware and centralized `AppError` responses.
- Pino application logger.
- Prisma-backed `AuditLog` records.
- Existing `ai.use` RBAC permission.
- Existing Testing Library, MSW, Vitest and Supertest foundations.

## Capability Analysis

| Capability | Current status | Notes |
| --- | --- | --- |
| Per-user AI rate limit | Fully supported | `MemoryAiRateLimitStore` enforces user windows. |
| Per-organization AI rate limit | Fully supported | Same store enforces tenant-wide windows. |
| Shared/distributed rate limits | Requires infrastructure | Adapter contract exists; no shared store is present. |
| Daily usage counts | Backend-only partial | Safe request metadata is written to audit logs; no aggregate table. |
| Provider health | Fully supported | Cached safe health model via `AiHealthService`. |
| Provider latency | Partially supported | Duration categories are recorded, not raw metrics streams. |
| Provider error categorization | Fully supported | `ai.failure.ts` centralizes stable categories. |
| Provider model visibility | Fully supported | Safe provider/model identifiers only. |
| Admin health page | Missing | No settings/admin placement exists yet. |
| Organization AI enablement | Missing | No org feature flag/settings mechanism exists. |
| AI permission management | Fully supported | Existing RBAC manages `ai.use`. |
| Prompt/response retention | Out of scope | Prompts, responses and context are not stored. |
| Audit events | Fully supported | `ai.query`, `ai.query.refused`, `ai.query.failed`. |
| Cost/token metadata | Partially supported | Provider token counts are stored when available. |
| Privacy controls | Fully supported for current context | Explicit prompt allowlists exclude secrets, auth data, storage keys and user email. |
| Evaluation fixtures | Fully supported for current scope | API and UI tests cover context, safety, failures and rate limits. |
| Operational alerts | Missing | No metrics or alerting stack exists. |
| Multiple providers | Partially supported | Provider abstraction exists; only disabled and Ollama implementations exist. |
| Provider fallback | Out of scope | No fallback chain was added. |
| Persistent conversations | Out of scope | Request-scoped history only. |
| Billing | Out of scope | No billing/quota enforcement was added. |

## Rate-Limit Abstraction

`AiRateLimitStore` defines the adapter contract. The active implementation is `MemoryAiRateLimitStore`.

The store supports:

- `consume()` with organization and user dimensions.
- Window reset time, remaining requests and retry timing.
- Safe hashed keys with tenant namespaces.
- Expired bucket cleanup on consumption.
- Testable time injection.
- Readiness reporting.

Active store limitations:

- Process-local only.
- Not safe as the sole limit when multiple API instances serve traffic.
- Does not survive process restarts.
- Intended to be replaced by an atomic shared store adapter before horizontal scaling.

Future shared-store adapter requirements:

- Atomic increment plus expiry.
- Namespaced keys.
- Failure mode that does not accidentally lock out all tenants.
- Health/readiness reporting.
- Tests with mocked shared infrastructure.

## Configuration

Backend AI governance variables:

- `AI_RATE_LIMIT_WINDOW_MS`
- `AI_RATE_LIMIT_MAX_REQUESTS`
- `AI_RATE_LIMIT_MAX_ORGANIZATION_REQUESTS`
- `AI_HEALTH_CACHE_TTL_MS`
- `AI_HEALTH_TIMEOUT_MS`

Existing provider and prompt variables remain environment-controlled. Provider credentials, internal URLs and hostnames are not exposed by API responses.

## Failure Taxonomy

`ai.failure.ts` defines stable categories and safe HTTP mappings:

- `AI_DISABLED`
- `AI_PROVIDER_UNAVAILABLE`
- `AI_PROVIDER_TIMEOUT`
- `AI_PROVIDER_INVALID_RESPONSE`
- `AI_CONTEXT_UNAVAILABLE`
- `AI_SCOPE_NOT_FOUND`
- `AI_CONTEXT_PERMISSION_DENIED`
- `AI_RATE_LIMIT_EXCEEDED`
- `AI_REQUEST_VALIDATION_FAILED`
- `AI_READ_ONLY_REFUSED`
- `AI_INTERNAL_CONTEXT_FAILURE`

Frontend copy maps these codes to user-friendly messages and does not render raw provider/network details.

## Provider Health Model

`GET /ai/copilot/health` is authenticated and requires `ai.use`. The response includes only safe fields:

- enabled/configured/available flags
- status: `disabled`, `healthy`, `degraded`, `unavailable`
- provider type and model identifier
- last checked timestamp
- latency category
- degraded reason code
- rate-limit policy summary
- persistence flags showing prompts, responses and conversation history are not stored
- read-only mode

The response never includes provider base URL, credentials, raw stack traces, raw prompts or internal hostnames.

## Health Cache Strategy

`AiHealthService` caches provider health for `AI_HEALTH_CACHE_TTL_MS`, deduplicates concurrent probes, and bounds provider checks with `AI_HEALTH_TIMEOUT_MS`. This avoids page-load probe storms while keeping the application usable when the provider is unavailable.

## Usage Accounting

Usage accounting uses logs and `AuditLog`; no migration was added.

Safe audit metadata may include:

- request ID
- scope type and scope entity ID
- provider and model
- duration milliseconds and duration category
- source count
- result category
- success flag
- provider token counts when available

Audit metadata does not include full questions, answers, prompts, retrieved context, credentials, tokens, storage paths, presigned URLs, raw IP-derived analysis, or provider base URLs.

## Context Field Allowlists

Organization:

- id, name, slug, timezone, country, currency, plan, updatedAt

Project:

- id, name, bounded description, status, archived, startDate, endDate, updatedAt

Task:

- id, projectId, title, bounded description, status, priority, dueDate, archived, updatedAt, project name, assignee display name

Comment:

- id, taskId, author display name, bounded content, edited flag, updatedAt

Attachment:

- id, taskId, original name, MIME type, file size, createdAt

Activity:

- id, action, resource, actor display name, createdAt

User:

- id, display name, status, role names, createdAt

Excluded fields include password data, sessions, refresh tokens, verification/reset tokens, email addresses in AI context, provider credentials, storage object keys, presigned URLs, raw IP addresses, raw user agents and internal audit metadata.

## Read-Only Governance

Write-intent requests are refused before provider generation. Refusal categories cover create, update, edit, delete, archive, restore, assign, remove, upload, role changes, invitations, approvals and organization-setting changes. The refusal response makes clear that no action was executed.

This classifier is intentionally conservative and not a complete natural-language policy engine. Future work should expand deterministic fixtures as new write surfaces are added.

## Frontend Operational States

The Copilot page now handles:

- ready
- disabled
- degraded
- unavailable
- timeout
- rate-limited with `Retry-After`
- permission denied
- invalid scope
- general failure

The reusable `AiStatusIndicator` renders text plus icon state and does not rely on color alone. Health uses the existing TanStack Query cache and does not poll constantly.

## Operational Runbook

AI disabled unexpectedly:

- Check `AI_ENABLED` and `AI_PROVIDER` in the API environment.
- Confirm `GET /ai/copilot/health` returns `status=disabled`.
- Normal project/task/user features should remain available.

Ollama unavailable:

- Check API logs for `provider_unavailable` categories.
- Confirm the provider process is running and the configured model endpoint is reachable from the API host.
- Do not expose provider URL details to end users.

Ollama timeout or high latency:

- Check `provider_timeout` result categories and `durationCategory=timeout`.
- Tune `AI_REQUEST_TIMEOUT_MS` and provider capacity.
- Keep `AI_HEALTH_TIMEOUT_MS` low enough to avoid health-check pileups.

Model missing:

- Health may return unavailable or degraded.
- Confirm `AI_MODEL` exists in the provider runtime.
- Keep the frontend message generic.

Rate-limit complaints:

- Inspect response headers: `Retry-After`, `X-RateLimit-Remaining`, `X-RateLimit-Reset`.
- Tune `AI_RATE_LIMIT_MAX_REQUESTS`, `AI_RATE_LIMIT_MAX_ORGANIZATION_REQUESTS`, and `AI_RATE_LIMIT_WINDOW_MS`.
- Before horizontal scaling, replace memory mode with a shared atomic store.

Increased AI error rate:

- Filter audit logs by `resource=ai` and `action=ai.query.failed`.
- Group by `metadata.resultCategory`.
- Do not inspect prompts or answers because they are intentionally not stored.

Horizontal API scaling:

- Treat current rate limiting as degraded/process-local.
- Implement a shared-store adapter before adding more API instances behind load balancing.

Safe log inspection:

- Search by request ID, organization ID, user ID, result category and duration category.
- Do not expect full questions, prompts, answers, provider URLs or context records in logs.

Disable AI without disabling BizPilot:

- Set `AI_ENABLED=false` or `AI_PROVIDER=disabled` and restart the API process.
- Confirm normal non-AI routes continue to pass health checks.

## Tests

Backend coverage includes:

- rate-limit user/org isolation, expiry, remaining counts and readiness
- provider health caching and concurrent probe deduplication
- failure taxonomy mappings
- route health authorization
- rate-limit retry metadata
- provider timeout categorization
- safe audit metadata
- source marker validation and prompt-injection fixture coverage
- exclusion of email and password/storage fields from provider prompts

Frontend coverage includes:

- permission denial
- disabled/degraded provider states
- safe provider/model display
- validation
- source rendering from typed source data
- rate-limit retry timing
- question preservation after recoverable failure
- HTML-like model output rendered as text

## Known Limitations and Owner Decisions

- No migration was added; usage accounting remains audit/log based.
- No organization-level AI enablement exists because there is no current feature flag or org settings framework for it.
- No admin status page was added because there is no dedicated settings surface with suitable permissions yet.
- No distributed rate limiter exists until a shared store is introduced.
- No claim is made of complete prompt-injection prevention or formal compliance certification.

## Recommended Next Milestone

Add a shared infrastructure layer for cache/rate-limit adapters, then implement a Redis-backed `AiRateLimitStore` with atomic increments and production readiness checks. After that, add a small admin-safe AI status panel in the existing settings area once the settings architecture is finalized.
