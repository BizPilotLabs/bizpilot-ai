# API Notes

## User Management

The backend supports organization-scoped user management through the authenticated user's organization context. The frontend must not send or trust an `organizationId` for these operations.

Supported endpoints:

- `GET /users` with `page`, `limit`, `search`, and `sort` query parameters. Requires `users.read`.
- `POST /users` with `firstName`, `lastName`, `email`, `password`, and `roleIds`. Requires `users.create`.
- `GET /users/:id`. Requires `users.read`.
- `PATCH /users/:id` with `firstName`, `lastName`, and/or `avatar`. A user may update their own profile; Owner/Admin can update other users.
- `DELETE /users/:id`. Requires `users.delete`; the service prevents deleting yourself and deleting the Organization Owner.
- `GET /users/:id/roles`. Requires `roles.read`.
- `PATCH /users/:id/roles` with `roleIds`. Requires `roles.update`; the RBAC service restricts role management to Owner/Admin.

The current create-user contract creates a user with an initial password. There is no invitation-token or email-delivery workflow implemented yet.

Unsupported user-management operations:

- Activate/deactivate user status changes.
- Restore soft-deleted users.
- Password reset for managed users.
- Invitation email workflow.
- User list filtering by status or role.

Known schema decision:

- `User.email` is currently globally unique in Prisma. The user service checks for duplicate emails inside the authenticated organization before creation, but the database still rejects duplicate emails across all organizations. Changing this requires a deliberate migration and product decision about whether accounts are global identities or organization-scoped accounts.

## Organization Management

Organization management is scoped to the authenticated user's organization. The frontend must not send an `organizationId`; the backend derives organization context from the JWT access token.

Supported endpoints:

- `GET /organizations/me`. Requires `organizations.read`. Returns the current organization profile.
- `PUT /organizations/me`. Requires `organizations.update`. Supports `name`, `logo`, `timezone`, `country`, and `currency`.
- `PATCH /organizations/me/settings`. Requires `organizations.update`. Supports `timezone` and `currency`.

Current supported editable fields are limited by the Prisma `Organization` model:

- `name`
- `logo` as a URL or `null`
- `timezone`
- `country` as a two-letter code or `null`
- `currency` as a three-letter code

Unsupported in the current schema/API:

- Binary logo upload.
- Website, organization email, phone, address, description, industry, language, locale, preferences, billing, subscriptions, and invitation settings.

Logo management currently uses the existing `logo` URL field only. Cloud storage integration is intentionally not implemented.

## RBAC Management

RBAC resources are organization-scoped. The backend derives organization context from the authenticated JWT and validates roles inside that organization before reads, mutations, permission assignment, and user-role assignment.

Supported endpoints:

- `GET /roles`. Requires `roles.read`. Returns organization roles with assigned permissions and `userCount`.
- `POST /roles`. Requires `roles.create`. Supports `name`, `description`, and `permissionIds`.
- `GET /roles/:id`. Requires `roles.read`.
- `PATCH /roles/:id`. Requires `roles.update`. Supports `name` and `description` for custom roles.
- `DELETE /roles/:id`. Requires `roles.delete`. Custom roles can be deleted only when they are not assigned to active users.
- `GET /permissions`. Requires `roles.read`.
- `PATCH /roles/:id/permissions`. Requires `roles.update`. Replaces the permission set for a custom role.
- `GET /users/:id/roles`. Requires `roles.read`.
- `PATCH /users/:id/roles`. Requires `roles.update`.

Protected-role behavior:

- System roles cannot be deleted.
- System roles cannot be edited.
- System role permissions cannot be edited.
- Reserved system role names are blocked for custom role creation and renaming.

Known permission catalog notes:

- Permission identifiers use `resource.action` format.
- Permissions are global catalog records, not organization-scoped records.
- `organizations.manage` is retained for compatibility while `organizations.update` is the current route permission.
- The catalog includes permissions used by current backend modules, including teams, comments, attachments, and activities.

Unsupported in the current API:

- Server-side role search, pagination, and sorting.
- Add-one/remove-one permission endpoints; permission updates use replacement through `PATCH /roles/:id/permissions`.
- Explicit last-owner/self-demotion protections beyond current Owner/Admin management rules.
