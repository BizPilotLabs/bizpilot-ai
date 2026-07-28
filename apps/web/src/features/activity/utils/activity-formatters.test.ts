import { describe, expect, it } from "vitest";
import { formatActivityDescription, getActorName, getSafeMetadataItems } from "./activity-formatters";
import type { Activity } from "../types";

const activity: Activity = {
  id: "12121212-1212-4121-8121-121212121212",
  organizationId: "11111111-1111-4111-8111-111111111111",
  userId: "33333333-3333-4333-8333-333333333333",
  action: "role.permissions.update",
  type: "Role Permissions Updated",
  resource: "role",
  ipAddress: null,
  userAgent: null,
  metadata: { roleId: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa", refreshToken: "hidden", fields: ["name"] },
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
  actor: {
    id: "33333333-3333-4333-8333-333333333333",
    email: "owner@example.com",
    firstName: "Olivia",
    lastName: "Owner",
    avatar: null
  }
};

describe("activity formatters", () => {
  it("formats known activity descriptions", () => {
    expect(formatActivityDescription(activity)).toBe("Olivia Owner changed role permissions");
  });

  it("falls back safely for unknown actions and deleted actors", () => {
    expect(formatActivityDescription({ ...activity, actor: null, action: "custom.event" })).toBe("Deleted user performed Custom Event");
    expect(getActorName({ ...activity, actor: null, userId: null })).toBe("System");
  });

  it("filters sensitive metadata keys", () => {
    expect(getSafeMetadataItems(activity.metadata)).toEqual([
      { label: "Role", value: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa" },
      { label: "Fields", value: "name" }
    ]);
  });
});
