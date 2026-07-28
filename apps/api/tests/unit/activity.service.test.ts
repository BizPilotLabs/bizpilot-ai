import { describe, expect, it, vi } from "vitest";
import type { AppError } from "../../src/core/errors/index.js";
import { ids } from "../helpers/fixtures.js";

const activityRepositoryMock = vi.hoisted(() => ({
  findActivities: vi.fn(),
  findActivityByIdInOrganization: vi.fn()
}));

vi.mock("../../src/modules/activities/activity.repository.js", () => ({ activityRepository: activityRepositoryMock }));

const { activityService } = await import("../../src/modules/activities/activity.service.js");

const now = new Date("2026-01-01T12:00:00.000Z");

const activityRecord = (overrides: Record<string, unknown> = {}) => ({
  id: "12121212-1212-4121-8121-121212121212",
  userId: ids.ownerUser,
  organizationId: ids.organizationA,
  action: "user.create",
  resource: "user",
  ipAddress: "127.0.0.1",
  userAgent: "Vitest",
  metadata: { userId: ids.targetUser },
  createdAt: now,
  updatedAt: now,
  user: {
    id: ids.ownerUser,
    email: "owner@example.com",
    firstName: "Olivia",
    lastName: "Owner",
    avatar: null
  },
  ...overrides
});

describe("ActivityService", () => {
  it("returns paginated tenant activity with safe display labels", async () => {
    activityRepositoryMock.findActivities.mockResolvedValue({ activities: [activityRecord({ action: "organization.settings.update" })], total: 1 });

    const result = await activityService.listActivities({ organizationId: ids.organizationA, query: { page: 1, limit: 20, sort: "desc" } });

    expect(result.activities[0]).toMatchObject({ type: "Organization Settings Updated", actor: { email: "owner@example.com" } });
    expect(result.pagination).toEqual({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it("sanitizes sensitive metadata recursively", async () => {
    activityRepositoryMock.findActivityByIdInOrganization.mockResolvedValue(activityRecord({
      metadata: {
        userId: ids.targetUser,
        password: "secret",
        nested: {
          refreshToken: "token",
          changed: "firstName"
        },
        values: [{ accessToken: "token", safe: true }]
      }
    }));

    const result = await activityService.getActivity({ organizationId: ids.organizationA, activityId: "12121212-1212-4121-8121-121212121212" });

    expect(result.metadata).toEqual({ userId: ids.targetUser, nested: { changed: "firstName" }, values: [{ safe: true }] });
  });

  it("rejects inverted date ranges", async () => {
    await expect(activityService.listActivities({
      organizationId: ids.organizationA,
      query: { page: 1, limit: 20, sort: "desc", startDate: new Date("2026-02-01T00:00:00.000Z"), endDate: new Date("2026-01-01T00:00:00.000Z") }
    })).rejects.toMatchObject<AppError>({ code: "ACTIVITY_INVALID_DATE_RANGE" });
  });

  it("returns not found for cross-organization detail lookups", async () => {
    activityRepositoryMock.findActivityByIdInOrganization.mockResolvedValue(null);

    await expect(activityService.getActivity({ organizationId: ids.organizationB, activityId: "12121212-1212-4121-8121-121212121212" })).rejects.toMatchObject<AppError>({ code: "ACTIVITY_NOT_FOUND" });
  });
});
