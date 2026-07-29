import type { Attachment } from "@prisma/client";
import request from "supertest";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ids, rbacUser } from "../helpers/fixtures.js";

const authServiceMock = vi.hoisted(() => ({ verifyAccessToken: vi.fn() }));
const rbacRepositoryMock = vi.hoisted(() => ({ findUserByIdInOrganization: vi.fn() }));
const backgroundJobDispatcherMock = vi.hoisted(() => ({
  workerType: "in_process",
  dispatch: vi.fn(),
  shutdown: vi.fn(),
  stats: vi.fn()
}));
const attachmentRepositoryMock = vi.hoisted(() => ({
  findTaskInOrganization: vi.fn(),
  findUploaderInOrganization: vi.fn(),
  findAttachments: vi.fn(),
  findReadyAttachmentByIdInOrganization: vi.fn(),
  findAttachmentByIdInOrganization: vi.fn(),
  createPendingAttachment: vi.fn(),
  finalizeAttachment: vi.fn(),
  requestExtraction: vi.fn(),
  retryExtraction: vi.fn(),
  markExtractionUnsupported: vi.fn(),
  claimExtractionJob: vi.fn(),
  completeExtraction: vi.fn(),
  failExtraction: vi.fn(),
  softDeleteAttachment: vi.fn(),
  deleteExpiredPendingAttachments: vi.fn()
}));

vi.mock("../../src/modules/auth/auth.service.js", () => ({ authService: authServiceMock }));
vi.mock("../../src/modules/rbac/rbac.repository.js", () => ({ rbacRepository: rbacRepositoryMock }));
vi.mock("../../src/core/background/index.js", () => ({ backgroundJobDispatcher: backgroundJobDispatcherMock }));
vi.mock("../../src/modules/attachments/attachment.repository.js", () => ({ attachmentRepository: attachmentRepositoryMock }));

const { createApp } = await import("../../src/app.js");

const attachmentId = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
const taskId = "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb";
const now = new Date("2026-01-01T00:00:00.000Z");

const attachment = (overrides: Partial<Attachment> = {}): Attachment => ({
  id: attachmentId,
  organizationId: ids.organizationA,
  taskId,
  uploadedBy: ids.ownerUser,
  originalName: "notes.txt",
  storedName: "notes.txt",
  mimeType: "text/plain",
  fileSize: 64,
  storagePath: `organizations/${ids.organizationA}/tasks/${taskId}/attachments/${attachmentId}/notes.txt`,
  provider: "r2",
  status: "READY",
  uploadExpiresAt: null,
  finalizedAt: now,
  extractionStatus: "NOT_REQUESTED",
  extractedText: null,
  extractionErrorCode: null,
  extractionRequestedAt: null,
  extractionStartedAt: null,
  extractionCompletedAt: null,
  extractorName: null,
  extractorVersion: null,
  extractedCharacterCount: null,
  extractionTruncated: false,
  createdAt: now,
  deletedAt: null,
  ...overrides
});

describe("Attachment extraction routes", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    authServiceMock.verifyAccessToken.mockReturnValue({ userId: ids.ownerUser, organizationId: ids.organizationA, sessionId: "session-id", tokenVersion: 1 });
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser());
    backgroundJobDispatcherMock.dispatch.mockReturnValue({ status: "accepted", activeCount: 0, queuedCount: 1 });
    attachmentRepositoryMock.findReadyAttachmentByIdInOrganization.mockResolvedValue(attachment());
    attachmentRepositoryMock.requestExtraction.mockResolvedValue(attachment({ extractionStatus: "PENDING", extractionRequestedAt: now }));
    attachmentRepositoryMock.retryExtraction.mockResolvedValue(attachment({ extractionStatus: "PENDING", extractionRequestedAt: now }));
    attachmentRepositoryMock.markExtractionUnsupported.mockResolvedValue(attachment({ mimeType: "image/png", originalName: "image.png", extractionStatus: "UNSUPPORTED", extractionErrorCode: "UNSUPPORTED_FILE_TYPE", extractionCompletedAt: now }));
  });

  it("requires authentication before requesting extraction", async () => {
    const response = await request(createApp()).post(`/attachments/${attachmentId}/extraction`);

    expect(response.status).toBe(401);
    expect(backgroundJobDispatcherMock.dispatch).not.toHaveBeenCalled();
  });

  it("requires attachment create permission before requesting extraction", async () => {
    rbacRepositoryMock.findUserByIdInOrganization.mockResolvedValue(rbacUser({ roles: [] }));

    const response = await request(createApp()).post(`/attachments/${attachmentId}/extraction`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(403);
    expect(attachmentRepositoryMock.findReadyAttachmentByIdInOrganization).not.toHaveBeenCalled();
  });

  it("queues extraction for a ready tenant-scoped attachment", async () => {
    const response = await request(createApp()).post(`/attachments/${attachmentId}/extraction`).set("Authorization", "Bearer valid-token").set("User-Agent", "extract-test");

    expect(response.status).toBe(202);
    expect(attachmentRepositoryMock.findReadyAttachmentByIdInOrganization).toHaveBeenCalledWith(expect.objectContaining({ attachmentId, organizationId: ids.organizationA }));
    expect(backgroundJobDispatcherMock.dispatch).toHaveBeenCalledWith(expect.objectContaining({ key: `attachment-extraction:${attachmentId}`, name: "attachment_extraction" }));
    expect(response.body.data.extraction.status).toBe("PENDING");
    expect(JSON.stringify(response.body)).not.toContain("organizations/");
  });

  it("returns extraction status without storage internals", async () => {
    attachmentRepositoryMock.findReadyAttachmentByIdInOrganization.mockResolvedValue(attachment({ extractionStatus: "COMPLETED", extractedText: "Sensitive text", extractedCharacterCount: 14, extractionCompletedAt: now, extractorName: "plain_text", extractorVersion: "1" }));

    const response = await request(createApp()).get(`/attachments/${attachmentId}/extraction`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body.data.extraction.status).toBe("COMPLETED");
    expect(response.body.data.extraction.text).toBeUndefined();
    expect(JSON.stringify(response.body)).not.toContain("Sensitive text");
  });

  it("returns extracted text only through the text endpoint", async () => {
    attachmentRepositoryMock.findReadyAttachmentByIdInOrganization.mockResolvedValue(attachment({ extractionStatus: "COMPLETED", extractedText: "Plain extracted text", extractedCharacterCount: 20, extractionCompletedAt: now, extractorName: "plain_text", extractorVersion: "1" }));

    const response = await request(createApp()).get(`/attachments/${attachmentId}/extraction/text`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(200);
    expect(response.body.data.extraction.text).toBe("Plain extracted text");
    expect(JSON.stringify(response.body)).not.toContain("organizations/");
  });

  it("marks unsupported files safely", async () => {
    attachmentRepositoryMock.findReadyAttachmentByIdInOrganization.mockResolvedValue(attachment({ mimeType: "image/png", originalName: "image.png" }));

    const response = await request(createApp()).post(`/attachments/${attachmentId}/extraction`).set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(202);
    expect(response.body.data.extraction.status).toBe("UNSUPPORTED");
    expect(backgroundJobDispatcherMock.dispatch).not.toHaveBeenCalled();
  });

  it("rejects invalid attachment ids before lookup", async () => {
    const response = await request(createApp()).get("/attachments/not-a-uuid/extraction").set("Authorization", "Bearer valid-token");

    expect(response.status).toBe(400);
    expect(attachmentRepositoryMock.findReadyAttachmentByIdInOrganization).not.toHaveBeenCalled();
  });
});
