-- AlterTable: add emailVerified to User
ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "emailVerified" TIMESTAMPTZ;

-- CreateTable: EmailVerificationToken
CREATE TABLE IF NOT EXISTS "EmailVerificationToken" (
    "id"        TEXT NOT NULL,
    "email"     TEXT NOT NULL,
    "otp"       TEXT NOT NULL,
    "expiresAt" TIMESTAMPTZ NOT NULL,
    "used"      BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "EmailVerificationToken_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "EmailVerificationToken_email_idx" ON "EmailVerificationToken"("email");
