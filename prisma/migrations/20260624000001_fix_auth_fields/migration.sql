-- Backfill emailVerified for all existing users who predate email verification
UPDATE "User" SET "emailVerified" = NOW() WHERE "emailVerified" IS NULL;

-- Add attempts column to PasswordResetToken (if missing)
ALTER TABLE "PasswordResetToken" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;

-- Add attempts column to EmailVerificationToken (if missing)
ALTER TABLE "EmailVerificationToken" ADD COLUMN IF NOT EXISTS "attempts" INTEGER NOT NULL DEFAULT 0;

-- Add indexes for faster token lookups
CREATE INDEX IF NOT EXISTS "PasswordResetToken_email_used_expiresAt_idx" ON "PasswordResetToken"("email", "used", "expiresAt");
CREATE INDEX IF NOT EXISTS "EmailVerificationToken_email_used_expiresAt_idx" ON "EmailVerificationToken"("email", "used", "expiresAt");
