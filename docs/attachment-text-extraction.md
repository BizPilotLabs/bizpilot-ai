# Attachment Text Extraction Foundation

BizPilot AI supports a narrow attachment text-extraction lifecycle for finalized task attachments. This milestone does not add OCR, embeddings, semantic search, AI summaries, Copilot ingestion, document search, or persistent AI conversations.

## Supported Formats

Supported extraction formats are intentionally narrow:

- `text/plain` with `.txt` or `.md`
- `application/pdf` with `.pdf`
- `application/vnd.openxmlformats-officedocument.wordprocessingml.document` with `.docx`

Uploads may still allow other attachment types for normal storage/download, but extraction marks them `UNSUPPORTED`.

Unsupported formats include images, scanned PDFs that require OCR, XLSX, PPTX, legacy `.doc`, arbitrary archives, executables, macros, scripts, embedded files, HTML, CSV, and any format requiring an external AI or extraction SaaS.

## Lifecycle

Attachment extraction state is stored on `Attachment`:

- `NOT_REQUESTED`: default for existing and new attachments.
- `PENDING`: an authenticated user requested extraction and the in-process dispatcher accepted or will attempt work.
- `PROCESSING`: the local worker claimed the pending attachment.
- `COMPLETED`: bounded plain text is persisted.
- `FAILED`: extraction failed with a stable safe error category.
- `UNSUPPORTED`: metadata is not in the supported extraction allowlist.

Legal transitions:

- `NOT_REQUESTED` -> `PENDING`
- `PENDING` -> `PROCESSING`
- `PROCESSING` -> `COMPLETED`
- `PROCESSING` -> `FAILED`
- `FAILED` -> `PENDING` through explicit retry
- `UNSUPPORTED` -> `PENDING` through explicit retry, in case future code supports the type

Deleted or incomplete attachments are not processed. Attachment deletion clears persisted extracted text.

## Persistence

Persistence is justified because the UI must show status across requests, extraction must not repeat accidentally, retries need stable state, and future milestones may use extracted text after separate design review.

The schema stores:

- `extractionStatus`
- `extractedText`
- `extractionErrorCode`
- request/start/completion timestamps
- extractor name/version
- stored character count
- truncation flag

No embeddings, vector IDs, prompts, AI outputs, presigned URLs, object keys, stack traces, or parser internals are persisted.

## Limits

Default environment limits:

- `ATTACHMENT_EXTRACTION_MAX_FILE_BYTES=8388608`
- `ATTACHMENT_EXTRACTION_MAX_TEXT_CHARS=60000`
- `ATTACHMENT_EXTRACTION_TIMEOUT_MS=15000`
- `ATTACHMENT_EXTRACTION_WORKER_CONCURRENCY=1`
- `ATTACHMENT_EXTRACTION_WORKER_QUEUE_SIZE=25`

Plain text has an extractor-level 1 MB cap. PDF and DOCX use an 8 MB extractor cap. PDF text extraction is limited to the first 50 pages. Text is sanitized, null bytes are removed, control characters are stripped except tabs/newlines, line endings are normalized, and stored text is truncated to the configured maximum.

## Storage Retrieval

Extraction reads object bytes through the backend storage provider using `getObjectContent`. It does not fetch public download URLs and does not expose object keys or storage credentials to controllers or the frontend. Retrieval is bounded by metadata checks, stream-size checks, memory caps, and timeout.

## Background Processing

The current worker is an in-process dispatcher. It provides:

- bounded concurrency
- bounded queue capacity
- duplicate key prevention inside the process
- failure containment
- metrics for active and queued work
- graceful shutdown waiting up to the API shutdown timeout

It is not durable, distributed, or guaranteed across crashes/restarts. A future durable queue can replace the dispatcher without changing controllers.

## API Endpoints

- `POST /attachments/:id/extraction`: request extraction; requires `attachments.create`.
- `GET /attachments/:id/extraction`: read status; requires `attachments.read`.
- `POST /attachments/:id/extraction/retry`: retry failed or unsupported extraction; requires `attachments.create`.
- `GET /attachments/:id/extraction/text`: read bounded extracted plain text; requires `attachments.read`.

All lookups are organization-scoped through the authenticated principal.

## Failure Taxonomy

Persisted failure categories are stable and safe:

- `UNSUPPORTED_FILE_TYPE`
- `FILE_TOO_LARGE`
- `FILE_MISSING`
- `UPLOAD_INCOMPLETE`
- `ATTACHMENT_DELETED`
- `MIME_MISMATCH`
- `EXTENSION_MISMATCH`
- `INVALID_ENCODING`
- `ENCRYPTED_DOCUMENT`
- `MALFORMED_DOCUMENT`
- `EXTRACTION_TIMEOUT`
- `PARSER_FAILURE`
- `STORAGE_UNAVAILABLE`
- `WORKER_UNAVAILABLE`

Raw parser/storage errors are not returned or persisted.

## Audit Events

Audit events are written for:

- `attachment.extraction.requested`
- `attachment.extraction.retried`
- `attachment.extraction.completed`
- `attachment.extraction.failed`

Audit metadata includes IDs, MIME category, result/failure category, extractor name, character count, truncation flag, and duration bucket. It does not include extracted text, object keys, presigned URLs, parser errors, or file binary data.

## Metrics

Prometheus metrics use low-cardinality labels only:

- `bizpilot_attachment_extraction_results_total`
- `bizpilot_attachment_extraction_duration_seconds`
- `bizpilot_background_jobs_total`
- `bizpilot_background_worker_active_jobs`
- `bizpilot_background_worker_queued_jobs`

Labels are limited to MIME category, extractor, result category, truncation, worker type, and job name. IDs, filenames, object keys, user data, text, and error messages are forbidden.

## Logging

Logs use safe structured metadata only: result category, extractor type, MIME category, duration, character count, truncation, worker type, and stable failure code. Logs must not include extracted text, object keys, presigned URLs, full parser output, raw binary data, storage credentials, or stack traces as labels.

## Frontend Behavior

The task attachment dialog shows extraction status beside each attachment:

- Not extracted
- Pending
- Processing
- Ready
- Failed
- Unsupported

Users with attachment create access can request/retry extraction. Users with attachment read access can view extracted text when ready. The viewer renders plain text in a bounded modal, wraps long text, shows truncation notice, and provides a copy action. Download and delete flows remain independent of extraction failures.

## Operations Runbook

- Stuck in `PENDING`: confirm API process is running and worker queue is not full; retry by calling the retry endpoint after marking failed through an operator-approved data fix if needed.
- Stuck in `PROCESSING`: the in-process worker may have crashed or the process may have restarted mid-job. Operators can reset to `FAILED` with `EXTRACTION_TIMEOUT` and retry.
- Worker unavailable: check queue capacity, shutdown state, API logs, and `bizpilot_background_worker_*` metrics.
- Storage object missing: confirm normal attachment download. If download also fails, treat as storage lifecycle issue.
- Parser timeout/high latency: lower file-size limits or text-character limits, inspect format mix, and watch duration histograms.
- Unsupported file: no action unless future milestones add support.
- Encrypted PDF or corrupted DOCX: ask the user to upload an unprotected, valid document.
- Memory pressure: reduce concurrency to 1 and lower max file bytes.
- Disable extraction safely: set `ATTACHMENT_EXTRACTION_ENABLED=false`; upload/download continue to work.

## Future Work

Recommended future milestones require separate architecture decisions:

- durable distributed queue
- retry backoff and scheduled stuck-job recovery
- virus scanning
- file signature validation beyond current parser/container checks
- Copilot ingestion of extracted text
- embeddings and vector search
- semantic retrieval
- OCR or scanned-document handling
