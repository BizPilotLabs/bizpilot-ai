import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/lib";
import { organization } from "@/test/factories";
import { server } from "@/test/server";
import { organizationService } from "./organization.service";

describe("organizationService", () => {
  it("loads the authenticated organization profile", async () => {
    server.use(http.get(`${env.apiBaseUrl}/organizations/me`, () => HttpResponse.json({ success: true, data: { organization: organization() } })));

    await expect(organizationService.getCurrentOrganization()).resolves.toMatchObject({ slug: "bizpilot-test" });
  });

  it("updates profile and settings without accepting a frontend organization id", async () => {
    const payloads: Record<string, unknown>[] = [];
    server.use(
      http.put(`${env.apiBaseUrl}/organizations/me`, async ({ request }) => {
        payloads.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json({ success: true, data: { organization: organization({ name: "Updated Org" }) } });
      }),
      http.patch(`${env.apiBaseUrl}/organizations/me/settings`, async ({ request }) => {
        payloads.push(await request.json() as Record<string, unknown>);
        return HttpResponse.json({ success: true, data: { organization: organization({ timezone: "America/New_York", currency: "EUR" }) } });
      })
    );

    await organizationService.updateOrganization({ name: "Updated Org" });
    await organizationService.updateOrganizationSettings({ timezone: "America/New_York", currency: "EUR" });

    expect(payloads).toEqual([{ name: "Updated Org" }, { timezone: "America/New_York", currency: "EUR" }]);
  });
});
