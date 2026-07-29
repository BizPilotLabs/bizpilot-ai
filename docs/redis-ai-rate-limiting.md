# Shared Redis Infrastructure and Distributed AI Rate Limiting

This milestone adds a small Redis infrastructure boundary for distributed AI rate limiting only. It does not add general caching, queues, session storage, distributed locks, billing, AI conversation persistence, embeddings or vector search.

## Existing Infrastructure Discovered

The API already had:

- Express app factory in `src/app.ts`.
- HTTP bootstrap and graceful shutdown in `src/server.ts`.
- Prisma lifecycle helpers.
- Pino logging.
- Simple `/health` liveness endpoint.
- AI `AiRateLimitStore` abstraction with memory implementation.
- No Redis client dependency, Docker Compose, deployment manifests, queues, distributed locks, retry utilities, timeout utilities, cache abstraction or metrics pipeline.

## Capability Analysis

| Capability | Status | Notes |
| --- | --- | --- |
| Redis client dependency | Fully supported | Uses `redis` npm package. |
| Shared connection lifecycle | Fully supported | Single `ManagedRedisConnection`. |
| Connection timeout | Fully supported | `REDIS_CONNECT_TIMEOUT_MS`. |
| Command timeout | Fully supported | `REDIS_COMMAND_TIMEOUT_MS`. |
| Reconnect strategy | Partially supported | Bounded reconnect attempts configured on Redis socket. |
| Graceful shutdown | Fully supported | `disconnectRedis()` runs before Prisma disconnect. |
| Readiness reporting | Fully supported | Redis health and AI rate-limit readiness are safe responses. |
| Liveness reporting | Fully supported | `/health` still exposes process health shape. |
| Optional Redis mode | Fully supported | Redis disabled by default. |
| Mandatory production mode | Partially supported | `REDIS_REQUIRED_IN_PRODUCTION` validates URL and impacts readiness. |
| Key namespacing | Fully supported | Prefix, environment, feature and version included. |
| Atomic increment/expiration | Fully supported | Single Lua script handles both dimensions. |
| Test containers | Out of scope | No existing container test pattern. |
| Redis mocking | Fully supported | Unit tests mock Redis SDK and command client. |
| Horizontal AI rate limiting | Fully supported when `AI_RATE_LIMIT_STORE=redis`. |
| Fail-open behavior | Out of scope | Redis AI limiter intentionally fails closed. |
| Metrics | Missing | No metrics pipeline exists. |
| Distributed locks, queues, caching | Out of scope | Not implemented. |

## Design Decision

The implementation uses the smallest reusable boundary:

```text
core/redis/ManagedRedisConnection
  -> Redis command lifecycle, health, timeout and shutdown
modules/ai/RedisAiRateLimitStore
  -> AI-specific atomic limiter algorithm
```

A broad generic key-value abstraction was not added because atomic dual-dimension rate limiting needs Redis script semantics. The Redis SDK stays out of AI services and controllers.

## Dependency Choice

The selected dependency is `redis`.

Rationale:

- Mature official Redis client for Node.js.
- TypeScript-compatible.
- Supports lifecycle hooks, reconnect strategy, `EVAL`, `PING`, `QUIT` and command promises.
- Works with Node.js 20+.
- Easy to mock without a live Redis server.

Only one Redis client library was added.

## Environment Variables

Backend-only settings:

- `REDIS_ENABLED`
- `REDIS_URL`
- `REDIS_CONNECT_TIMEOUT_MS`
- `REDIS_COMMAND_TIMEOUT_MS`
- `REDIS_HEALTH_CACHE_TTL_MS`
- `REDIS_MAX_RECONNECT_ATTEMPTS`
- `REDIS_KEY_PREFIX`
- `REDIS_REQUIRED_IN_PRODUCTION`
- `AI_RATE_LIMIT_STORE` (`memory` or `redis`)

Redis is disabled by default. `AI_RATE_LIMIT_STORE=redis` requires `REDIS_URL`. The application does not expose `REDIS_URL`, hostnames, usernames, passwords, database numbers or raw Redis errors through API responses.

Boolean parsing is explicit: strings such as `false`, `0`, `no`, `off` and empty values parse to false.

## Connection Lifecycle

`ManagedRedisConnection`:

- Creates at most one Redis client.
- Does not create clients per request.
- Connects during API bootstrap only when Redis is enabled or selected for AI rate limiting.
- Applies bounded connection and command timeouts.
- Uses bounded reconnect attempts.
- Logs safe categories only.
- Caches health probes for `REDIS_HEALTH_CACHE_TTL_MS`.
- Closes during graceful shutdown.
- Avoids open handles in tests through mocked clients and `disconnect()`.

If Redis is disabled, no Redis client is created.

## Health and Readiness

`GET /health` remains the general liveness endpoint and now includes safe Redis dependency metadata. It returns `503` only when Redis is required and unavailable.

`GET /ai/copilot/health` includes rate-limit readiness:

- store type: `memory` or `redis`
- distributed: boolean
- configured limits and window
- available: boolean
- safe detail string

Ordinary responses never include Redis URLs, keys or credentials.

## Redis Health Model

Safe fields:

- enabled
- configured
- required
- available
- status: `disabled`, `healthy`, `degraded`, `unavailable`
- checkedAt
- latencyCategory
- failureCategory

Unsafe fields are intentionally excluded: URL, host, port, username, password, TLS details, raw errors and client internals.

## Key Namespace and Hashing

Redis rate-limit keys follow this pattern:

```text
<REDIS_KEY_PREFIX>:<NODE_ENV>:ai-rate-limit:v1:<dimension>:<hashed identifiers>:<windowStart>
```

Properties:

- Prefix is configurable and validated.
- Environment and version isolate deployments and future migrations.
- Organization and user identifiers are SHA-256 hashed and truncated.
- Raw emails, prompts, answers, project names and questions are never used in keys.
- User and organization dimensions cannot collide.
- Keys receive explicit expiration through the Lua script.

## Atomic Limiter Algorithm

`RedisAiRateLimitStore` uses one Lua script for both dimensions:

1. Increment user key.
2. Set user key expiration when first created.
3. Increment organization key.
4. Set organization key expiration when first created.
5. Check both limits.
6. If either limit is exceeded, decrement both keys and reject.
7. Return counts, TTLs and exceeded dimensions.

This avoids non-atomic `GET`/`SET`/`EXPIRE` sequences and prevents unfair allowance consumption when the combined decision rejects the request.

## Dual-Dimension Behavior

- User limit exceeded: returns `AI_RATE_LIMIT_EXCEEDED`, user retry timing and user limit metadata.
- Organization limit exceeded: returns `AI_RATE_LIMIT_EXCEEDED`, organization retry timing and organization limit metadata.
- Both exceeded: organization dimension is preferred for the public metadata.
- Redis command failure: returns `AI_RATE_LIMIT_STORE_UNAVAILABLE` and does not call the AI provider.

`X-RateLimit-Remaining` represents the effective remaining allowance across both dimensions.

## Failure Policy

Redis-backed AI rate limiting fails closed. If `AI_RATE_LIMIT_STORE=redis` and Redis cannot enforce limits, AI queries are rejected with a safe temporary-unavailable error.

Memory mode remains available for local development and tests. The application does not silently switch from Redis to memory at runtime.

## Frontend Behavior

The Copilot page handles `AI_RATE_LIMIT_STORE_UNAVAILABLE` with safe copy:

> AI governance service is temporarily unavailable. Please try again in a moment.

The current question is preserved, raw Redis terms and URLs are not shown, and normal navigation remains available.

## Local Development

Default local mode:

```text
AI_RATE_LIMIT_STORE=memory
REDIS_ENABLED=false
```

Optional local Redis mode:

```text
REDIS_ENABLED=true
REDIS_URL=redis://localhost:6379/0
AI_RATE_LIMIT_STORE=redis
```

A local Redis container can be started manually if desired:

```text
docker run --rm -p 6379:6379 redis:7
```

No Docker Compose file was added because the repository has no deployment framework to extend.

## Testing

Default tests do not require a live Redis instance.

Covered by unit tests:

- Redis connection disabled mode.
- Successful connection, health cache and graceful shutdown.
- Failed connection classification.
- Duplicate connection prevention.
- Redis limiter script invocation.
- User and organization limit rejection.
- Key hashing and namespace behavior.
- Safe command failure mapping.
- Memory store regression coverage.

Covered by route/frontend tests:

- Redis limiter success through the AI route using a mocked store.
- Redis limiter fail-closed behavior.
- Provider is not called when limiter rejects.
- Safe audit metadata for rate-limit and store failures.
- Frontend governance-unavailable state and question preservation.

No optional real Redis integration test was added because no existing containerized integration-test pattern exists.

## Operational Runbook

Redis unavailable:

- Check `/health` dependency status and `/ai/copilot/health` rate-limit readiness.
- AI queries fail closed only when Redis is the selected AI limiter store.
- Core non-AI features should remain available unless Redis is explicitly required in production readiness.

Connection timeout:

- Inspect safe log category `connection_timeout`.
- Tune `REDIS_CONNECT_TIMEOUT_MS` only after verifying network path and Redis health.

Authentication or TLS failure:

- Health reports unavailable with safe failure category.
- Inspect Redis credentials and TLS configuration outside application logs.
- Do not paste full Redis URLs into incident notes.

High Redis latency:

- Check `latencyCategory` in health responses.
- Tune Redis capacity or network placement before increasing command timeouts.

Rate-limit command failure:

- AI returns `AI_RATE_LIMIT_STORE_UNAVAILABLE`.
- Provider is not called.
- Audit logs contain `resultCategory=rate_limit_store_unavailable`.

Unexpected AI rate-limit rejections:

- Inspect `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` and `Retry-After`.
- Compare user and organization configured limits.

Memory store accidentally used in production:

- Check `/ai/copilot/health.rateLimit.store`.
- Set `AI_RATE_LIMIT_STORE=redis` and configure `REDIS_URL` before horizontal API scaling.

Redis key growth:

- Keys are namespaced and expiring.
- Confirm TTLs exist with Redis operational tooling.
- Use isolated prefixes per environment.

Switching AI off safely:

- Set `AI_ENABLED=false` or `AI_PROVIDER=disabled`.
- Non-AI routes remain available.

Restoring AI after Redis recovery:

- Confirm `/health` Redis dependency is available.
- Confirm `/ai/copilot/health.rateLimit.available=true`.
- Retry Copilot queries.

## Security Review

- Redis credentials are backend-only.
- Redis URL is never exposed in API responses.
- Redis keys are derived from trusted auth identifiers and hashed.
- Users cannot control Redis commands, scripts or key namespaces.
- Limiter keys have explicit TTLs.
- Reconnect attempts and timeouts are bounded.
- Redis mode does not silently fall back to memory.
- Logs use safe status/failure categories.

## Remaining Limitations

- No metrics or alerting pipeline exists.
- No live Redis integration test is included by default.
- No Docker Compose or production manifest was added.
- No multi-cluster Redis support.
- No general cache abstraction beyond the managed Redis command boundary.
