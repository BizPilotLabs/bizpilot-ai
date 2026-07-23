import type { Express } from "express";
import swaggerJSDoc, { type Options } from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";

type Schema = Record<string, unknown>;

const security = [{ bearerAuth: [] }];
const content = (schema: Schema): Schema => ({ content: { "application/json": { schema } } });
const body = (ref: string): Schema => ({ required: true, ...content({ $ref: ref }) });
const id = (name: string): Schema => ({ name, in: "path", required: true, schema: { type: "string", format: "uuid" } });
const pageParams = [
  { name: "page", in: "query", schema: { type: "integer", minimum: 1, default: 1 } },
  { name: "limit", in: "query", schema: { type: "integer", minimum: 1, maximum: 100, default: 20 } },
  { name: "sort", in: "query", schema: { type: "string", enum: ["asc", "desc"], default: "desc" } },
];
const ok = (schema: Schema, description = "Successful response"): Schema => ({
  description,
  ...content({ type: "object", required: ["success", "data"], properties: { success: { type: "boolean", const: true }, data: schema } }),
});
const list = (name: string, ref: string): Schema =>
  ok({
    type: "object",
    required: [name, "pagination"],
    properties: {
      [name]: { type: "array", items: { $ref: ref } },
      pagination: { $ref: "#/components/schemas/Pagination" },
    },
  });
const errors = {
  400: { $ref: "#/components/responses/BadRequest" },
  401: { $ref: "#/components/responses/Unauthorized" },
  403: { $ref: "#/components/responses/Forbidden" },
  404: { $ref: "#/components/responses/NotFound" },
  409: { $ref: "#/components/responses/Conflict" },
};
const securedGet = (tag: string, summary: string, response: Schema, parameters: Schema[] = []): Schema => ({
  tags: [tag],
  summary,
  security,
  parameters,
  responses: { 200: response, ...errors },
});
const securedPost = (tag: string, summary: string, requestRef: string, response: Schema, parameters: Schema[] = []): Schema => ({
  tags: [tag],
  summary,
  security,
  parameters,
  requestBody: body(requestRef),
  responses: { 201: response, ...errors },
});
const securedPatch = (tag: string, summary: string, requestRef: string, response: Schema, parameters: Schema[]): Schema => ({
  tags: [tag],
  summary,
  security,
  parameters,
  requestBody: body(requestRef),
  responses: { 200: response, ...errors },
});
const securedDelete = (tag: string, summary: string, parameters: Schema[]): Schema => ({
  tags: [tag],
  summary,
  security,
  parameters,
  responses: { 200: ok({ type: "object", properties: { deleted: { type: "boolean" }, removed: { type: "boolean" } } }), ...errors },
});

const uuid = { type: "string", format: "uuid" };
const dateTime = { type: "string", format: "date-time" };
const nullableString = { type: ["string", "null"] };
const entity = (properties: Schema): Schema => ({ type: "object", properties });
const wrapped = (name: string, ref: string): Schema => ok({ type: "object", properties: { [name]: { $ref: ref } } });

const schemas = {
  ErrorResponse: entity({ success: { type: "boolean", const: false }, error: entity({ message: { type: "string" }, code: { type: "string" } }) }),
  Pagination: entity({ page: { type: "integer" }, limit: { type: "integer" }, total: { type: "integer" }, totalPages: { type: "integer" } }),
  Organization: entity({ id: uuid, name: { type: "string" }, slug: { type: "string" }, logo: nullableString, timezone: { type: "string" }, country: nullableString, currency: { type: "string" }, plan: { type: "string", enum: ["FREE", "STARTER", "PROFESSIONAL", "ENTERPRISE"] }, createdAt: dateTime, updatedAt: dateTime }),
  User: entity({ id: uuid, email: { type: "string", format: "email" }, firstName: { type: "string" }, lastName: { type: "string" }, avatar: nullableString, phone: nullableString, status: { type: "string", enum: ["INVITED", "ACTIVE", "SUSPENDED", "DISABLED"] }, emailVerified: { type: "boolean" }, lastLoginAt: { type: ["string", "null"], format: "date-time" }, organizationId: uuid, roles: { type: "array", items: { $ref: "#/components/schemas/Role" } }, createdAt: dateTime, updatedAt: dateTime }),
  Role: entity({ id: uuid, name: { type: "string" }, description: nullableString, isSystem: { type: "boolean" }, permissions: { type: "array", items: { $ref: "#/components/schemas/Permission" } } }),
  Permission: entity({ id: uuid, key: { type: "string" }, name: { type: "string" }, description: nullableString, resource: { type: "string" }, action: { type: "string" } }),
  Project: entity({ id: uuid, organizationId: uuid, name: { type: "string" }, description: nullableString, status: { type: "string", enum: ["PLANNED", "ACTIVE", "ON_HOLD", "COMPLETED", "CANCELLED"] }, startDate: { type: ["string", "null"], format: "date-time" }, endDate: { type: ["string", "null"], format: "date-time" }, color: nullableString, archived: { type: "boolean" }, createdById: uuid, createdAt: dateTime, updatedAt: dateTime }),
  Task: entity({ id: uuid, projectId: uuid, title: { type: "string" }, description: nullableString, status: { type: "string", enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"] }, priority: { type: "string", enum: ["LOW", "MEDIUM", "HIGH", "CRITICAL"] }, dueDate: { type: ["string", "null"], format: "date-time" }, assigneeId: { type: ["string", "null"], format: "uuid" }, createdById: uuid, estimatedHours: nullableString, actualHours: nullableString, archived: { type: "boolean" }, createdAt: dateTime, updatedAt: dateTime }),
  Team: entity({ id: uuid, organizationId: uuid, name: { type: "string" }, description: nullableString, color: nullableString, leadId: { type: ["string", "null"], format: "uuid" }, archived: { type: "boolean" }, createdAt: dateTime, updatedAt: dateTime }),
  TeamMember: entity({ id: uuid, teamId: uuid, userId: uuid, user: { $ref: "#/components/schemas/User" }, createdAt: dateTime, updatedAt: dateTime }),
  Comment: entity({ id: uuid, taskId: uuid, organizationId: uuid, authorId: uuid, content: { type: "string", maxLength: 5000 }, edited: { type: "boolean" }, createdAt: dateTime, updatedAt: dateTime }),
  Attachment: entity({ id: uuid, organizationId: uuid, taskId: uuid, uploadedBy: uuid, originalName: { type: "string" }, storedName: { type: "string" }, mimeType: { type: "string" }, fileSize: { type: "integer", maximum: 26214400 }, storagePath: { type: "string" }, createdAt: dateTime }),
  Activity: entity({ id: uuid, organizationId: { type: ["string", "null"], format: "uuid" }, userId: { type: ["string", "null"], format: "uuid" }, action: { type: "string" }, type: { type: "string" }, resource: { type: "string" }, ipAddress: nullableString, userAgent: nullableString, metadata: { type: ["object", "array", "string", "number", "boolean", "null"] }, actor: { type: ["object", "null"] }, createdAt: dateTime, updatedAt: dateTime }),
  AuthPrincipal: entity({ user: { $ref: "#/components/schemas/User" }, organization: { $ref: "#/components/schemas/Organization" }, roles: { type: "array", items: { $ref: "#/components/schemas/Role" } }, permissions: { type: "array", items: { $ref: "#/components/schemas/Permission" } } }),
  AuthResult: entity({ user: { $ref: "#/components/schemas/User" }, organization: { $ref: "#/components/schemas/Organization" }, roles: { type: "array", items: { $ref: "#/components/schemas/Role" } }, permissions: { type: "array", items: { $ref: "#/components/schemas/Permission" } }, accessToken: { type: "string" } }),
  RegisterRequest: entity({ organizationName: { type: "string" }, organizationSlug: { type: "string" }, firstName: { type: "string" }, lastName: { type: "string" }, email: { type: "string", format: "email" }, password: { type: "string", format: "password", minLength: 12 }, timezone: { type: "string" }, country: { type: "string" }, currency: { type: "string" } }),
  LoginRequest: entity({ email: { type: "string", format: "email" }, password: { type: "string", format: "password" } }),
  OrganizationUpdateRequest: entity({ name: { type: "string" }, logo: nullableString, timezone: { type: "string" }, country: nullableString, currency: { type: "string" } }),
  OrganizationSettingsRequest: entity({ timezone: { type: "string" }, currency: { type: "string" } }),
  UserUpdateRequest: entity({ firstName: { type: "string" }, lastName: { type: "string" }, avatar: nullableString }),
  RoleCreateRequest: entity({ name: { type: "string" }, description: nullableString, permissionIds: { type: "array", items: uuid } }),
  RoleUpdateRequest: entity({ name: { type: "string" }, description: nullableString }),
  PermissionIdsRequest: entity({ permissionIds: { type: "array", items: uuid } }),
  RoleIdsRequest: entity({ roleIds: { type: "array", items: uuid } }),
  ProjectRequest: entity({ name: { type: "string" }, description: nullableString, status: { type: "string" }, startDate: { type: ["string", "null"], format: "date-time" }, endDate: { type: ["string", "null"], format: "date-time" }, color: nullableString, archived: { type: "boolean" } }),
  TaskRequest: entity({ projectId: uuid, title: { type: "string" }, description: nullableString, status: { type: "string" }, priority: { type: "string" }, dueDate: { type: ["string", "null"], format: "date-time" }, assigneeId: { type: ["string", "null"], format: "uuid" }, estimatedHours: { type: ["number", "string", "null"] }, actualHours: { type: ["number", "string", "null"] }, archived: { type: "boolean" } }),
  TaskStatusRequest: entity({ status: { type: "string", enum: ["TODO", "IN_PROGRESS", "IN_REVIEW", "DONE", "CANCELLED"] } }),
  TaskAssigneeRequest: entity({ assigneeId: { type: ["string", "null"], format: "uuid" } }),
  TeamRequest: entity({ name: { type: "string" }, description: nullableString, color: nullableString, leadId: { type: ["string", "null"], format: "uuid" }, archived: { type: "boolean" } }),
  TeamMemberRequest: entity({ userId: uuid }),
  CommentRequest: entity({ content: { type: "string", minLength: 1, maxLength: 5000 } }),
  AttachmentRequest: entity({ originalName: { type: "string" }, storedName: { type: "string" }, mimeType: { type: "string" }, fileSize: { type: "integer", maximum: 26214400 }, storagePath: { type: "string" } }),
};

const openApiDefinition = {
  openapi: "3.1.0",
  info: { title: "BizPilot AI API", version: "0.1.0", description: "OpenAPI documentation for the BizPilot AI backend." },
  servers: [{ url: "http://localhost:4000", description: "Local development" }],
  tags: ["Health", "Authentication", "Organizations", "Users", "RBAC", "Projects", "Tasks", "Teams", "Comments", "Attachments", "Activities"].map((name) => ({ name })),
  components: {
    securitySchemes: { bearerAuth: { type: "http", scheme: "bearer", bearerFormat: "JWT" } },
    responses: {
      BadRequest: { description: "Bad request", ...content({ $ref: "#/components/schemas/ErrorResponse" }) },
      Unauthorized: { description: "Authentication required", ...content({ $ref: "#/components/schemas/ErrorResponse" }) },
      Forbidden: { description: "Permission denied", ...content({ $ref: "#/components/schemas/ErrorResponse" }) },
      NotFound: { description: "Resource not found", ...content({ $ref: "#/components/schemas/ErrorResponse" }) },
      Conflict: { description: "Conflict", ...content({ $ref: "#/components/schemas/ErrorResponse" }) },
    },
    schemas,
  },
  paths: {
    "/health": { get: { tags: ["Health"], summary: "Health check", responses: { 200: { description: "API is healthy", ...content(entity({ success: { type: "boolean", const: true }, status: { type: "string", const: "ok" } })) } } } },
    "/auth/register": { post: { tags: ["Authentication"], summary: "Register organization owner", requestBody: body("#/components/schemas/RegisterRequest"), responses: { 201: ok({ $ref: "#/components/schemas/AuthResult" }), ...errors } } },
    "/auth/login": { post: { tags: ["Authentication"], summary: "Login", requestBody: body("#/components/schemas/LoginRequest"), responses: { 200: ok({ $ref: "#/components/schemas/AuthResult" }), ...errors } } },
    "/auth/logout": { post: { tags: ["Authentication"], summary: "Logout", security, responses: { 200: ok(entity({ loggedOut: { type: "boolean" } })), ...errors } } },
    "/auth/refresh": { post: { tags: ["Authentication"], summary: "Refresh access token", responses: { 200: ok(entity({ accessToken: { type: "string" } })), ...errors } } },
    "/auth/me": { get: securedGet("Authentication", "Current principal", ok({ $ref: "#/components/schemas/AuthPrincipal" })) },
    "/organizations/me": { get: securedGet("Organizations", "Current organization", wrapped("organization", "#/components/schemas/Organization")), put: securedPatch("Organizations", "Update organization", "#/components/schemas/OrganizationUpdateRequest", wrapped("organization", "#/components/schemas/Organization"), []) },
    "/organizations/me/settings": { patch: securedPatch("Organizations", "Update organization settings", "#/components/schemas/OrganizationSettingsRequest", wrapped("organization", "#/components/schemas/Organization"), []) },
    "/users": { get: securedGet("Users", "List users", list("users", "#/components/schemas/User"), [...pageParams, { name: "search", in: "query", schema: { type: "string" } }]) },
    "/users/{id}": { get: securedGet("Users", "Get user", wrapped("user", "#/components/schemas/User"), [id("id")]), patch: securedPatch("Users", "Update user", "#/components/schemas/UserUpdateRequest", wrapped("user", "#/components/schemas/User"), [id("id")]), delete: securedDelete("Users", "Delete user", [id("id")]) },
    "/roles": { get: securedGet("RBAC", "List roles", ok(entity({ roles: { type: "array", items: { $ref: "#/components/schemas/Role" } } }))), post: securedPost("RBAC", "Create role", "#/components/schemas/RoleCreateRequest", wrapped("role", "#/components/schemas/Role")) },
    "/roles/{id}": { get: securedGet("RBAC", "Get role", wrapped("role", "#/components/schemas/Role"), [id("id")]), patch: securedPatch("RBAC", "Update role", "#/components/schemas/RoleUpdateRequest", wrapped("role", "#/components/schemas/Role"), [id("id")]), delete: securedDelete("RBAC", "Delete role", [id("id")]) },
    "/permissions": { get: securedGet("RBAC", "List permissions", ok(entity({ permissions: { type: "array", items: { $ref: "#/components/schemas/Permission" } } }))) },
    "/roles/{id}/permissions": { patch: securedPatch("RBAC", "Update role permissions", "#/components/schemas/PermissionIdsRequest", wrapped("role", "#/components/schemas/Role"), [id("id")]) },
    "/users/{id}/roles": { get: securedGet("RBAC", "Get user roles", ok(entity({ roles: { type: "array", items: { $ref: "#/components/schemas/Role" } } })), [id("id")]), patch: securedPatch("RBAC", "Update user roles", "#/components/schemas/RoleIdsRequest", wrapped("user", "#/components/schemas/User"), [id("id")]) },
    "/projects": { get: securedGet("Projects", "List projects", list("projects", "#/components/schemas/Project"), [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }, { name: "archived", in: "query", schema: { type: "boolean" } }]), post: securedPost("Projects", "Create project", "#/components/schemas/ProjectRequest", wrapped("project", "#/components/schemas/Project")) },
    "/projects/{id}": { get: securedGet("Projects", "Get project", wrapped("project", "#/components/schemas/Project"), [id("id")]), patch: securedPatch("Projects", "Update project", "#/components/schemas/ProjectRequest", wrapped("project", "#/components/schemas/Project"), [id("id")]), delete: securedDelete("Projects", "Delete project", [id("id")]) },
    "/tasks": { get: securedGet("Tasks", "List tasks", list("tasks", "#/components/schemas/Task"), [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "status", in: "query", schema: { type: "string" } }, { name: "priority", in: "query", schema: { type: "string" } }, { name: "assigneeId", in: "query", schema: uuid }, { name: "projectId", in: "query", schema: uuid }, { name: "overdue", in: "query", schema: { type: "boolean" } }]), post: securedPost("Tasks", "Create task", "#/components/schemas/TaskRequest", wrapped("task", "#/components/schemas/Task")) },
    "/tasks/{id}": { get: securedGet("Tasks", "Get task", wrapped("task", "#/components/schemas/Task"), [id("id")]), patch: securedPatch("Tasks", "Update task", "#/components/schemas/TaskRequest", wrapped("task", "#/components/schemas/Task"), [id("id")]), delete: securedDelete("Tasks", "Delete task", [id("id")]) },
    "/tasks/{id}/status": { patch: securedPatch("Tasks", "Update task status", "#/components/schemas/TaskStatusRequest", wrapped("task", "#/components/schemas/Task"), [id("id")]) },
    "/tasks/{id}/assignee": { patch: securedPatch("Tasks", "Update task assignee", "#/components/schemas/TaskAssigneeRequest", wrapped("task", "#/components/schemas/Task"), [id("id")]) },
    "/teams": { get: securedGet("Teams", "List teams", list("teams", "#/components/schemas/Team"), [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "archived", in: "query", schema: { type: "boolean" } }]), post: securedPost("Teams", "Create team", "#/components/schemas/TeamRequest", wrapped("team", "#/components/schemas/Team")) },
    "/teams/{id}": { get: securedGet("Teams", "Get team", wrapped("team", "#/components/schemas/Team"), [id("id")]), patch: securedPatch("Teams", "Update team", "#/components/schemas/TeamRequest", wrapped("team", "#/components/schemas/Team"), [id("id")]), delete: securedDelete("Teams", "Delete team", [id("id")]) },
    "/teams/{id}/members": { get: securedGet("Teams", "List team members", ok(entity({ members: { type: "array", items: { $ref: "#/components/schemas/TeamMember" } } })), [id("id")]), post: securedPost("Teams", "Add team member", "#/components/schemas/TeamMemberRequest", wrapped("member", "#/components/schemas/TeamMember"), [id("id")]) },
    "/teams/{id}/members/{userId}": { delete: securedDelete("Teams", "Remove team member", [id("id"), id("userId")]) },
    "/tasks/{taskId}/comments": { get: securedGet("Comments", "List task comments", list("comments", "#/components/schemas/Comment"), [id("taskId"), ...pageParams]), post: securedPost("Comments", "Create task comment", "#/components/schemas/CommentRequest", wrapped("comment", "#/components/schemas/Comment"), [id("taskId")]) },
    "/comments/{id}": { patch: securedPatch("Comments", "Update comment", "#/components/schemas/CommentRequest", wrapped("comment", "#/components/schemas/Comment"), [id("id")]), delete: securedDelete("Comments", "Delete comment", [id("id")]) },
    "/tasks/{taskId}/attachments": { get: securedGet("Attachments", "List task attachments", list("attachments", "#/components/schemas/Attachment"), [id("taskId"), ...pageParams]), post: securedPost("Attachments", "Upload attachment metadata", "#/components/schemas/AttachmentRequest", wrapped("attachment", "#/components/schemas/Attachment"), [id("taskId")]) },
    "/attachments/{id}": { get: securedGet("Attachments", "Get attachment metadata", wrapped("attachment", "#/components/schemas/Attachment"), [id("id")]), delete: securedDelete("Attachments", "Delete attachment", [id("id")]) },
    "/activities": { get: securedGet("Activities", "List activity feed", list("activities", "#/components/schemas/Activity"), [...pageParams, { name: "search", in: "query", schema: { type: "string" } }, { name: "action", in: "query", schema: { type: "string" } }, { name: "resource", in: "query", schema: { type: "string" } }, { name: "userId", in: "query", schema: uuid }, { name: "startDate", in: "query", schema: dateTime }, { name: "endDate", in: "query", schema: dateTime }]) },
    "/activities/{id}": { get: securedGet("Activities", "Get activity", wrapped("activity", "#/components/schemas/Activity"), [id("id")]) },
  },
} satisfies Schema;

const swaggerOptions: Options = {
  definition: openApiDefinition,
  apis: ["./src/routes.ts", "./src/modules/**/*.routes.ts"],
};

export const openApiSpec = swaggerJSDoc(swaggerOptions) as Schema;

export const setupSwaggerDocs = (app: Express): void => {
  app.use("/docs", swaggerUi.serve, swaggerUi.setup(openApiSpec, { explorer: true, customSiteTitle: "BizPilot AI API Docs" }));
};
