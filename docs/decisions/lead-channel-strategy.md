# Decision: Lead receiving channel strategy

**Date:** M3 build
**Decided by:** PM
**Status:** Accepted — M3 Iteration 1 shipped; Iteration 2/3 planned

## The question

Where do lead submissions actually go when M3 ships? Three
options were on the table before M3-03 started:

- **A.** Admin inbox only (lands in M5 admin UI) + Resend
  transactional alert to the PM's email so they don't have to
  poll the inbox.
- **B.** Admin inbox + auto-forward via Resend to the first
  partnered clinic's inbox.
- **C.** PM personally receives every lead on WhatsApp /
  Telegram and manually distributes.

## Why Option A

Two things made A the cleanest first cut:

1. **Hard rule compliance.** CLAUDE.md §2 rule 8 locks the
   Channel enum's writes to `inapp` and `email` only.
   WhatsApp / Telegram adapters are explicitly M-POST; an
   in-source attempt to wire either violates the constraint.
   Option C therefore reduces to "Resend email to the PM's
   personal mailbox," which is functionally Option A with a
   different `RESEND_NOTIFY_TO` value.
2. **Zero external coupling.** Option B requires a real
   clinic partnership: signed RACI, clinic inbox address,
   commitment that someone watches that inbox during business
   hours. M3 doesn't have to block on that conversation; the
   data model (`Lead.clinicId String?`) already supports
   per-lead routing for whenever Iteration 2 lands.

## Iteration roadmap

| Iteration     | Milestone                                   | Lead receiver                                   | Code change                                                                           |
| ------------- | ------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------- |
| **1** (today) | M3-03                                       | PM's email via `RESEND_NOTIFY_TO`               | `lib/notifications/lead-created.ts` + env var                                         |
| 2             | After clinic 1 onboarding (likely M4)       | PM + first clinic's inbox (CC)                  | Multi-recipient `to: [...]` in `sendLeadCreatedEmail`; optional `clinicId` routing    |
| 3             | After M5 admin shipped + 3+ partner clinics | Per-lead routing to the assigned clinic + PM CC | Lookup the clinic's notify email by `Lead.clinicId`; PM stays on CC for ops oversight |

The boundary that doesn't change across iterations:
`Lead.created` events flow through `lib/notifications/lead-created.ts`.
Iteration 2 + 3 swap the recipient logic inside that module
without touching the route handler or the form.

## What ships in Iteration 1 (M3-03)

- `RESEND_NOTIFY_TO` env var (filled in `.env.local`,
  documented in `.env.example`)
- `lib/notifications/lead-created.ts` — pure formatter
  (`formatLeadCreatedEmail`) + Resend wrapper
  (`sendLeadCreatedEmail`)
- Failure mode is non-fatal: if Resend rejects the send, the
  Lead row is already persisted. The PM still sees it in the
  M5 admin inbox when M5 ships; meanwhile, ops can grep the
  DB via Prisma Studio.

## What's NOT in Iteration 1

- No customer-facing email receipt to the user (M4-04 owns
  this — `Templates` model is M-POST).
- No SMS / WhatsApp / Telegram path (hard-rule violation;
  M-POST).
- No real-time push notification to a manager's phone (M-POST
  PushSubscription model).
- No routing logic per `Lead.clinicId` (model supports it,
  not used yet — Iteration 2).

## Why this isn't just "send the email from the route handler"

The notification path is wrapped in its own module so:

- The formatter can be vitest-tested in isolation
  (`lib/notifications/lead-created.test.ts` pins the
  subject + body shape; a copy regression here is what
  spam-folder filters latch onto).
- Iteration 2's multi-recipient logic + Iteration 3's
  per-clinic routing land in one file, not scattered across
  the route handler and the email body builder.
- The Resend wrapper returns `{ ok, error }` instead of
  throwing — the route can fire-and-forget without a try /
  catch around the whole submit.

## Reversibility

If Iteration 2/3 doesn't land or the partnership stalls:

- Stay on Iteration 1 indefinitely — there's no debt accruing.
- Switching `RESEND_NOTIFY_TO` is a one-line env-var change in
  Vercel (no code deploy needed).
