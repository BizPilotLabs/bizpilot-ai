ALTER TABLE "users"
  ADD COLUMN "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN "lockedUntil" TIMESTAMP(3),
  ADD COLUMN "tokenVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "mfaEnabled" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN "mfaSecret" VARCHAR(255);

ALTER TABLE "sessions"
  ADD COLUMN "deviceId" VARCHAR(120),
  ADD COLUMN "browser" VARCHAR(120),
  ADD COLUMN "operatingSystem" VARCHAR(120),
  ADD COLUMN "country" VARCHAR(2),
  ADD COLUMN "city" VARCHAR(120),
  ADD COLUMN "lastSeenAt" TIMESTAMP(3),
  ADD COLUMN "mfaVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "revokedReason" VARCHAR(255);

ALTER TABLE "refresh_tokens"
  ADD COLUMN "tokenFamilyId" UUID DEFAULT gen_random_uuid(),
  ADD COLUMN "parentTokenId" UUID,
  ADD COLUMN "replacedByTokenId" UUID,
  ADD COLUMN "rotatedAt" TIMESTAMP(3),
  ADD COLUMN "revokedReason" VARCHAR(255),
  ADD COLUMN "reuseDetectedAt" TIMESTAMP(3);

UPDATE "refresh_tokens"
SET "tokenFamilyId" = "id"
WHERE "tokenFamilyId" IS NULL;

ALTER TABLE "refresh_tokens"
  ALTER COLUMN "tokenFamilyId" SET NOT NULL;

CREATE TABLE "verification_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tokenHash" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "verification_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "password_reset_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID NOT NULL,
  "tokenHash" VARCHAR(255) NOT NULL,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "password_reset_tokens_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "login_history" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "userId" UUID,
  "organizationId" UUID,
  "ipAddress" INET,
  "userAgent" TEXT,
  "browser" VARCHAR(120),
  "operatingSystem" VARCHAR(120),
  "country" VARCHAR(2),
  "city" VARCHAR(120),
  "success" BOOLEAN NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "login_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "users_lockedUntil_idx" ON "users"("lockedUntil");
CREATE INDEX "users_tokenVersion_idx" ON "users"("tokenVersion");

CREATE INDEX "sessions_deviceId_idx" ON "sessions"("deviceId");
CREATE INDEX "sessions_lastSeenAt_idx" ON "sessions"("lastSeenAt");

CREATE INDEX "refresh_tokens_tokenFamilyId_idx" ON "refresh_tokens"("tokenFamilyId");
CREATE INDEX "refresh_tokens_parentTokenId_idx" ON "refresh_tokens"("parentTokenId");
CREATE UNIQUE INDEX "refresh_tokens_replacedByTokenId_key" ON "refresh_tokens"("replacedByTokenId");
CREATE INDEX "refresh_tokens_rotatedAt_idx" ON "refresh_tokens"("rotatedAt");
CREATE INDEX "refresh_tokens_reuseDetectedAt_idx" ON "refresh_tokens"("reuseDetectedAt");

CREATE UNIQUE INDEX "verification_tokens_tokenHash_key" ON "verification_tokens"("tokenHash");
CREATE INDEX "verification_tokens_userId_idx" ON "verification_tokens"("userId");
CREATE INDEX "verification_tokens_expiresAt_idx" ON "verification_tokens"("expiresAt");
CREATE INDEX "verification_tokens_consumedAt_idx" ON "verification_tokens"("consumedAt");

CREATE UNIQUE INDEX "password_reset_tokens_tokenHash_key" ON "password_reset_tokens"("tokenHash");
CREATE INDEX "password_reset_tokens_userId_idx" ON "password_reset_tokens"("userId");
CREATE INDEX "password_reset_tokens_expiresAt_idx" ON "password_reset_tokens"("expiresAt");
CREATE INDEX "password_reset_tokens_consumedAt_idx" ON "password_reset_tokens"("consumedAt");

CREATE INDEX "login_history_userId_idx" ON "login_history"("userId");
CREATE INDEX "login_history_organizationId_idx" ON "login_history"("organizationId");
CREATE INDEX "login_history_success_idx" ON "login_history"("success");
CREATE INDEX "login_history_createdAt_idx" ON "login_history"("createdAt");
CREATE INDEX "login_history_ipAddress_idx" ON "login_history"("ipAddress");

ALTER TABLE "verification_tokens" ADD CONSTRAINT "verification_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "password_reset_tokens" ADD CONSTRAINT "password_reset_tokens_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "login_history" ADD CONSTRAINT "login_history_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE SET NULL ON UPDATE CASCADE;ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_parentTokenId_fkey" FOREIGN KEY ("parentTokenId") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_replacedByTokenId_fkey" FOREIGN KEY ("replacedByTokenId") REFERENCES "refresh_tokens"("id") ON DELETE SET NULL ON UPDATE CASCADE;