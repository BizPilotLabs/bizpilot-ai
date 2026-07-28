# Activity Feed and Audit History

## Backend contract

The Activity Feed reads from the existing `AuditLog` table through the existing `GET /activities` and `GET /activities/:id` endpoints. It does not create a second audit system.

Required permission: `activities.read`.

All queries are scoped by the authenticated request organization. The frontend never sends an organization identifier for ownership decisions.

Supported list query parameters:

- `page`
- `limit`
- `sort`
- `search`
- `action`
- `resource`
- `userId`
- `startDate`
- `endDate`

The response contains `activities` and `pagination`.

## Metadata safety

Activity responses sanitize audit metadata before returning it. Sensitive keys containing password, token, secret, cookie, authorization, credential, session, MFA, stack, or private key terminology are excluded from API responses.

Historical records are not deleted or rewritten. If older audit metadata stored sensitive keys, the API response serializer prevents those values from being exposed through Activity endpoints.

## Frontend behavior

The Activity page uses TanStack Query and the existing Axios client. Filter and page state are synchronized to URL query parameters. The page supports loading, error, empty, filtered-empty, pagination, details, and safe human-readable activity formatting.

The actor filter is not shown in the UI because the current frontend should not load all users solely to populate that control. The backend still validates `userId` for direct API use.

## Known normalization gaps

Audit emitters use dotted action identifiers and resource strings consistently enough for display, but metadata shapes differ by module. The Activity formatter handles the known current identifiers and falls back safely for unknown future events.
