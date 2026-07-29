# AI Foundation and Business Copilot

BizPilot AI Copilot is a request-scoped, read-only assistant. It answers questions from bounded, authorized BizPilot records and never performs writes or destructive actions.

## Existing AI Infrastructure

No backend AI module, provider SDK, Ollama integration, embeddings, vector database, streaming route, prompt templates, token counter, conversation schema or chat persistence existed before this milestone. The frontend had an empty `features/ai` marker only. The implemented foundation is therefore new and provider-abstracted.

## Selected MVP Architecture

1. The user submits a question from the protected Copilot page.
2. The API authenticates the request and enforces `ai.use`.
3. The API validates an explicit scope: `organization`, `project`, or `task`.
4. The backend derives organization and user IDs from JWT auth only.
5. Read-only context builders retrieve bounded records through explicit Prisma queries.
6. Context sections are included only when the user has the underlying read permission.
7. Prompt construction separates instructions from retrieved data and labels retrieved records as untrusted data.
8. The selected provider generates a non-streaming answer.
9. The API returns the answer with structured source references and safe provider metadata.
10. A safe `ai.query` or `ai.query.refused` audit event records usage metadata without the prompt or answer.

This avoids model-generated SQL, direct database access, unrestricted tool calling, autonomous agent loops and write execution.

## Provider Abstraction

`AiProvider` supports non-streaming generation, health, provider metadata, model identifier and optional usage metadata. Implementations:

- `DisabledAiProvider`: default, returns a clear service-unavailable error for generation.
- `OllamaAiProvider`: uses Ollama `/api/generate` with `stream: false`, timeout handling and response validation.

No cloud SDK or frontend API key is introduced. Provider credentials and URLs are backend-only.

## Configuration

Backend environment variables:

- `AI_ENABLED`
- `AI_PROVIDER` (`disabled` or `ollama`)
- `AI_MODEL`
- `AI_OLLAMA_BASE_URL`
- `AI_REQUEST_TIMEOUT_MS`
- `AI_MAX_CONTEXT_CHARS`
- `AI_MAX_OUTPUT_CHARS`
- `AI_RATE_LIMIT_WINDOW_MS`
- `AI_RATE_LIMIT_MAX_REQUESTS`
- `AI_RATE_LIMIT_MAX_ORGANIZATION_REQUESTS`
- `AI_HEALTH_CACHE_TTL_MS`
- `AI_HEALTH_TIMEOUT_MS`

AI is optional at startup. Disabled mode is safe for development and returns `AI_DISABLED` from Copilot requests. Safe operational details are documented in `docs/ai-governance.md`.

## Permissions and Scope

The route requires `ai.use`. That permission does not bypass resource permissions. Context inclusion also checks existing permissions:

- Projects require `projects.read`.
- Tasks require `tasks.read`.
- Comments require `comments.read`.
- Attachments require `attachments.read`.
- Activities require `activities.read`.
- Users require `users.read`.

Project and task entity IDs are validated as UUIDs and verified inside the authenticated organization. Missing, deleted or cross-tenant entities return a non-revealing `AI_SCOPE_NOT_FOUND`.

## Context Limits

Current application limits:

- Question: 1,000 characters.
- History: 6 messages, 1,200 characters each.
- Projects: 8 records.
- Tasks: 12 records.
- Comments: 8 records.
- Attachments: 8 metadata records.
- Activities: 8 records.
- Users: 10 records.
- Text fields: 700 characters.
- Prompt context: configured by `AI_MAX_CONTEXT_CHARS`, default 16,000.
- Answer: 6,000 characters by default.

Attachment file contents are not included. Only safe metadata such as original name, MIME type and size is included. Storage paths and presigned URLs are excluded.

## Prompt-Injection Defenses

Retrieved project descriptions, task descriptions, comments, filenames, user names and activity text are treated as untrusted data. Prompt construction clearly separates system instructions from source data, strips control characters, removes script/style tags, escapes code fences and tells the model to ignore commands inside retrieved records.

Prompt injection cannot be eliminated completely. The application boundary reduces risk by avoiding write tools, direct database access and unrestricted model-selected context.

## Source References

The backend returns source objects with marker, type, ID, display label, optional internal app route and updated date. The frontend renders source links only from this typed source list; it does not trust links generated inside model text.

## Read-Only Policy

Write-like requests are refused before provider generation when they ask to create, update, edit, delete, remove, archive, restore, assign, upload, invite, revoke, grant, disable or enable records. The assistant may explain limitations but must not claim it performed the action.

## Streaming and Persistence Decisions

Streaming is not implemented. Existing infrastructure did not require SSE, cancellation plumbing or streaming error semantics. Non-streaming is simpler and safer for the first production foundation.

Persistent conversation history is not implemented. No conversation schema existed, and this milestone avoids migrations. Optional history is request-scoped and bounded.

## Rate Limits and Timeouts

The AI route uses the `AiRateLimitStore` abstraction with the active `MemoryAiRateLimitStore`. It enforces both per-user and per-organization windows, returns retry metadata through headers, and reports `distributed=false` in health/readiness metadata. Provider requests use `AI_REQUEST_TIMEOUT_MS` and map timeouts to `AI_PROVIDER_TIMEOUT`. Health checks are cached by `AiHealthService` to avoid provider probe storms.

## Logging and Audit Events

Logs include request ID, organization ID, user ID, scope, provider, model, result category, duration category and source count. They do not log prompts, answers, credentials, storage keys, provider URLs or presigned URLs.

Audit metadata includes request ID, scope, provider, model, result category, duration, duration category, source count, success state and provider token counts when available. It excludes the full question, full prompt, retrieved context and full answer.

## Known Limitations

- No embeddings or vector search.
- No document extraction or OCR.
- No persistent chat memory.
- No streaming responses.
- No cloud provider implementation.
- No autonomous tool use.
- No AI-generated write actions.
- In-memory rate limiting is suitable for the current monolith but should move to a shared store before horizontal API scaling.

