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
