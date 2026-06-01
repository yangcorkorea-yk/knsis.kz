# M4 PR strategy — 3+1 split

**Date:** M5-03 closure · M4 batch prep
**Decided by:** PM
**Status:** Sign-off ratified

## Decision

M4 (Korea Visit · in-app chat · notifications inbox · settings)
ships as **two PRs in sequence**, not one merge-everything bundle
and not four separate PRs.

```
PR-A  claude/m4-batch-a   M4-01  Korea Visit
                          M4-03  Notifications inbox + transactional email
                          M4-05  Settings (language + notif toggles + data DL/delete)
                          + User.notifChannels schema additive migration
                          + lib/messaging/send.ts email adapter

PR-B  claude/m4-batch-b   M4-02  In-app chat (Realtime — see m4-chat-transport-mvp.md)
                          — starts AFTER PR-A merge
```

M4-04 (web push + VAPID) carved to M-POST per `MVP Roadmap & WBS.html` §02.

## Why this split

### PR-A bundle is internally coherent

KV / notif / settings are all **CRUD + transactional email** on
top of existing schema. They share two things the chat vertical
doesn't:

1. **No new trust boundary.** Forms post to API routes that read
   the existing signed guest cookie + the existing staff session
   cookie. Same primitives as M3 / M5.
2. **No new infrastructure dep.** Resend is already in `package.json`
   (M3-03 PM-alert), so transactional email is just a seam wired
   under `lib/messaging/send.ts` — not a vendor add.

Bundling them keeps the cross-PR coupling tight:

```
User.notifChannels  (PR-A migration)
   ↑ write              ↑ read (deferred to PR-B)
Settings page       →  Chat event fan-out
   "inapp + email"      "should email also fire?"
```

If KV / notif / settings shipped as three independent PRs, the
migration and the channel-toggle UI would either be duplicated or
arrive out-of-order with the events that need them.

### PR-B isolated by risk

Chat is the **only M4 vertical that touches Realtime / polling
infrastructure + a transport-auth decision** (see
`m4-chat-transport-mvp.md`). It carries genuinely new risk:

- Polling loop on customer side (CPU + Vercel function budget)
- Cross-lead read-isolation enforcement (every endpoint must
  re-verify the cookie → lead owner)
- Forward-compat shape so the future Supabase Realtime broker
  migration is mechanical
- New visual surface that's hard to mock: typing indicator UX,
  read-receipt latency, mobile keyboard reflow

Bundling chat into PR-A would let chat regressions hold back the
KV / settings / email shipment — which directly affects the soft-
launch readiness gate (`50 invited × 7 days`).

### Ship order ⇒ soft-launch readiness

- **PR-A merge** unlocks soft-launch readiness without chat — KV
  is the cross-sell entry point, notif inbox surfaces lead-status
  updates, settings exposes language + notif preferences.
  Customers can transact end-to-end with manager-managed contact
  via existing tel/WhatsApp/Telegram universal links.
- **PR-B merge** brings the in-app chat affordance live. Until
  then the M3 `consult/done` page's "추가 문의는 인앱 채팅을
  이용해주세요" copy reads as forward-promise; PR-B closes that loop.

## Cross-PR coupling — interface

The two PRs share **one schema column and one i18n surface**:

```ts
// added in PR-A migration:
model User {
  // …existing fields
  /// Channels the user accepts notifications on. Each entry must be
  /// in lib/messaging/send.ts MVP_CHANNELS (currently inapp + email).
  /// Schema-level Json so future channels (wa/tg/sms in M6 batch)
  /// extend without re-migration.
  notifChannels Json @default("{\"inapp\": true, \"email\": true}")
}
```

- **PR-A writes** this column from the Settings page.
- **PR-B reads** this column when a new chat message lands — if
  the recipient has `inapp` off, the in-page rendering still
  happens (they can poll), but the email mirror is suppressed if
  `email` is off. Chat-event email is identical wire shape to
  M4-03 notif-event email so the decision is a `notifChannels.email`
  check, not a new dispatcher.

### Channel enum scope this batch

`Channel` enum stays at MVP scope: `inapp · email` for writes.
The `wa · tg · sms` values remain reserved (CLAUDE.md §8 — the
`lib/messaging/send.ts` `assertMvpChannel` guard already enforces).

The schema ALTER to add new Channel values (e.g. push) lands in
M6 batch when adapters arrive.

## Branch + commit conventions

Both branches:

- Conventional commits with WBS IDs (`feat(M4-01)`, `feat(M4-03)`,
  `feat(M4-05)`).
- Every commit gate-green: `pnpm typecheck / lint / vitest /
price:check / i18n:check / build`.
- Decision docs (this file + `m4-chat-transport-mvp.md`) land in
  the first commit of PR-A so they're on `main` before any
  product code references them.

## Cross-refs

- `docs/decisions/m4-chat-transport-mvp.md` — chat transport
  decision (polling adapter for MVP, Realtime broker migration
  triggers + path).
- `docs/decisions/milestone-sequencing.md` — original Option C
  sequencing (M3 → M5-01+03 → **M4** → M5-rest → M6 → M7) this
  batch satisfies.
