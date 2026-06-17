-- ============================================================
-- PASTE THIS ENTIRE BLOCK INTO SUPABASE SQL EDITOR
-- ============================================================

-- Fix login (missing password column)
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "password" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "firstName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "lastName" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "nickname" TEXT;
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "companyWebsite" TEXT;

-- Fix archive page (soft-delete columns)
ALTER TABLE "Supplier" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CalculatorRun" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "CalculatorRun" ADD COLUMN IF NOT EXISTS "name" TEXT NOT NULL DEFAULT 'Untitled';

-- Signup whitelist
CREATE TABLE IF NOT EXISTS "AllowedEmail" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "email" TEXT NOT NULL,
  "note" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AllowedEmail_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "AllowedEmail_email_key" UNIQUE ("email")
);

-- Sales Pipelines
CREATE TABLE IF NOT EXISTS "Pipeline" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Pipeline_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PipelineStage" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "pipelineId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PipelineStage_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Opportunity" (
  "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL,
  "supplierId" TEXT,
  "pipelineId" TEXT NOT NULL,
  "stageId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "value" DECIMAL(12,2),
  "status" TEXT NOT NULL DEFAULT 'open',
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Opportunity_pkey" PRIMARY KEY ("id")
);

-- Foreign keys (ignore errors if constraints already exist)
DO $$ BEGIN
  ALTER TABLE "Pipeline" ADD CONSTRAINT "Pipeline_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "PipelineStage" ADD CONSTRAINT "PipelineStage_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_supplierId_fkey"
    FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_pipelineId_fkey"
    FOREIGN KEY ("pipelineId") REFERENCES "Pipeline"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Opportunity" ADD CONSTRAINT "Opportunity_stageId_fkey"
    FOREIGN KEY ("stageId") REFERENCES "PipelineStage"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
