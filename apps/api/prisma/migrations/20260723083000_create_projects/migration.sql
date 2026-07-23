CREATE TYPE "ProjectStatus" AS ENUM ('PLANNED', 'ACTIVE', 'ON_HOLD', 'COMPLETED', 'CANCELLED');

CREATE TABLE "projects" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "organizationId" UUID NOT NULL,
  "name" VARCHAR(160) NOT NULL,
  "description" TEXT,
  "status" "ProjectStatus" NOT NULL DEFAULT 'PLANNED',
  "startDate" TIMESTAMP(3),
  "endDate" TIMESTAMP(3),
  "color" VARCHAR(32),
  "archived" BOOLEAN NOT NULL DEFAULT false,
  "createdById" UUID NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  "deletedAt" TIMESTAMP(3),
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "projects_organizationId_name_key" ON "projects"("organizationId", "name");
CREATE INDEX "projects_organizationId_idx" ON "projects"("organizationId");
CREATE INDEX "projects_createdById_idx" ON "projects"("createdById");
CREATE INDEX "projects_status_idx" ON "projects"("status");
CREATE INDEX "projects_archived_idx" ON "projects"("archived");
CREATE INDEX "projects_createdAt_idx" ON "projects"("createdAt");
CREATE INDEX "projects_deletedAt_idx" ON "projects"("deletedAt");

ALTER TABLE "projects" ADD CONSTRAINT "projects_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "organizations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "projects" ADD CONSTRAINT "projects_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;