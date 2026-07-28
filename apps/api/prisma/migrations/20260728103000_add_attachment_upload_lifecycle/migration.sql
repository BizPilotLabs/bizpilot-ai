CREATE TYPE "AttachmentStatus" AS ENUM ('PENDING', 'READY');

ALTER TABLE "attachments"
  ADD COLUMN "provider" VARCHAR(40) NOT NULL DEFAULT 'r2',
  ADD COLUMN "status" "AttachmentStatus" NOT NULL DEFAULT 'READY',
  ADD COLUMN "uploadExpiresAt" TIMESTAMP(3),
  ADD COLUMN "finalizedAt" TIMESTAMP(3);

UPDATE "attachments"
SET "finalizedAt" = "createdAt"
WHERE "finalizedAt" IS NULL;

CREATE INDEX "attachments_status_idx" ON "attachments"("status");
CREATE INDEX "attachments_uploadExpiresAt_idx" ON "attachments"("uploadExpiresAt");
