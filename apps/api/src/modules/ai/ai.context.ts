import { env } from "../../config/index.js";
import { AppError } from "../../core/errors/index.js";
import { aiLimits } from "./ai.schema.js";
import { aiRepository } from "./ai.repository.js";
import type { AiContextBundle, AiCopilotRequestInput, AiSourceReference, PermissionContext } from "./ai.types.js";

const hasPermission = (context: PermissionContext, permissionKey: string): boolean => context.isElevated || context.permissionKeys.has(permissionKey);

const removeControlCharacters = (value: string): string => [...value].map((character) => character.charCodeAt(0) < 32 || character.charCodeAt(0) === 127 ? " " : character).join("");

const truncate = (value: string | null, limit = aiLimits.textFieldMaxLength): string | null => {
  if (value === null) return null;
  const compact = removeControlCharacters(value).replace(/\s+/gu, " ").trim();
  if (compact.length <= limit) return compact;
  return `${compact.slice(0, limit)} [truncated]`;
};

const iso = (date: Date | null): string | undefined => date === null ? undefined : date.toISOString();

class SourceBuilder {
  private readonly sources: AiSourceReference[] = [];

  public add(source: Omit<AiSourceReference, "marker">): AiSourceReference {
    const existing = this.sources.find((candidate) => candidate.type === source.type && candidate.id === source.id);
    if (existing !== undefined) return existing;
    const next = { ...source, marker: `[S${this.sources.length + 1}]` };
    this.sources.push(next);
    return next;
  }

  public all(): AiSourceReference[] {
    return this.sources;
  }
}

export class AiContextBuilder {
  public async build(input: { userId: string; organizationId: string; request: AiCopilotRequestInput }): Promise<{ context: AiContextBundle; permissions: PermissionContext }> {
    const permissions = await aiRepository.getPermissionContext(input);
    if (permissions === null) {
      throw new AppError({ statusCode: 403, message: "Permission denied.", code: "RBAC_PERMISSION_DENIED" });
    }

    const organization = await aiRepository.getOrganization(input.organizationId);
    if (organization === null) {
      throw new AppError({ statusCode: 404, message: "Organization not found.", code: "ORGANIZATION_NOT_FOUND" });
    }

    const sources = new SourceBuilder();
    sources.add({ type: "organization", id: organization.id, label: organization.name, appRoute: "/app/organizations", updatedAt: organization.updatedAt.toISOString() });

    const projects = [];
    const tasks = [];
    const comments = [];
    const attachments = [];
    const activities = [];
    const users = [];
    const truncationNotes: string[] = [];

    if (input.request.scope.type === "project" && !hasPermission(permissions, "projects.read")) {
      throw new AppError({ statusCode: 403, message: "Project context requires project read permission.", code: "AI_CONTEXT_PERMISSION_DENIED" });
    }

    if (input.request.scope.type === "task" && !hasPermission(permissions, "tasks.read")) {
      throw new AppError({ statusCode: 403, message: "Task context requires task read permission.", code: "AI_CONTEXT_PERMISSION_DENIED" });
    }

    if (input.request.scope.type === "organization") {
      if (hasPermission(permissions, "projects.read")) projects.push(...await aiRepository.getOrganizationProjects({ organizationId: input.organizationId, limit: aiLimits.projectsLimit }));
      if (hasPermission(permissions, "tasks.read")) tasks.push(...await aiRepository.getOrganizationTasks({ organizationId: input.organizationId, limit: aiLimits.tasksLimit }));
    }

    if (input.request.scope.type === "project") {
      const project = await aiRepository.getProject({ organizationId: input.organizationId, projectId: input.request.scope.entityId ?? "" });
      if (project === null) throw new AppError({ statusCode: 404, message: "Project not found.", code: "AI_SCOPE_NOT_FOUND" });
      projects.push(project);
      if (hasPermission(permissions, "tasks.read")) tasks.push(...await aiRepository.getProjectTasks({ organizationId: input.organizationId, projectId: project.id, limit: aiLimits.tasksLimit }));
    }

    if (input.request.scope.type === "task") {
      const task = await aiRepository.getTask({ organizationId: input.organizationId, taskId: input.request.scope.entityId ?? "" });
      if (task === null) throw new AppError({ statusCode: 404, message: "Task not found.", code: "AI_SCOPE_NOT_FOUND" });
      tasks.push(task);
      if (hasPermission(permissions, "projects.read")) {
        const project = await aiRepository.getProject({ organizationId: input.organizationId, projectId: task.projectId });
        if (project !== null) projects.push(project);
      }
    }

    const taskIds = tasks.map((task) => task.id);
    if (hasPermission(permissions, "comments.read")) comments.push(...await aiRepository.getTaskComments({ organizationId: input.organizationId, taskIds, limit: aiLimits.commentsLimit }));
    if (hasPermission(permissions, "attachments.read")) attachments.push(...await aiRepository.getTaskAttachments({ organizationId: input.organizationId, taskIds, limit: aiLimits.attachmentsLimit }));
    if (hasPermission(permissions, "activities.read")) activities.push(...await aiRepository.getActivities({ organizationId: input.organizationId, limit: aiLimits.activitiesLimit }));
    if (hasPermission(permissions, "users.read")) users.push(...await aiRepository.getUsers({ organizationId: input.organizationId, limit: aiLimits.usersLimit }));

    for (const project of projects) {
      project.description = truncate(project.description);
      sources.add({ type: "project", id: project.id, label: project.name, appRoute: `/app/projects/${project.id}`, updatedAt: project.updatedAt.toISOString() });
    }

    for (const task of tasks) {
      task.description = truncate(task.description);
      sources.add({ type: "task", id: task.id, label: task.title, appRoute: `/app/tasks/${task.id}`, updatedAt: task.updatedAt.toISOString() });
    }

    for (const comment of comments) {
      comment.content = truncate(comment.content) ?? "";
      sources.add({ type: "comment", id: comment.id, label: `Comment on task ${comment.taskId}`, appRoute: `/app/tasks/${comment.taskId}#comments`, updatedAt: comment.updatedAt.toISOString() });
    }

    for (const attachment of attachments) {
      sources.add({ type: "attachment", id: attachment.id, label: attachment.originalName, appRoute: `/app/tasks/${attachment.taskId}`, updatedAt: attachment.createdAt.toISOString() });
    }

    for (const activity of activities) {
      sources.add({ type: "activity", id: activity.id, label: `${activity.action} on ${activity.resource}`, appRoute: "/app/activity", updatedAt: activity.createdAt.toISOString() });
    }

    for (const user of users) {
      sources.add({ type: "user", id: user.id, label: `${user.firstName} ${user.lastName}`.trim() || user.email, appRoute: "/app/users", updatedAt: user.createdAt.toISOString() });
    }

    if (projects.length >= aiLimits.projectsLimit) truncationNotes.push(`Projects limited to ${aiLimits.projectsLimit} records.`);
    if (tasks.length >= aiLimits.tasksLimit) truncationNotes.push(`Tasks limited to ${aiLimits.tasksLimit} records.`);
    if (comments.length >= aiLimits.commentsLimit) truncationNotes.push(`Comments limited to ${aiLimits.commentsLimit} records.`);
    if (env.AI_MAX_CONTEXT_CHARS < aiLimits.contextMaxCharacters) truncationNotes.push(`Prompt context capped at ${env.AI_MAX_CONTEXT_CHARS} characters by configuration.`);

    return {
      permissions,
      context: { organization, projects, tasks, comments, attachments, activities, users, sources: sources.all(), truncationNotes }
    };
  }
}

export const aiContextBuilder = new AiContextBuilder();
export const hasAiPermission = hasPermission;
export const formatDate = iso;

