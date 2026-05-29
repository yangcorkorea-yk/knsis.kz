# Decision: Milestone sequencing — M5 hybrid batching (Option C)

**Date:** M3 close · M4 vs M5 sign-off
**Decided by:** PM
**Status:** Accepted — execution path locked

## The question

After M3 vertical merged (PR #13, commit `8e2a34e`),
sequencing for M4 / M5 / M6 needed a sign-off. Spec critical
path (`MVP Roadmap & WBS.html` §02) reads:

> Critical path: M0 → M1 → M2 → M3 → M5 → M6

But the WBS numerical order is M3 → M4 → M5 → M6. The
implementer initially proposed M4 next (numerical). The
cross-review (Claude chat) caught the spec-vs-numerical
mismatch + a downstream operational gap: M4-02 in-app chat
would have no admin counterpart to reply on until M5 shipped,
and the M3-generated PM alert email already links to an
admin URL (`/admin/{locale}/leads/{code}`) that 404s until
M5 admin lands.

## The three options that were on the table

| Option                   | Order                                               | Pro                                                                                                                           | Con                                                                                                                                  |
| ------------------------ | --------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **A** Numerical          | M3 → M4 → M5 → M6                                   | Implementer's first read; KV ships fast                                                                                       | Violates spec critical path; 2-3 weeks where the PM works leads from email-only with no inbox; chat ships before any admin can reply |
| **B** Pure critical path | M3 → M5 (full) → M4 → M6                            | Spec consistent; lead → manager loop closes immediately                                                                       | KV form delayed 2-4 weeks; though consult form's `kind=korea` already captures intent                                                |
| **C** Hybrid             | M3 → M5-01+M5-03 → M4 → M5-02/04/05/06/07 → M6 → M7 | Manager workbench unblocked + KV ships not-too-late + admin context-swap cost is small under the spec-re-read session pattern | M5 split into two batches                                                                                                            |

## What was chosen — Option C

Order: **M3 (done) → M5-01 + M5-03 → M4 → M5-02/04/05/06/07
→ M6 → M7.**

### PM reasoning (verbatim sign-off)

1. **Soft launch gate is 50 invited × 7 days.** Manager
   actual load is comfortably absorbed by M5-01 (admin shell
   - auth) + M5-03 (leads list + drawer + assignment +
     status) alone.
2. **The rest of M5 has near-zero soft-launch value:**
   - M5-02 (dashboard) — < 50 leads is statistically
     meaningless sample
   - M5-04 (customers segments) — volume-dependent
   - M5-06 (review moderation) — post-launch traffic
     dependent
   - M5-07 (managers + permissions) — PM is the only
     manager
3. **KV (M4-01) is one of four primary customer journeys.**
   The consult form's `kind=korea` multi-select captures the
   intent, but a polished dedicated KV form is a distinct
   experience; locking it behind a full M5 is a real
   conversion cost.
4. **The "M5 two-batch context-swap" worry is overblown.**
   The implementer re-reads the spec at the top of every
   session anyway; resuming M5-02 / M5-04 / etc. later isn't
   meaningfully more expensive than building them inside one
   batch.

### Hard rule re-confirmation for the M4 batch

Per CLAUDE.md §2 rule 8 + the spec M-POST carve:

- M4-01 (KV form) — pure FE + DB. No new channels.
- M4-02 (in-app chat) — Supabase Realtime + Message rows,
  `channel = inapp`. Hard rule satisfied.
- M4-03 (notification inbox) — in-app rows, `channel = inapp`.
- M4-04 (transactional email) — Resend, **`channel = email`**.
  Spec WBS confirms scope:
  "Lead receipt (customer) + lead-received (manager) +
  chat-reply-while-offline; one template × 3 locales."
  Hard rule satisfied. **Not push / not VAPID — that stays
  M-POST.**

### Explicitly stays M-POST

WhatsApp Cloud API / Telegram Bot API / Mobizon SMS adapters,
VAPID web push subscriptions, Inngest, `Template` model,
`AutomationRule` model. `lib/messaging/send.ts` continues to
reject `Channel.wa` / `tg` / `sms` writes.

## What lands in the M5-01 + M5-03 batch (next vertical)

Captured here so the next branch (`claude/m5-admin-leads`)
ships in a coherent slice:

- **M5-01 admin shell** — `/admin/{locale}` layout, Better-Auth
  email + password staff sign-in (already vertical-sliced in
  `lib/auth/staff-*`), role gate (`require-role`), top nav,
  sign-out, audit-log seam (every mutation captures actor +
  before + after per hard rule §5).
- **M5-03 leads list + drawer** —
  - List: table with status pills (new / contacted /
    in_progress / scheduled / done / on_hold), URL-state
    filters (status / locale / kind / region / has-photo),
    `?q=` substring across `Lead.code` + `User.phone` +
    `User.name`, default sort `createdAt DESC`.
  - Drawer (slide-in on row click, not a separate route): all
    Lead fields surfaced including the WA/TG IDs as
    `https://wa.me/<id>` + `https://t.me/<id>` clickable
    links per the M3 decision doc, photo gallery (signed URL
    minted server-side via `lib/uploads/storage.ts`
    `signPhotoReadUrl`), status mutation pills (audit-logged),
    owner / clinic assignment dropdowns (audit-logged), notes
    composer (audit-logged), activity log.
  - Click-to-call on `User.phone` (`tel:` link).
- **Closes the M3 loop:** the email's admin URL
  (`/admin/{locale}/leads/{code}`) — currently 404 — starts
  resolving to a real drawer-prefilled view.

## What's deferred to M5 batch 2 (after M4)

- M5-02 dashboard (5 KPIs · funnel · 7-day bars · sources ·
  manager load · activity feed)
- M5-04 customers / segments
- M5-05 admin Korea-visit moderation (depends on M4-01 KV
  data layer)
- M5-06 review moderation
- M5-07 managers + permissions

## Reversibility

If soft-launch data shows the PM actually needs the dashboard
or review moderation earlier, M5 batch 2 promotes ahead of M4.
The hard rules + the audit-log seam from M5-01 don't change
under either order, so the M5 split is genuinely a sequence
choice, not an architecture choice.

## Hard rules satisfied at the sequencing layer

- ✅ No price field added by any of M5 / M4 (sequence change
  doesn't touch schema)
- ✅ Channel writes stay locked to `inapp` / `email`
- ✅ PII handling unchanged (admin views Lead via signed URLs,
  same as the planned M5 path)
- ✅ Audit log captures every admin mutation from M5-01
  forward (hard rule §5)
- ✅ M-POST carve preserved
