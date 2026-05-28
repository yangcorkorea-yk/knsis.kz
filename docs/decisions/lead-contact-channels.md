# Decision: Lead form contact channels — Kazakhstan reality

**Date:** M3 sign-off (single-page form polish)
**Decided by:** PM
**Status:** Shipped in PR for M3-polish

## The problem

M3-01 originally shipped a phone-only contact step ("phone
required, name optional, no other channels"). PM preview matrix
surfaced a field-research correction: in Kazakhstan, the
dominant manager-to-user reach channels are **WhatsApp** and
**Telegram**, not phone calls. A phone-only form costs leads to
"I never answer numbers I don't know."

## What we shipped

Single-page consult form (replacing the 3-step multi-step shape)
with five contact fields:

| Field                      | Required | Notes                                               |
| -------------------------- | -------- | --------------------------------------------------- |
| Name                       | ✅       | Was optional; promoted to required at this sign-off |
| Phone                      | ✅       | E.164-normalised; fallback channel                  |
| WhatsApp ID                | optional | Help copy strongly encourages                       |
| Telegram ID                | optional | Help copy strongly encourages                       |
| Preferred consult language | ✅       | Lead-scoped enum (kz / ru / kr)                     |

Plus a recommendation note rendered between Telegram and the
language dropdown:

> "WhatsApp 또는 Telegram 중 하나라도 적어주시면 매니저 응답이
> 더 빠릅니다." (KR · KZ · RU mirrors)

Both WA/TG identifiers are **informational only**. The manager
opens the chat manually outside the platform. Hard rule §8
still locks Channel enum writes to `inapp` / `email` — the new
columns don't open a new outbound-write path.

## Hard rule reconciliation

CLAUDE.md §2 rule 8 reads:

> "Channel enum: write only `inapp` / `email`. `wa`, `tg`, `sms`
> values stay in the enum for forward-compat but are guarded
> against writes via `lib/messaging/send.ts`. Real adapters
> arrive in M-POST."

The new `Lead.whatsappId` / `Lead.telegramId` columns are
data-only — they store the identifier the user provided. They
are **never** read by `lib/messaging/send.ts`; the only
consumers are:

1. `lib/notifications/lead-created.ts` — surfaces them at the
   top of the PM alert email so the PM clicks-to-chat.
2. M5 admin inbox (future) — surfaces them as clickable
   `https://wa.me/<id>` / `https://t.me/<id>` links.

No automated outbound. No `Channel.wa` write. The rule is intact.

## Schema migration

`prisma/migrations/20260528120000_add_lead_contact_channels/migration.sql`

Adds three nullable columns to `Lead`:

```sql
ALTER TABLE "Lead" ADD COLUMN "whatsappId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "telegramId" TEXT;
ALTER TABLE "Lead" ADD COLUMN "preferredLanguage" "Locale";
```

Idempotent (all guarded with `IF NOT EXISTS`). No data
backfill — existing rows from earlier deploys (if any) get
NULL for the new columns.

## Form shape change (3-step → single-page)

Same sign-off introduced the form-structure change. Rationale
captured here so future implementers see both decisions
together:

- The Kazakhstan-market reference UI PM held against is
  single-page scroll, not multi-step.
- Multi-step adds Next/Back clicks on mobile that cost
  conversion. Single-page lets the user scan + scroll + submit.
- Section headings (Contact / Goal / Extras) preserve the
  mental grouping the steps used to provide.
- sessionStorage resumability still works (the form mirrors
  all fields on change, not per-step).
- Zod `mode: "onTouched"` keeps untouched fields error-quiet,
  so the page doesn't surface red on first render.

## PM email body change

`lib/notifications/lead-created.ts` `formatLeadCreatedEmail`
now opens with a "REACH NOW" block (=== delimiters, indented

> > markers) listing WhatsApp / Telegram above the metadata.
> > The PM doesn't have to scroll past Phone / Name / Treatments
> > to start a chat. Phone stays in the metadata block as a
> > fallback channel.

When neither WA nor TG is provided, the REACH NOW block
falls back to:

```
=== REACH NOW ===
  (no WhatsApp / Telegram — call +77012345678)
=================
```

so the PM is signalled to use phone instead.

## When to revisit

Move beyond "informational columns" if:

1. Manager workflow data shows manual WhatsApp / Telegram
   reach is the consistent first-touch path (likely — that's
   the hypothesis driving this decision).
2. A real WhatsApp Cloud API / Telegram Bot API integration
   ships in M-POST.

At that point the iteration path is:

- Enable `Channel.wa` / `Channel.tg` writes via `lib/messaging/send.ts`
- Wire the M-POST adapters
- The `whatsappId` / `telegramId` columns become the routing
  targets — no schema change needed

## Hard rules satisfied

- ✅ No price field added (schema, copy, email)
- ✅ Channel enum writes still locked to `inapp` / `email`
- ✅ PII (WA/TG ids) lives in Lead columns under Supabase
  disk encryption; same handling as phone
- ✅ Consent timestamped on submit
- ✅ i18n source of truth (no hard-coded copy in components)
- ✅ Idempotency-Key path unchanged
