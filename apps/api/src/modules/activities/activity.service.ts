import type { Prisma } from "@prisma/client";

import { AppError } from "../../core/errors/index.js";
import { activityRepository } from "./activity.repository.js";
import type { ActivityListQuery, ActivityListResult, ActivityRecord, ActivityResponse } from "./activity.types.js";

const activityTypeByAction: Readonly<Record<string, string>> = {
  "auth.register": "User Created",
  "auth.login": "User Signed In",
  "auth.logout": "User Signed Out",
  "auth.refresh": "Session Refreshed",
  "auth.refresh_token_reuse_detected": "Refresh Token Reuse Detected",
  "user.create": "User Created",
  "user.update": "User Updated",
  "user.delete": "User Deleted",
  "user.roles.update": "User Roles Updated",
  "organization.update": "Organization Updated",
  "organization.settings.update": "Organization Settings Updated",
  "project.create": "Project Created",
  "project.update": "Project Updated",
  "project.delete": "Project Deleted",
  "task.create": "Task Created",
  "task.update": "Task Updated",
  "task.delete": "Task Deleted",
  "task.status.change": "Task Status Changed",
  "task.assignee.change": "Task Assignee Changed",
  "team.create": "Team Created",
  "team.update": "Team Updated",
  "team.lead.change": "Team Lead Changed",
  "team.delete": "Team Deleted",
  "team.member.add": "Team Member Added",
  "team.member.remove": "Team Member Removed",
  "comment.create": "Comment Created",
  "comment.update": "Comment Updated",
  "comment.delete": "Comment Deleted",
  "attachment.upload": "Attachment Uploaded",
  "attachment.delete": "Attachment Deleted",
  "role.create": "Role Created",
  "role.update": "Role Updated",
  "role.delete": "Role Deleted",
  "role.permissions.update": "Role Permissions Updated"
};

const sensitiveMetadataKeyPattern = /password|passwordHash|token|secret|cookie|authorization|refresh|access|credential|session|mfa|stack|privateKey/iu;

const isJsonObject = (value: Prisma.JsonValue): value is Prisma.JsonObject => {
  return typeof value === "object" && value !== null && !Array.isArray(value);
};

const sanitizeMetadata = (value: Prisma.JsonValue | null): Prisma.JsonValue | null => {
  if (value === null) return null;

  if (Array.isArray(value)) {
    return value.map((item) => sanitizeMetadata(item));
  }

  if (isJsonObject(value)) {
    const sanitized: Prisma.JsonObject = {};

    for (const [key, childValue] of Object.entries(value)) {
      if (!sensitiveMetadataKeyPattern.test(key) && childValue !== undefined) {
        sanitized[key] = sanitizeMetadata(childValue) as Prisma.JsonValue;
      }
    }

    return sanitized;
  }

  return value;
};

const toTitleCase = (value: string): string => {
  return value
    .replace(/[_.]+/gu, " ")
    .split(" ")
    .filter((part) => part.length > 0)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
};

const toActivityResponse = (activity: ActivityRecord): ActivityResponse => ({
  id: activity.id,
  organizationId: activity.organizationId,
  userId: activity.userId,
  action: activity.action,
  type: activityTypeByAction[activity.action] ?? toTitleCase(activity.action),
  resource: activity.resource,
  ipAddress: activity.ipAddress,
  userAgent: activity.userAgent,
  metadata: sanitizeMetadata(activity.metadata),
  createdAt: activity.createdAt,
  updatedAt: activity.updatedAt,
  actor:
    activity.user === null
      ? null
      : {
          id: activity.user.id,
          email: activity.user.email,
          firstName: activity.user.firstName,
          lastName: activity.user.lastName,
          avatar: activity.user.avatar
        }
});

export class ActivityService {
  public async listActivities(input: { organizationId: string; query: ActivityListQuery }): Promise<ActivityListResult> {
    if (input.query.startDate !== undefined && input.query.endDate !== undefined && input.query.endDate.getTime() < input.query.startDate.getTime()) {
      throw new AppError({ statusCode: 400, message: "End date cannot be before start date.", code: "ACTIVITY_INVALID_DATE_RANGE" });
    }

    const result = await activityRepository.findActivities(input);
    const totalPages = Math.max(1, Math.ceil(result.total / input.query.limit));

    return {
      activities: result.activities.map(toActivityResponse),
      pagination: {
        page: input.query.page,
        limit: input.query.limit,
        total: result.total,
        totalPages
      }
    };
  }

  public async getActivity(input: { organizationId: string; activityId: string }): Promise<ActivityResponse> {
    const activity = await activityRepository.findActivityByIdInOrganization(input);

    if (activity === null) {
      throw new AppError({ statusCode: 404, message: "Activity not found.", code: "ACTIVITY_NOT_FOUND" });
    }

    return toActivityResponse(activity);
  }
}

export const activityService = new ActivityService();

