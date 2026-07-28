import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AppError } from "../../src/core/errors/index.js";
import { ids } from "../helpers/fixtures.js";

const attachmentId = "abababab-abab-4aba-8aba-abababababab";
const taskId = "cdcdcdcd-cdcd-4cdc-8cdc-cdcdcdcdcdcd";
const now = new Date("2026-01-01T00:00:00.000Z");

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

const storageProviderMock = vi.hoisted(() => ({
  providerName: "r2",
  enabled: true,
  createUploadUrl: vi.fn(),
  createDownloadUrl: vi.fn(),
  getObjectMetadata: vi.fn(),
  deleteObject: vi.fn()
}));

vi.mock("../../src/modules/attachments/attachment.repository.js", () => ({ attachmentRepository: attachmentRepositoryMock }));
vi.mock("../../src/core/storage/index.js", () => ({ storageProvider: storageProviderMock }));

const { attachmentService } = await import("../../src/modules/attachments/attachment.service.js");

const attachment = (overrides: Record<string, unknown> = {}) => ({
  id: attachmentId,
  organizationId: ids.organizationA,
  taskId,
  uploadedBy: ids.ownerUser,
  originalName: "scope.pdf",
  storedName: "scope.pdf",
  mimeType: "application/pdf",
  fileSize: 1200,
  storagePath: `organizations/${ids.organizationA}/tasks/${taskId}/attachments/${attachmentId}/scope.pdf`,
  provider: "r2",
  status: "PENDING",
  uploadExpiresAt: new Date(Date.now() + 60_000),
  finalizedAt: null,
  createdAt: now,
  deletedAt: null,
  ...overrides
});

describe("AttachmentService", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    storageProviderMock.enabled = true;
    attachmentRepositoryMock.findTaskInOrganization.mockResolvedValue({ id: taskId });
    attachmentRepositoryMock.findUploaderInOrganization.mockResolvedValue({ id: ids.ownerUser });
    attachmentRepositoryMock.createPendingAttachment.mockImplementation((input) => Promise.resolve(attachment({ id: input.id, storagePath: input.storagePath, storedName: input.storedName, uploadExpiresAt: input.uploadExpiresAt })));
    attachmentRepositoryMock.findAttachmentByIdInOrganization.mockResolvedValue(attachment());
    attachmentRepositoryMock.findReadyAttachmentByIdInOrganization.mockResolvedValue(attachment({ status: "READY", finalizedAt: now, uploadExpiresAt: null }));
    attachmentRepositoryMock.finalizeAttachment.mockResolvedValue(attachment({ status: "READY", finalizedAt: now, uploadExpiresAt: null }));
    attachmentRepositoryMock.findAttachments.mockResolvedValue({ attachments: [attachment({ status: "READY", finalizedAt: now, uploadExpiresAt: null })], total: 1 });
    attachmentRepositoryMock.deleteExpiredPendingAttachments.mockResolvedValue([attachment()]);
    storageProviderMock.createUploadUrl.mockResolvedValue({ url: "https://r2.example/upload", headers: { "content-type": "application/pdf" } });
    storageProviderMock.createDownloadUrl.mockResolvedValue({ url: "https://r2.example/download" });
    storageProviderMock.getObjectMetadata.mockResolvedValue({ contentLength: 1200, contentType: "application/pdf" });
    storageProviderMock.deleteObject.mockResolvedValue(undefined);
  });

  it("initializes an authorized task upload with a generated tenant-scoped key", async () => {
    const result = await attachmentService.initializeUpload({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      taskId,
      data: { originalName: "Scope Final.pdf", mimeType: "application/pdf", fileSize: 1200 }
    });

    expect(result.uploadUrl).toBe("https://r2.example/upload");
    expect(attachmentRepositoryMock.createPendingAttachment).toHaveBeenCalledWith(expect.objectContaining({
      organizationId: ids.organizationA,
      uploadedBy: ids.ownerUser,
      taskId,
      storagePath: expect.stringContaining(`organizations/${ids.organizationA}/tasks/${taskId}/attachments/`)
    }));
    expect(result.attachment.storagePath).toContain("organizations/");
  });

  it("rejects disabled storage before creating pending metadata", async () => {
    storageProviderMock.enabled = false;

    await expect(attachmentService.initializeUpload({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      taskId,
      data: { originalName: "scope.pdf", mimeType: "application/pdf", fileSize: 1200 }
    })).rejects.toMatchObject<AppError>({ code: "STORAGE_NOT_CONFIGURED" });

    expect(attachmentRepositoryMock.createPendingAttachment).not.toHaveBeenCalled();
  });

  it("rejects unsupported file extensions before presigning", async () => {
    await expect(attachmentService.initializeUpload({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      taskId,
      data: { originalName: "payload.exe", mimeType: "application/pdf", fileSize: 1200 }
    })).rejects.toMatchObject<AppError>({ code: "ATTACHMENT_EXTENSION_NOT_ALLOWED" });

    expect(storageProviderMock.createUploadUrl).not.toHaveBeenCalled();
  });

  it("finalizes only after storage object metadata matches the authorization", async () => {
    const result = await attachmentService.finalizeUpload({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      attachmentId,
      metadata: { ipAddress: undefined, userAgent: undefined }
    });

    expect(result.status).toBe("READY");
    expect(storageProviderMock.getObjectMetadata).toHaveBeenCalledWith(expect.stringContaining("organizations/"));
    expect(attachmentRepositoryMock.finalizeAttachment).toHaveBeenCalled();
  });

  it("rejects missing objects during finalization", async () => {
    storageProviderMock.getObjectMetadata.mockResolvedValue(null);

    await expect(attachmentService.finalizeUpload({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      attachmentId,
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "ATTACHMENT_OBJECT_MISSING" });
  });

  it("rejects duplicate finalization", async () => {
    attachmentRepositoryMock.findAttachmentByIdInOrganization.mockResolvedValue(attachment({ status: "READY", finalizedAt: now, uploadExpiresAt: null }));

    await expect(attachmentService.finalizeUpload({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      attachmentId,
      metadata: { ipAddress: undefined, userAgent: undefined }
    })).rejects.toMatchObject<AppError>({ code: "ATTACHMENT_ALREADY_FINALIZED" });
  });

  it("authorizes downloads through the storage provider", async () => {
    const result = await attachmentService.authorizeDownload({ organizationId: ids.organizationA, attachmentId });

    expect(result.downloadUrl).toBe("https://r2.example/download");
    expect(storageProviderMock.createDownloadUrl).toHaveBeenCalledWith(expect.objectContaining({ key: expect.stringContaining("organizations/"), filename: "scope.pdf" }));
  });

  it("deletes storage before soft deleting metadata", async () => {
    await attachmentService.deleteAttachment({
      organizationId: ids.organizationA,
      actorUserId: ids.ownerUser,
      attachmentId,
      metadata: { ipAddress: undefined, userAgent: undefined }
    });

    expect(storageProviderMock.deleteObject).toHaveBeenCalledWith(expect.stringContaining("organizations/"));
    expect(attachmentRepositoryMock.softDeleteAttachment).toHaveBeenCalled();
  });

  it("cleans expired pending uploads without failing on object cleanup errors", async () => {
    storageProviderMock.deleteObject.mockRejectedValue(new Error("missing"));

    const result = await attachmentService.cleanupExpiredPendingUploads({ now });

    expect(result.deleted).toBe(1);
  });
});
