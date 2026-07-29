# Destructive Flows

BizPilot destructive flows use soft deletion unless a module explicitly owns external resources that must be removed. API behavior should stay organization-scoped, RBAC-protected, and generic in failure cases so cross-tenant resource discovery is not possible.

## Backend Route Test Pattern

Route-level destructive tests should exercise the Express route through `createApp()` while mocking authentication, RBAC lookup, repositories, and external providers. This verifies the controller-to-service boundary without requiring a database.

Required assertions for destructive routes:

- Missing access tokens return `AUTH_TOKEN_REQUIRED` before repository work.
- Missing permission returns `RBAC_PERMISSION_DENIED` before service/repository work.
- Invalid UUID route parameters fail validation before lookup.
- Resource lookups always include `request.auth.organizationId`.
- Mutation context includes the authenticated user id and request metadata such as user agent.
- Not-found responses do not reveal whether the resource exists in another organization.
- External storage errors never expose storage keys, bucket names, credentials, or tenant paths.

Current route coverage:

- Projects: archive and restore through `PATCH /projects/:id`, and soft delete through `DELETE /projects/:id`.
- Tasks: soft delete through `DELETE /tasks/:id`.
- Attachments: finalize upload through `POST /attachments/:id/complete`, authorize download through `GET /attachments/:id/download`, and soft delete plus object removal through `DELETE /attachments/:id`.

## Frontend Confirmation Pattern

Use `ConfirmationDialog` from `@/components/ui` for destructive UI actions. The component is built on the shared `Modal`, starts focus on the safer cancel action, blocks dismissal while pending, keeps errors visible inside the dialog, and leaves the final mutation behavior to the caller.

Copy should describe the real backend behavior. For soft deletes, avoid irreversible language such as "This action cannot be undone" unless the backend truly performs a hard delete. Prefer wording such as:

- "This project will be soft deleted and hidden from active project lists."
- "This task will be soft deleted and hidden from active task lists."
- "This attachment will be soft deleted and its stored file will be removed from object storage."

Representative migrations now use the shared dialog for project deletion, task deletion, comment deletion, and attachment deletion.

## Storage-Sensitive Attachment Rules

Attachment deletion also calls the configured storage provider before marking attachment metadata deleted. Tests should verify both operations and ensure failure responses remain safe. Download authorization responses must return only the presigned URL and expiry; they must not include `storagePath` or provider credentials.
