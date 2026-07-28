import type { Activity, ActivityMetadata } from "../types";

const knownActionLabels: Readonly<Record<string, string>> = {
  "auth.register": "registered the workspace owner",
  "auth.login": "signed in",
  "auth.logout": "signed out",
  "auth.refresh": "refreshed a session",
  "auth.refresh_token_reuse_detected": "triggered refresh-token reuse detection",
  "user.create": "created a user",
  "user.update": "updated a user",
  "user.delete": "deleted a user",
  "user.roles.update": "updated user roles",
  "organization.update": "updated the organization profile",
  "organization.settings.update": "updated organization settings",
  "role.create": "created a role",
  "role.update": "updated a role",
  "role.delete": "deleted a role",
  "role.permissions.update": "changed role permissions",
  "project.create": "created a project",
  "project.update": "updated a project",
  "project.delete": "deleted a project",
  "task.create": "created a task",
  "task.update": "updated a task",
  "task.delete": "deleted a task",
  "task.status.change": "changed task status",
  "task.assignee.change": "changed task assignee",
  "team.create": "created a team",
  "team.update": "updated a team",
  "team.lead.change": "changed the team lead",
  "team.delete": "deleted a team",
  "team.member.add": "added a team member",
  "team.member.remove": "removed a team member",
  "comment.create": "created a comment",
  "comment.update": "updated a comment",
  "comment.delete": "deleted a comment",
  "attachment.upload": "uploaded an attachment",
  "attachment.delete": "deleted an attachment"
};

const labelByMetadataKey: Readonly<Record<string, string>> = {
  attachmentId: "Attachment",
  commentId: "Comment",
  fields: "Fields",
  fileSize: "File size",
  leadId: "Lead",
  mimeType: "MIME type",
  originalName: "File",
  organizationId: "Organization",
  permissionIds: "Permissions",
  previousLeadId: "Previous lead",
  projectId: "Project",
  roleId: "Role",
  taskId: "Task",
  teamId: "Team",
  userId: "User"
};

const unsafeMetadataKeyPattern = /password|passwordHash|token|secret|cookie|authorization|refresh|access|credential|session|mfa|stack|privateKey/iu;

const toTitleCase = (value: string): string =>
  value
    .replace(/[_.-]+/gu, " ")
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");

export const getActorName = (activity: Activity): string => {
  if (activity.actor === null) {
    return activity.userId === null ? "System" : "Deleted user";
  }

  return `${activity.actor.firstName} ${activity.actor.lastName}`.trim() || activity.actor.email;
};

export const formatActionLabel = (action: string): string => knownActionLabels[action] ?? `performed ${toTitleCase(action)}`;

export const formatActivityDescription = (activity: Activity): string => `${getActorName(activity)} ${formatActionLabel(activity.action)}`;

export const formatActivityTimestamp = (value: string): string => {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
};

const isRecord = (value: ActivityMetadata): value is Record<string, ActivityMetadata> => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const formatValue = (value: ActivityMetadata): string | null => {
  if (value === null) return null;
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    const values = value.map(formatValue).filter((item): item is string => item !== null);
    return values.length > 0 ? values.join(", ") : null;
  }
  return null;
};

export interface ActivityMetadataItem {
  label: string;
  value: string;
}

export const getSafeMetadataItems = (metadata: ActivityMetadata, limit = 5): ActivityMetadataItem[] => {
  if (!isRecord(metadata)) {
    return [];
  }

  const items: ActivityMetadataItem[] = [];

  for (const [key, value] of Object.entries(metadata)) {
    if (unsafeMetadataKeyPattern.test(key)) {
      continue;
    }

    const formatted = formatValue(value);
    if (formatted !== null && formatted.trim().length > 0) {
      items.push({ label: labelByMetadataKey[key] ?? toTitleCase(key), value: formatted });
    }
  }

  return items.slice(0, limit);
};

