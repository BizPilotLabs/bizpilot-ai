import type { Attachment } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ids, rbacUser } from "../helpers/fixtures.js";

const authServiceMock = vi.hoisted(() => ({ verifyAccessToken: vi.fn() }));
const rbacRepositoryMock = vi.hoisted(() => ({ findUserByIdInOrganization: vi.fn() }));
const storageProviderMock = vi.hoisted(() => ({
  enabled: true,
  providerName: "r2",
  createUploadUrl: vi.fn(),
  createDownloadUrl: vi.fn(),
  getObjectMetadata: vi.fn(),
  deleteObject: vi.fn()
}));
const attachmentRepositoryMock = vi.hoisted(() => ({
  findTaskInOrganization: vi.fn(),
  findUploaderInOrganization: vi.fn(),
  findAttachments: vi.fn(),
  findReadyAttachmentByIdInOrganization: vi.fn(),
  findAttachmentByIdInOrganization: vi.fn(),
  createPendingAttachment: vi.fn(),
  finalizeAttachment: vi.fn(),
  softDeleteAttachment: vi.fn(),
  deleteExpiredPendingAttachments: vi.fn()
}));

vi.mock("../../src/modules/auth/auth.service.js", () => ({ authService: authServiceMock }));
vi.mock("../../src/modules/rbac/rbac.repository.js", () => ({ rbacRepository: rbacRepositoryMock }));
vi.mock("../../src/core/storage/index.js", () => ({ storageProvider: storageProviderMock }));
vi.mock("../../src/modules/attachments/attachment.repository.js", () => ({ attachmentRepository: attachmentRepositoryMock }));

const { createApp } = await import("../../src/app.js");

const attachmentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const taskId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const storagePath = `organizations/${ids.organizationA}/tasks/${taskId}/attachments/${attachmentId}/launch.pdf`;
const now = new Date("2026-01-01T00:00:00.000Z");

const attachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  id: attachmentId,
  organizationId: ids.organizationA,
  taskId,
  uploadedBy: ids.ownerUser,
  originalName: "launch.pdf",
  storedName: "launch.pdf",
  mimeType: "application/pdf",
  fileSize: 4096,
  storagePath,
  provider: "r2",
  status: "READY",
  uploadExpiresAt: null,
  finalizedAt: now,
  createdAt: now,
  deletedAt: null,
  ...overrides
});

describe("Attachment lifecycle routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMock.verifyAccessToken.mockReturnValue({ userId: ids.ownerUser, organizationId: ids.organizationA, sessionId: "session-id", tokenVersion: 1 });
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser());
    attachmentRepositoryMock.findAttachmentByIdInOrganization.mockResolvedValue(attachment());
    attachmentRepositoryMock.findReadyAttachmentByIdInOrganization.mockResolvedValue(attachment());
    attachmentRepositoryMock.finalizeAttachment.mockResolvedValue(attachment());
    attachmentRepositoryMock.softDeleteAttachment.mockResolvedValue(undefined);
    storageProviderMock.createDownloadUrl.mockResolvedValue({ url: "https://storage.example/download", headers: {} });
    storageProviderMock.getObjectMetadata.mockResolvedValue({ contentLength: 4096, contentType: "application/pdf" });
    storageProviderMock.deleteObject.mockResolvedValue(undefined);
  });

  it("requires authentication before deleting attachments", async () => {
    const response = await request(createApp()).delete(`/attachments/${attachmentId}`);

    expect(response.status).toBe(401);
    expect(response.body).toMatchObject({ success: false, error: { code: "AUTH_TOKEN_REQUIRED" } });
    expect(storageProviderMock.deleteObject).not.toHaveBeenCalled();
  });

  it("requires attachments.delete before deleting attachments", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).delete(`/attachments/${attachmentId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(attachmentRepositoryMock.findAttachmentByIdInOrganization).not.toHaveBeenCalled();
  });

  it("rejects invalid attachment ids before deletion lookup", async () => {
    const response = await request(createApp()).delete("/attachments/not-a-uuid").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(400);
    expect(attachmentRepositoryMock.findAttachmentByIdInOrganization).not.toHaveBeenCalled();
  });

  it("soft deletes attachments using authenticated organization and user context", async () => {
    const response = await request(createApp()).delete(`/attachments/${attachmentId}`).set("Authorization", "Bearer valid-token").set("User-Agent", "attachment-delete-test");

    expect(response.status).toBe(200);
    expect(attachmentRepositoryMock.findAttachmentByIdInOrganization).toHaveBeenCalledWith({ attachmentId, organizationId: ids.organizationA });
    expect(storageProviderMock.deleteObject).toHaveBeenCalledWith(storagePath);
    expect(attachmentRepositoryMock.softDeleteAttachment).toHaveBeenCalledWith({
      attachment: expect.objectContaining({ id: attachmentId }),
      actorUserId: ids.ownerUser,
      metadata: expect.objectContaining({ userAgent: "attachment-delete-test" })
    });
    expect(response.body).toEqual({ success: true, data: { deleted: true } });
  });

  it("safely reports missing or cross-tenant attachments during deletion", async () => {
    attachmentRepositoryMock.findAttachmentByIdInOrganization.mockResolvedValue(null);

    const response = await request(createApp()).delete(`/attachments/${attachmentId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(404);
    expect(response.body).toMatchObject({ success: false, error: { code: "ATTACHMENT_NOT_FOUND" } });
    expect(response.body.error.message).not.toContain(storagePath);
    expect(storageProviderMock.deleteObject).not.toHaveBeenCalled();
  });

  it("does not expose storage paths when object deletion fails", async () => {
    storageProviderMock.deleteObject.mockRejectedValue(new Error("storage unavailable"));

    const response = await request(createApp()).delete(`/attachments/${attachmentId}`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(500);
    expect(JSON.stringify(response.body)).not.toContain(storagePath);
    expect(attachmentRepositoryMock.softDeleteAttachment).not.toHaveBeenCalled();
  });

  it("authorizes downloads without exposing storage credentials or keys", async () => {
    const response = await request(createApp()).get(`/attachments/${attachmentId}/download`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(attachmentRepositoryMock.findReadyAttachmentByIdInOrganization).toHaveBeenCalledWith({ attachmentId, organizationId: ids.organizationA });
    expect(storageProviderMock.createDownloadUrl).toHaveBeenCalledWith(expect.objectContaining({ key: storagePath, filename: "launch.pdf" }));
    expect(response.body.success).toBe(true);
    expect(response.body.data.downloadUrl).toBe("https://storage.example/download");
    expect(response.body.data.storagePath).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain(storagePath);
  });

  it("requires attachments.read before authorizing downloads", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).get(`/attachments/${attachmentId}/download`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(storageProviderMock.createDownloadUrl).not.toHaveBeenCalled();
  });

  it("finalizes pending uploads with authenticated organization and user context", async () => {
    const pendingAttachment = attachment({ status: "PENDING", finalizedAt: null, uploadExpiresAt: new Date("2026-12-31T00:00:00.000Z") });
    attachmentRepositoryMock.findAttachmentByIdInOrganization.mockResolvedValue(pendingAttachment);

    const response = await request(createApp()).post(`/attachments/${attachmentId}/complete`).set("Authorization", "Bearer valid-token").set("User-Agent", "attachment-finalize-test");

    expect(response.status).toBe(200);
    expect(storageProviderMock.getObjectMetadata).toHaveBeenCalledWith(storagePath);
    expect(attachmentRepositoryMock.finalizeAttachment).toHaveBeenCalledWith({
      attachment: pendingAttachment,
      actorUserId: ids.ownerUser,
      metadata: expect.objectContaining({ userAgent: "attachment-finalize-test" })
    });
    expect(response.body.data.attachment.id).toBe(attachmentId);
  });

  it("requires attachments.create before finalizing uploads", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).post(`/attachments/${attachmentId}/complete`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(storageProviderMock.getObjectMetadata).not.toHaveBeenCalled();
  });

  it("rejects already finalized uploads", async () => {
    const response = await request(createApp()).post(`/attachments/${attachmentId}/complete`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ success: false, error: { code: "ATTACHMENT_ALREADY_FINALIZED" } });
    expect(attachmentRepositoryMock.finalizeAttachment).not.toHaveBeenCalled();
  });

  it("rejects missing uploaded objects during finalization without exposing storage paths", async () => {
    attachmentRepositoryMock.findAttachmentByIdInOrganization.mockResolvedValue(attachment({ status: "PENDING", finalizedAt: null, uploadExpiresAt: new Date("2026-12-31T00:00:00.000Z") }));
    storageProviderMock.getObjectMetadata.mockResolvedValue(null);

    const response = await request(createApp()).post(`/attachments/${attachmentId}/complete`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(409);
    expect(response.body).toMatchObject({ success: false, error: { code: "ATTACHMENT_OBJECT_MISSING" } });
    expect(JSON.stringify(response.body)).not.toContain(storagePath);
    expect(attachmentRepositoryMock.finalizeAttachment).not.toHaveBeenCalled();
  });
});
