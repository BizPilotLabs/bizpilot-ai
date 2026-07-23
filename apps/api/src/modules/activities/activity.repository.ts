import type { Prisma } from "@prisma/client";

import { prisma } from "../../core/database/index.js";
import type { ActivityListQuery, ActivityRecord } from "./activity.types.js";

const activityUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  avatar: true,
} satisfies Prisma.UserSelect;

const createSearchWhere = (search: string | undefined): Prisma.AuditLogWhereInput => {
  if (search === undefined) return {};

  return {
    OR: [
      { action: { contains: search, mode: "insensitive" } },
      { resource: { contains: search, mode: "insensitive" } },
      { userAgent: { contains: search, mode: "insensitive" } },
      { user: { email: { contains: search, mode: "insensitive" } } },
      { user: { firstName: { contains: search, mode: "insensitive" } } },
      { user: { lastName: { contains: search, mode: "insensitive" } } },
    ],
  };
};

const createDateWhere = (query: ActivityListQuery): Prisma.DateTimeFilter | undefined => {
  if (query.startDate === undefined && query.endDate === undefined) return undefined;

  const dateFilter: Prisma.DateTimeFilter = {};
  if (query.startDate !== undefined) dateFilter.gte = query.startDate;
  if (query.endDate !== undefined) dateFilter.lte = query.endDate;
  return dateFilter;
};

export class ActivityRepository {
  public async findActivities(input: { organizationId: string; query: ActivityListQuery }): Promise<{ activities: ActivityRecord[]; total: number }> {
    const createdAt = createDateWhere(input.query);
    const where: Prisma.AuditLogWhereInput = {
      organizationId: input.organizationId,
      ...createSearchWhere(input.query.search),
    };

    if (input.query.action !== undefined) where.action = input.query.action;
    if (input.query.resource !== undefined) where.resource = input.query.resource;
    if (input.query.userId !== undefined) where.userId = input.query.userId;
    if (createdAt !== undefined) where.createdAt = createdAt;

    const [activities, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: { user: { select: activityUserSelect } },
        orderBy: { createdAt: input.query.sort },
        skip: (input.query.page - 1) * input.query.limit,
        take: input.query.limit,
      }),
      prisma.auditLog.count({ where }),
    ]);

    return { activities, total };
  }

  public async findActivityByIdInOrganization(input: { activityId: string; organizationId: string }): Promise<ActivityRecord | null> {
    return prisma.auditLog.findFirst({
      where: { id: input.activityId, organizationId: input.organizationId },
      include: { user: { select: activityUserSelect } },
    });
  }
}

export const activityRepository = new ActivityRepository();