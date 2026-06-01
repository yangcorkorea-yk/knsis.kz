-- M4-pre: per-user notification-channel preferences.
--
-- Added in PR-A (M4-batch-a) to back the Settings page (M4-05)
-- toggles and to gate the chat-event email mirror in PR-B (M4-02
-- chat). Shape: { inapp: boolean, email: boolean }. Keys must
-- match lib/messaging/send.ts MVP_CHANNELS — Json column so new
-- channels (wa / tg / sms in the M6 batch) extend without re-
-- migration.
--
-- Default `{"inapp": true, "email": true}` matches "opted into
-- everything we currently send" — existing User rows (guests +
-- staff seeded pre-M4) inherit this default and don't have to
-- visit Settings to receive transactional email.
--
-- Idempotent: re-apply against an already-migrated DB is a no-op
-- (column guarded with IF NOT EXISTS). Matches the pattern in
-- 20260528120000_add_lead_contact_channels.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'User' AND column_name = 'notifChannels'
  ) THEN
    ALTER TABLE "User"
      ADD COLUMN "notifChannels" JSONB
      NOT NULL
      DEFAULT '{"inapp": true, "email": true}'::jsonb;
  END IF;
END $$;
