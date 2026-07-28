# Project and Task Management

## Implemented scope

BizPilot AI supports organization-scoped Projects and Tasks using the existing Prisma models and API routes. This milestone improves the practical workflow without adding new database concepts.

## Projects

Supported backend routes:

- `GET /projects`
- `POST /projects`
- `GET /projects/:id`
- `PATCH /projects/:id`
- `DELETE /projects/:id`

Supported project fields:

- `name`
- `description`
- `status`: `PLANNED`, `ACTIVE`, `ON_HOLD`, `COMPLETED`, `CANCELLED`
- `startDate`
- `endDate`
- `color`
- `archived`
- `createdById`

Project list supports pagination, search, status filtering, archive-state filtering and created-date sorting. Project responses include backend-derived task metrics:

- `taskCount`: non-deleted tasks in the project
- `completedTaskCount`: non-deleted tasks with status `DONE`
- `progressPercentage`: rounded `completedTaskCount / taskCount * 100`, or `0` when the project has no tasks

Deletion uses the existing soft-delete behavior and also marks the project archived. Restore is not a dedicated backend route; archived projects can be restored by updating `archived` to `false` through `PATCH /projects/:id`.

## Tasks

Supported backend routes:

- `GET /tasks`
- `POST /tasks`
- `GET /tasks/:id`
- `PATCH /tasks/:id`
- `DELETE /tasks/:id`
- `PATCH /tasks/:id/status`
- `PATCH /tasks/:id/assignee`

Supported task fields:

- `projectId`
- `title`
- `description`
- `status`: `TODO`, `IN_PROGRESS`, `IN_REVIEW`, `DONE`, `CANCELLED`
- `priority`: `LOW`, `MEDIUM`, `HIGH`, `CRITICAL`
- `dueDate`
- `assigneeId`
- `estimatedHours`
- `actualHours`
- `archived`
- `createdById`

Task list supports pagination, search, status filtering, priority filtering, assignee filtering, project filtering, overdue filtering and created-date sorting. Task responses include relation summaries for project, assignee and creator plus non-deleted comment and ready attachment counts.

## Frontend workflow

Implemented frontend views:

- Project list with search, filters, sorting, pagination, progress, create/edit/archive/restore/delete and details navigation
- Project details with overview, owner, dates, progress and recent project tasks
- Task list with search, filters, sorting, pagination, status updates, assignee updates, delete, attachment access and details navigation
- Task details with description, project link, status, priority, assignee, creator, counts and attachment dialog reuse

## Permissions

Backend remains authoritative through existing RBAC middleware:

- `projects.read`
- `projects.create`
- `projects.update`
- `projects.delete`
- `tasks.read`
- `tasks.create`
- `tasks.update`
- `tasks.delete`

Frontend actions are hidden or disabled based on the current authenticated permission set, but this is only a UX layer.

## Tenant isolation

Project queries are scoped by authenticated `organizationId`. Task queries are scoped through the parent project organization and validate requested project and assignee IDs before list/create/update flows.

## Activity events

Existing audit events are preserved:

- `project.create`
- `project.update`
- `project.archive`
- `project.delete`
- `task.create`
- `task.update`
- `task.status.change`
- `task.assignee.change`
- `task.delete`

Audit metadata avoids large descriptions, tokens, storage URLs and credentials.

## Known limitations

The current schema does not contain project members, project managers, subtasks, dependencies, sprints, Gantt data or time tracking. Those were not implemented. The backend comments API exists, but the frontend comments workflow is not yet implemented. Kanban drag-and-drop was not added because the current UI already has accessible status controls and no drag-and-drop dependency is present.