import { http, HttpResponse } from "msw";
import { describe, expect, it } from "vitest";
import { env } from "@/lib";
import { server } from "@/test/server";
import { attachmentService } from "./attachment.service";

const attachment = {
  id: "abababab-abab-4aba-8aba-abababababab",
  organizationId: "11111111-1111-4111-8111-111111111111",
  taskId: "cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd",
  uploadedBy: "33333333-3333-4333-8333-333333333333",
  originalName: "scope.pdf",
  storedName: "scope.pdf",
  mimeType: "application/pdf",
  fileSize: 1200,
  storagePath: "organizations/111/tasks/cd/attachments/ab/scope.pdf",
  provider: "r2",
  status: "READY",
  uploadExpiresAt: null,
  finalizedAt: "2026-01-01T00:00:00.000Z",
  createdAt: "2026-01-01T00:00:00.000Z"
};

describe("attachmentService", () => {
  it("loads task attachments", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/tasks/:taskId/attachments`, ({ request }) => {
        expect(new URL(request.url).searchParams.get("limit")).toBe("20");
        return HttpResponse.json({ success: true, data: { attachments: [attachment], pagination: { page: 1, limit: 20, total: 1, totalPages: 1 } } });
      })
    );

    const result = await attachmentService.getTaskAttachments(attachment.taskId, { limit: 20 });

    expect(result.attachments[0]?.originalName).toBe("scope.pdf");
  });

  it("initializes upload and finalizes the pending attachment", async () => {
    server.use(
      http.post(`${env.apiBaseUrl}/tasks/:taskId/attachments`, () => HttpResponse.json({ success: true, data: { upload: { attachment: { ...attachment, status: "PENDING", finalizedAt: null, uploadExpiresAt: "2026-01-01T00:10:00.000Z" }, uploadUrl: "https://r2.example/upload", headers: { "content-type": "application/pdf" }, expiresAt: "2026-01-01T00:10:00.000Z" } } }, { status: 201 })),
      http.post(`${env.apiBaseUrl}/attachments/:id/complete`, () => HttpResponse.json({ success: true, data: { attachment } }))
    );

    const upload = await attachmentService.initializeTaskAttachmentUpload(attachment.taskId, { originalName: "scope.pdf", mimeType: "application/pdf", fileSize: 1200 });
    const result = await attachmentService.finalizeAttachmentUpload(upload.attachment.id);

    expect(upload.uploadUrl).toBe("https://r2.example/upload");
    expect(result.status).toBe("READY");
  });

  it("authorizes download and deletes attachments", async () => {
    server.use(
      http.get(`${env.apiBaseUrl}/attachments/:id/download`, () => HttpResponse.json({ success: true, data: { downloadUrl: "https://r2.example/download", expiresAt: "2026-01-01T00:05:00.000Z" } })),
      http.delete(`${env.apiBaseUrl}/attachments/:id`, () => HttpResponse.json({ success: true, data: { deleted: true } }))
    );

    await expect(attachmentService.authorizeDownload(attachment.id)).resolves.toMatchObject({ downloadUrl: "https://r2.example/download" });
    await expect(attachmentService.deleteAttachment(attachment.id)).resolves.toEqual({ deleted: true });
  });
});
