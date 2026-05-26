-- M2-06: convert Review.body from String to trilingual JSON.
--
-- Existing rows have a plain Kazakh string; this migration wraps
-- each existing value into a `{ kz, ru: null, kr: null }` JSONB
-- object so the loader's fill-blanks merge can fill RU/KR slots
-- from the expanded seed CSV on the next `pnpm db:seed` run.
--
-- The conversion uses an intermediate column to avoid losing data
-- if the cast fails. Idempotent: a re-apply against an already-
-- migrated schema is a no-op because `body` will already be JSONB.

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Review'
      AND column_name = 'body'
      AND data_type = 'text'
  ) THEN
    ALTER TABLE "Review" ADD COLUMN "body_new" JSONB;
    UPDATE "Review" SET "body_new" = jsonb_build_object('kz', "body", 'ru', NULL, 'kr', NULL);
    ALTER TABLE "Review" ALTER COLUMN "body_new" SET NOT NULL;
    ALTER TABLE "Review" DROP COLUMN "body";
    ALTER TABLE "Review" RENAME COLUMN "body_new" TO "body";
  END IF;
END $$;
