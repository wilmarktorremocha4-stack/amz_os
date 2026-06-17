CREATE TABLE "AllowedEmail" (
  "id"        TEXT NOT NULL,
  "email"     TEXT NOT NULL,
  "note"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AllowedEmail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AllowedEmail_email_key" ON "AllowedEmail"("email");

-- Seed the two owner emails so they can register immediately
INSERT INTO "AllowedEmail" ("id", "email", "note", "createdAt")
VALUES
  (gen_random_uuid()::text, 'wilmarktorremocha4@gmail.com', 'Owner', NOW()),
  (gen_random_uuid()::text, 'wil@operationamz.com',         'Owner', NOW());
