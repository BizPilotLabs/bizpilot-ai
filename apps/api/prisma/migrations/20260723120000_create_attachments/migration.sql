CREATE TABLE "attachments" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "taskId" UUID NOT NULL,
  "uploadedBy" UUID NOT NULL,
  "originalName" VARCHAR(255) NOT NULL,
  "storedName" VARCHAR(255) NOT NULL,
  "mimeType" VARCHAR(120) NOT NULL,
  "fileSize" INTEGER NOT NULL,
  "storagePath" VARCHAR(2048) NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "attachments_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attachments_organizationId_idx" ON "attachments"("organizationId");
CREATE INDEX "attachments_taskId_idx" ON "attachments"("taskId");
CREATE INDEX "attachments_uploadedBy_idx" ON "attachments"("uploadedBy");
CREATE INDEX "attachments_createdAt_idx" ON "attachments"("createdAt");
CREATE INDEX "attachments_deletedAt_idx" ON "attachments"("deletedAt");

ALTER TABLE "attachments" ADD CONSTRAINT "attachments_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "tasks"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "attachments" ADD CONSTRAINT "attachments_uploadedBy_fkey" FOREIGN KEY ("uploadedBy") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;