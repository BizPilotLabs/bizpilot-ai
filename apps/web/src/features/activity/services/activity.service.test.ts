import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/lib";
import { server } from "@/test/server";
import { activityService } from "./activity.service";

describe("activityService", () => {
  it("loads activities with supported query filters", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/activities`, ({ request }) => {
        const url = new URL(request.url);
        expect(url.searchParams.get("page")).toBe("2");
        expect(url.searchParams.get("limit")).toBe("12");
        expect(url.searchParams.get("action")).toBe("user.create");
        expect(url.searchParams.get("resource")).toBe("user");

        return HttpResponse.json({
          success: true,
          data: {
            activities: [],
            pagination: { page: 2, limit: 12, total: 0, totalPages: 1 }
          }
        });
      })
    );

    const result = await activityService.getActivities({ page: 2, limit: 12, action: "user.create", resource: "user" });

    expect(result.pagination.page).toBe(2);
  });

  it("loads one activity by id", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/activities/12121212-1212-4121-8121-121212121212`, () =>
        HttpResponse.json({
          success: true,
          data: {
            activity: {
              id: "12121212-1212-4121-8121-121212121212",
              organizationId: "11111111-1111-4111-8111-111111111111",
              userId: null,
              action: "auth.login",
              type: "User Signed In",
              resource: "auth",
              ipAddress: null,
              userAgent: null,
              metadata: {},
              createdAt: "2026-01-01T00:00:00.000Z",
              updatedAt: "2026-01-01T00:00:00.000Z",
              actor: null
            }
          }
        })
      )
    );

    const result = await activityService.getActivityById("12121212-1212-4121-8121-121212121212");

    expect(result.type).toBe("User Signed In");
  });
});
