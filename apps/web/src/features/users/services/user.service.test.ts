import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/lib";
import { ids, userProfile } from "@/test/factories";
import { server } from "@/test/server";
import { userService } from "./user.service";

describe("userService", () => {
  it("lists users with pagination through the configured API base URL", async () => {
    server.use(http.get(`${env.apiBaseUrl}/users`, ({ request }) => {
      const url = new URL(request.url);
      expect(url.searchParams.get("page")).toBe("2");
      expect(url.searchParams.get("search")).toBe("ava");
      return HttpResponse.json({ success: true, data: { users: [userProfile()], pagination: { page: 2, limit: 12, total: 1, totalPages: 1 } } });
    }));

    const result = await userService.getUsers({ page: 2, limit: 12, sort: "desc", search: "ava" });

    expect(result.users[0]?.email).toBe("ava@example.com");
    expect(result.pagination.page).toBe(2);
  });

  it("creates users without sending organization identifiers from the frontend", async () => {
    let payload: Record<string, unknown> = {};
    server.use(http.post(`${env.apiBaseUrl}/users`, async ({ request }) => {
      payload = await request.json() as Record<string, unknown>;
      return HttpResponse.json({ success: true, data: { user: userProfile({ id: ids.user }) } });
    }));

    const result = await userService.createUser({ firstName: "Ava", lastName: "Admin", email: "ava@example.com", password: "secure-password", roleIds: [ids.role] });

    expect(payload).toEqual({ firstName: "Ava", lastName: "Admin", email: "ava@example.com", password: "secure-password", roleIds: [ids.role] });
    expect(result.id).toBe(ids.user);
  });

  it("updates and deletes users using saved ids in the path", async () => {
    const calls: string[] = [];
    server.use(
      http.patch(`${env.apiBaseUrl}/users/${ids.user}`, async ({ request }) => {
        calls.push("patch");
        const body = await request.json() as Record<string, unknown>;
        expect(body).toEqual({ firstName: "Updated" });
        return HttpResponse.json({ success: true, data: { user: userProfile({ firstName: "Updated" }) } });
      }),
      http.delete(`${env.apiBaseUrl}/users/${ids.user}`, () => {
        calls.push("delete");
        return HttpResponse.json({ success: true, data: { deleted: true } });
      })
    );

    await expect(userService.updateUser(ids.user, { firstName: "Updated" })).resolves.toMatchObject({ firstName: "Updated" });
    await expect(userService.deleteUser(ids.user)).resolves.toEqual({ deleted: true });
    expect(calls).toEqual(["patch", "delete"]);
  });
});
