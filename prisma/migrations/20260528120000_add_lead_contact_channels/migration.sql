-- M3-polish: WhatsApp / Telegram identifiers + preferred consult
-- language on Lead.
--
-- Kazakhstan field-research correction: phone-only contact loses a
-- large share of leads to "I never answer numbers I don't know."
-- WhatsApp + Telegram are the actual reach channels.
--
-- Stored as informational columns ONLY — hard rule §8 still forbids
-- writes to Channel.wa / Channel.tg from lib/messaging/send.ts. The
-- manager opens the chat manually using these identifiers.
--
-- Idempotent: a re-apply against an already-migrated schema is a
-- no-op (columns guarded with IF NOT EXISTS).

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Lead' AND column_name = 'whatsappId'
  ) THEN
    ALTER TABLE "Lead" ADD COLUMN "whatsappId" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Lead' AND column_name = 'telegramId'
  ) THEN
    ALTER TABLE "Lead" ADD COLUMN "telegramId" TEXT;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'Lead' AND column_name = 'preferredLanguage'
  ) THEN
    ALTER TABLE "Lead" ADD COLUMN "preferredLanguage" "Locale";
  END IF;
END $$;
