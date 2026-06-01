# M4-02 in-app chat — transport decision

**Date:** M5-03 closure · M4 batch prep
**Decided by:** PM
**Status:** Sign-off ratified — option A adopted

## Decision

MVP ships chat as **server-broker + polling**, not Supabase
Realtime / Postgres Changes / row-RLS.

Customer-side reads call an authenticated polling endpoint on a
dynamic interval; writes POST to a single server endpoint. No
client-side Supabase connection. Read receipts ride the polling
GET response. Typing indicators are polling-based approximations
with ~3 s lag.

The seam is **forward-compatible with a future Realtime broker
migration**: the same `POST /api/leads/[id]/messages` endpoint
remains the write path; only the read path swaps polling → WS
subscribe. No client refactor outside the read layer.

## Why A over B (Realtime broker + scoped JWT)

| Concern                | A (polling)                                                             | B (broker + JWT)                                                                            |
| ---------------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| New trust boundary     | None — extends signed cookie                                            | New `SUPABASE_JWT_SECRET`, scoped JWT issuer, Supabase Auth policy surface                  |
| Cross-lead isolation   | Server endpoint re-verifies cookie → `lead.userId` on every call        | RLS policy on `realtime.messages` topic by topic name; harder to test                       |
| Real-time UX           | ~2 s latency on active session, 30 s in background                      | Sub-second                                                                                  |
| MVP fit                | Consult chat is async — manager responds in business hours, not seconds | Over-engineered for the actual usage shape                                                  |
| Implementation surface | 2 endpoints (GET + POST) + polling hook                                 | RLS rules + JWT issuer + Realtime SDK on client + Supabase setup + RLS verification harness |
| Failure modes          | Polling loop CPU / Vercel function invocations                          | RLS policy errors silent until exploited; JWT TTL handling                                  |
| Rollback               | Server-side only — single `git revert`                                  | Touches Supabase config + env vars + RLS                                                    |

The chat surface in this product is **manager ↔ customer async
consultation**, not a real-time team workspace. Sub-second message
delivery isn't a feature — predictable, secure, no-new-trust-
boundary delivery is.

## What ships in PR-B (M4-02)

### Endpoints

```
POST /api/leads/[id]/messages
  body: { body: string, idempotencyKey?: string }
  auth: signed guest cookie matching lead.userId
        OR staff session (manager-side from /admin drawer)
  write: Message row { leadId, channel: "inapp",
                      direction: "out"|"in" inferred from auth role,
                      body, status: "delivered" }
  email mirror: if recipient.notifChannels.email = true, send via
                lib/messaging/send.ts channel=email (M4-03 wire)

GET /api/leads/[id]/messages?since={iso8601}&seen={iso8601}
  body: { messages: [], lastReadAt: iso, otherTyping: bool }
  auth: same cookie / staff-session split
  read:  Message rows since `since` (server enforces lead-owner
         match), updates Message.status='read' for delivered rows
         older than `seen` belonging to the OTHER party
  typing: `otherTyping` derived from a server-side ephemeral
         heartbeat (next bullet)

POST /api/leads/[id]/typing
  body: {} — heartbeat
  effect: in-memory TTL map (`<leadId>:<role>` → expires_at = now+4s)
  auth: same
```

### Read receipts

No `readAt` column on `Message`. Reads ride the existing
`MessageStatus.read` enum. Polling GET response includes
`lastReadAt` for the OTHER party so the local renderer can mark
its own sent messages as "read".

### Typing indicator

Polling-based approximation. Acceptable ~3 s lag — PR-B's body
must state this explicitly so PM doesn't expect Discord-grade
typing. Heartbeat = best-effort, no persistence; restart of the
serverless function loses state and that's fine (it just means
the other side briefly sees no typing dot — recovers on next
poll).

### Polling cadence

Dynamic interval based on tab visibility + recent activity:

| State          | Interval | Trigger                                    |
| -------------- | -------- | ------------------------------------------ |
| **active**     | 2 s      | Tab focused AND last user input < 10 s ago |
| **idle**       | 10 s     | Tab focused AND last user input ≥ 10 s ago |
| **background** | 30 s     | `document.hidden === true`                 |

`visibilitychange` event flips between background ↔ focused state.
On visibilitychange-to-visible, fire an immediate poll (not waiting
for the interval) so the user doesn't see stale state for up to 30 s.

### Forward-compat invariant

**Write path is final.** `POST /api/leads/[id]/messages` is the
single entry point now and stays the single entry point after a
future broker migration. The broker variant adds fan-out
(broadcast on a topic) AFTER the row insert; the API contract
doesn't change.

**Read path is the only thing that swaps.** Client component
imports a hook:

```ts
// Today (PR-B):
const { messages, otherTyping, lastReadAt } = useLeadMessages(leadId, { transport: "polling" });

// Future (B migration):
useLeadMessages(leadId, { transport: "realtime" });
// — same return shape; internal subscribe vs poll
```

So the migration is one hook implementation change + new env
config; UI components are untouched.

## When to migrate A → B

Migrate when **any** of the following holds for ≥ 7 consecutive
days:

1. **Active chat sessions** per day ≥ 200 (sustained, not single-
   day spike).
2. **Vercel function invocations** from `/api/leads/*/messages`
   exceed 50 % of the team's plan budget.
3. **PM operational report** of perceived chat lag — i.e. a
   customer-facing UX complaint, not the developer's perception of
   "could be faster."

Of the three: (1) is the canonical signal (real load), (2) is the
billing-pressure signal, (3) is the UX signal. Below all thresholds:
polling wins on simplicity.

## What changes when A → B is triggered

Surface to be modified (estimated; verify at trigger time):

1. **Client read path** (`useLeadMessages` hook).
   Polling → `supabase.channel("lead:<id>").on("broadcast", …)`
   subscribe. Same return shape — components untouched.
2. **Env**: add `SUPABASE_JWT_SECRET` (HMAC for scoped JWT
   signing) + decide TTL (initial proposal: 5 min).
3. **New endpoint** `POST /api/realtime/token` — verifies cookie →
   issues short-lived JWT scoped to `lead:<id>` topic. Mirrors the
   existing `/api/auth/signin` pattern.
4. **Supabase RLS** policy on `realtime.messages` table: topic name
   must match `lead:<uuid>` and the JWT's `lead_id` claim must
   match the topic suffix. Verify with a deny-by-default integration
   test.
5. **POST broadcast**: after `Message` row insert, broker variant
   calls `supabase.realtime.channel(topic).send(payload)`. The
   payload is the same row shape — no schema change.
6. **Polling endpoint**: kept as fallback for tabs without WS
   support, or deleted if telemetry shows no fallback hits in
   30 days post-migration.

Total estimated touch: ~400 LOC across 5 files + 1 RLS migration.
Not a re-architecture.

## Hard rule check

- **§8 channel enum locked to inapp/email writes**: ✓ — chat
  writes only `channel: "inapp"`. Email fan-out (M4-03 wire,
  reused by chat) writes `channel: "email"` separately.
- **§9 M-POST tables**: ✓ — `Template`, `AutomationRule`,
  `PushSubscription`, `OtpAttempt` untouched. No new tables.
- **§3 PII**: ✓ — `Message.body` is consult content (already
  treated as sensitive in MVP encrypt-at-rest scope); no new PII
  surface introduced.
- **§5 audit log**: ✗ — chat messages are NOT audit-logged. They
  are the consult itself, not admin mutations. The admin **drawer**
  chat-tab UI (PR-B) reads the same Message rows but doesn't
  create AuditLog entries for user messages — that would inflate
  the activity feed.
- **§6 i18n**: ✓ — chat UI labels live under `me.chat.*` (customer
  side) + `admin.leads.drawer.chat.*` (manager side).

## Cross-refs

- `docs/decisions/m4-pr-strategy.md` — split rationale + ship order
- `lib/messaging/send.ts` — channel enum guard
- `prisma/schema.prisma` — `Message` model
- M3 PM-alert pattern (`app/api/leads/route.ts`) — Resend +
  `waitUntil` precedent for transactional email
