# Task Comments and Collaboration

## Implemented scope

BizPilot AI supports plain-text task comments through the existing backend comments module and a new frontend comments workflow embedded in Task Details.

## Database model

The existing `Comment` Prisma model is used without migration.

Fields:

- `id`
- `taskId`
- `organizationId`
- `authorId`
- `content`
- `edited`
- `createdAt`
- `updatedAt`
- `deletedAt`

Relations:

- `task` references `Task`
- `organization` references `Organization`
- `author` references `User`

Indexes exist on task, organization, author, created timestamp and soft-delete state. There are no parent-comment, thread, mention, reaction or attachment fields.

## API endpoints

- `GET /tasks/:taskId/comments`
- `POST /tasks/:taskId/comments`
- `PATCH /comments/:id`
- `DELETE /comments/:id`

List query parameters:

- `page`
- `limit`, max `100`
- `sort`: `asc` or `desc`

Request body for create and update:

```json
{
  "content": "Plain text comment"
}
```

Comment response includes safe author summary:

- `id`
- `taskId`
- `organizationId`
- `authorId`
- `author.id`
- `author.email`
- `author.firstName`
- `author.lastName`
- `author.avatar`
- `author.isDeleted`
- `content`
- `edited`
- `createdAt`
- `updatedAt`

## Validation

Comment content is plain text only, trimmed by backend validation, required, and limited to 5,000 characters. The frontend applies the same Zod validation before submission.

## Permissions and ownership

Routes use existing RBAC permissions:

- `comments.read`
- `comments.create`
- `comments.update`
- `comments.delete`

The backend derives `authorId` from the authenticated user. The frontend never sends author or organization ownership context.

Editing and deleting are allowed when:

- the authenticated user is the comment author, or
- the authenticated user is Owner/Admin in the same organization

The route permission is still required by middleware.

## Tenant and task access

Comment listing and creation verify that the task belongs to the authenticated organization through the task's project. Comment update and deletion look up comments by authenticated organization and exclude soft-deleted comments.

## Delete behavior

Deletion is soft delete through `deletedAt`. Deleted comments are excluded from list responses and from task comment counts through the Task DTO relation count.

## Frontend integration

`TaskCommentsSection` is embedded in the Task Details page. It supports:

- loading state
- error state with retry
- empty state
- add comment form
- safe multiline rendering
- author avatar or initials
- deleted-author fallback
- timestamps
- edited indicator
- edit mode
- delete confirmation
- pagination
- permission-aware controls

TanStack Query invalidates both comment task queries and task queries after create, update and delete so visible task comment counts refresh safely.

## Activity events

Existing audit events are preserved:

- `comment.create`
- `comment.update`
- `comment.delete`

Audit metadata includes comment and task identifiers only. It does not include full comment bodies, tokens, credentials or authorization data.

## Known limitations

The current product does not support mentions, reactions, rich text, threaded replies, real-time updates, comment attachments or notifications. Those concepts were intentionally not added because the schema and API do not support them.