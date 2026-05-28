-- M3-03: idempotency-key support on Lead.
--
-- Adds a nullable `idempotencyKey` column + a composite index on
-- (userId, idempotencyKey) so POST /api/leads can dedupe retries
-- driven by the client's Idempotency-Key header.
--
-- Idempotent: a re-apply against an already-migrated schema is a
-- no-op because the column / index existence is guarded.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Lead' AND column_name = 'idempotencyKey'
  ) THEN
    ALTER TABLE "Lead" ADD COLUMN "idempotencyKey" TEXT;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS "Lead_userId_idempotencyKey_idx"
  ON "Lead" ("userId", "idempotencyKey");
