import { AppError } from "../../core/errors/index.js";
import { activityRepository } from "./activity.repository.js";
import type { ActivityListQuery, ActivityListResult, ActivityRecord, ActivityResponse } from "./activity.types.js";

const activityTypeByAction: Readonly<Record<string, string>> = {
  "auth.register": "User Created",
  "user.update": "User Updated",
  "user.delete": "User Deleted",
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
  "team.delete": "Team Deleted",
  "comment.create": "Comment Created",
  "comment.update": "Comment Updated",
  "comment.delete": "Comment Deleted",
  "attachment.upload": "Attachment Uploaded",
  "attachment.delete": "Attachment Deleted",
  "role.create": "Role Created",
  "role.update": "Role Updated",
  "role.delete": "Role Deleted",
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
  metadata: activity.metadata,
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
          avatar: activity.user.avatar,
        },
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
        totalPages,
      },
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