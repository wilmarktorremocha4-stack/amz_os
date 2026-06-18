-- OperationAMZ Platform Expansion Migration
-- Run this in Supabase SQL Editor

-- Email Campaigns
CREATE TABLE IF NOT EXISTS "EmailCampaign" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  "bodyJson" JSONB NOT NULL DEFAULT '{}',
  "fromName" TEXT,
  "fromEmail" TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  "sentAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Recipients (tracks per-contact delivery + engagement)
CREATE TABLE IF NOT EXISTS "EmailRecipient" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "campaignId" TEXT REFERENCES "EmailCampaign"(id) ON DELETE CASCADE,
  "stepId" TEXT,
  "supplierId" TEXT REFERENCES "Supplier"(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  token TEXT NOT NULL UNIQUE DEFAULT gen_random_uuid()::text,
  "sentAt" TIMESTAMPTZ,
  "openedAt" TIMESTAMPTZ,
  "clickedAt" TIMESTAMPTZ,
  "bouncedAt" TIMESTAMPTZ,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Events (open/click/bounce audit log)
CREATE TABLE IF NOT EXISTS "EmailEvent" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "recipientId" TEXT NOT NULL REFERENCES "EmailRecipient"(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  url TEXT,
  "occurredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Sequences
CREATE TABLE IF NOT EXISTS "EmailSequence" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active',
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Email Sequence Steps
CREATE TABLE IF NOT EXISTS "EmailSequenceStep" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sequenceId" TEXT NOT NULL REFERENCES "EmailSequence"(id) ON DELETE CASCADE,
  subject TEXT NOT NULL,
  "bodyJson" JSONB NOT NULL DEFAULT '{}',
  "delayDays" INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  "createdAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add FK from EmailRecipient to EmailSequenceStep
ALTER TABLE "EmailRecipient"
  ADD CONSTRAINT "EmailRecipient_stepId_fkey"
  FOREIGN KEY ("stepId") REFERENCES "EmailSequenceStep"(id) ON DELETE SET NULL;

-- Sequence Enrollments
CREATE TABLE IF NOT EXISTS "SequenceEnrollment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "sequenceId" TEXT NOT NULL REFERENCES "EmailSequence"(id) ON DELETE CASCADE,
  "supplierId" TEXT NOT NULL REFERENCES "Supplier"(id) ON DELETE CASCADE,
  "currentStep" INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'active',
  "startedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "nextSendAt" TIMESTAMPTZ,
  UNIQUE ("sequenceId", "supplierId")
);

-- Contact Enrichment
CREATE TABLE IF NOT EXISTS "ContactEnrichment" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierId" TEXT NOT NULL UNIQUE REFERENCES "Supplier"(id) ON DELETE CASCADE,
  "websiteUrl" TEXT,
  "contactPageUrl" TEXT,
  "linkedinUrl" TEXT,
  "instagramUrl" TEXT,
  "facebookUrl" TEXT,
  "twitterUrl" TEXT,
  phone TEXT,
  "discoveredEmail" TEXT,
  source TEXT NOT NULL DEFAULT 'manual',
  "enrichedAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Brand Scans (Apify results)
CREATE TABLE IF NOT EXISTS "BrandScan" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "userId" TEXT NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  results JSONB,
  "runAt" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "completedAt" TIMESTAMPTZ
);

-- Lead Scores
CREATE TABLE IF NOT EXISTS "LeadScore" (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "supplierId" TEXT NOT NULL UNIQUE REFERENCES "Supplier"(id) ON DELETE CASCADE,
  score INTEGER NOT NULL DEFAULT 0,
  signals JSONB,
  "scoredAt" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add bodyJson to EmailTemplate (nullable for backward compat)
ALTER TABLE "EmailTemplate" ADD COLUMN IF NOT EXISTS "bodyJson" JSONB;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS "EmailRecipient_campaignId_idx" ON "EmailRecipient"("campaignId");
CREATE INDEX IF NOT EXISTS "EmailRecipient_supplierId_idx" ON "EmailRecipient"("supplierId");
CREATE INDEX IF NOT EXISTS "EmailRecipient_token_idx" ON "EmailRecipient"(token);
CREATE INDEX IF NOT EXISTS "EmailEvent_recipientId_idx" ON "EmailEvent"("recipientId");
CREATE INDEX IF NOT EXISTS "BrandScan_userId_idx" ON "BrandScan"("userId");

-- Enable RLS on all new tables
ALTER TABLE "EmailCampaign" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailRecipient" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailEvent" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailSequence" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "EmailSequenceStep" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "SequenceEnrollment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "ContactEnrichment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "BrandScan" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "LeadScore" ENABLE ROW LEVEL SECURITY;
