CREATE TYPE "AttachmentExtractionStatus" AS ENUM ('NOT_REQUESTED', 'PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'UNSUPPORTED');

ALTER TABLE "attachments"
  ADD COLUMN "extractionStatus" "AttachmentExtractionStatus" NOT NULL DEFAULT 'NOT_REQUESTED',
  ADD COLUMN "extractedText" TEXT,
  ADD COLUMN "extractionErrorCode" VARCHAR(80),
  ADD COLUMN "extractionRequestedAt" TIMESTAMP(3),
  ADD COLUMN "extractionStartedAt" TIMESTAMP(3),
  ADD COLUMN "extractionCompletedAt" TIMESTAMP(3),
  ADD COLUMN "extractorName" VARCHAR(80),
  ADD COLUMN "extractorVersion" VARCHAR(40),
  ADD COLUMN "extractedCharacterCount" INTEGER,
  ADD COLUMN "extractionTruncated" BOOLEAN NOT NULL DEFAULT false;

CREATE INDEX "attachments_extractionStatus_idx" ON "attachments"("extractionStatus");
CREATE INDEX "attachments_organizationId_extractionStatus_idx" ON "attachments"("organizationId", "extractionStatus");
