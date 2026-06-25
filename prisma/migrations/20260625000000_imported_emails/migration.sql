CREATE TABLE IF NOT EXISTS "ImportedEmail" (
    "id"         TEXT NOT NULL,
    "hash"       TEXT NOT NULL,
    "userId"     TEXT NOT NULL,
    "fromEmail"  TEXT NOT NULL,
    "subject"    TEXT NOT NULL,
    "supplierId" TEXT,
    "createdAt"  TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ImportedEmail_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ImportedEmail_hash_key" ON "ImportedEmail"("hash");
CREATE INDEX IF NOT EXISTS "ImportedEmail_userId_createdAt_idx" ON "ImportedEmail"("userId", "createdAt");

ALTER TABLE "ImportedEmail" ADD CONSTRAINT "ImportedEmail_userId_fkey"
    FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
