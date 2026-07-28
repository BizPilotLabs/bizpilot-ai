import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/lib";
import { ids, rbacRole } from "@/test/factories";
import { server } from "@/test/server";
import { rbacService } from "./rbac.service";

describe("rbacService", () => {
  it("loads roles and permissions from verified backend endpoints", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/roles`, () => HttpResponse.json({ success: true, data: { roles: [rbacRole()] } })),
      http.get(`${env.apiBaseUrl}/permissions`, () => HttpResponse.json({ success: true, data: { permissions: rbacRole().permissions } }))
    );

    await expect(rbacService.getRoles()).resolves.toHaveLength(1);
    await expect(rbacService.getPermissions()).resolves.toMatchObject({ permissions: [{ key: "users.read" }] });
  });

  it("creates, updates and deletes custom roles through role endpoints", async () => {
    const calls: string[] = [];
    server.use(
      http.post(`${env.apiBaseUrl}/roles`, async ({ request }) => {
        calls.push("create");
        const body = await request.json() as Record<string, unknown>;
        expect(body).toMatchObject({ name: "Reviewer", permissionIds: [ids.permission] });
        return HttpResponse.json({ success: true, data: { role: rbacRole({ name: "Reviewer" }) } });
      }),
      http.patch(`${env.apiBaseUrl}/roles/${ids.role}`, async ({ request }) => {
        calls.push("update");
        const body = await request.json() as Record<string, unknown>;
        expect(body).toEqual({ description: null });
        return HttpResponse.json({ success: true, data: { role: rbacRole({ description: null }) } });
      }),
      http.patch(`${env.apiBaseUrl}/roles/${ids.role}/permissions`, async ({ request }) => {
        calls.push("permissions");
        const body = await request.json() as Record<string, unknown>;
        expect(body).toEqual({ permissionIds: [ids.permission] });
        return HttpResponse.json({ success: true, data: { role: rbacRole() } });
      }),
      http.delete(`${env.apiBaseUrl}/roles/${ids.role}`, () => {
        calls.push("delete");
        return HttpResponse.json({ success: true, data: { deleted: true } });
      })
    );

    await rbacService.createRole({ name: "Reviewer", description: "Reviews work", permissionIds: [ids.permission] });
    await rbacService.updateRole(ids.role, { description: null });
    await rbacService.updateRolePermissions(ids.role, [ids.permission]);
    await rbacService.deleteRole(ids.role);

    expect(calls).toEqual(["create", "update", "permissions", "delete"]);
  });
});
