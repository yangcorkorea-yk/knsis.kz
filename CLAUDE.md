# CLAUDE.md — knsis.kz

You are the engineering implementer for **knsis.kz**, a Kazakhstan-facing
K-Beauty consultation platform. Read this file first. The MVP source of
truth is `MVP Roadmap & WBS.html` at the repo root — open it before
starting any task.

## 1. Scope — MVP only

22 customer screens (18 designed + 4 placeholder count in spec hero; real
IA count = 18) + 7 admin screens, three languages (KZ default · RU · KR).
**Zero external messaging or auth integrations.** Customers submit consult
requests as guests (signed cookie) and talk to a manager through in-app
chat (Supabase Realtime). Staff sign in with email + password.

See `MVP Roadmap & WBS.html` §02 for the scope contract. Everything in
the OUT column is deferred to **M-POST** — do not implement it, do not
write to its database columns.

## 2. Hard rules — never break these

1. **No prices.** No price field anywhere — schema, UI, templates,
   content, copy. `pnpm price:check` greps for KZ/RU/KR/EN price terms
   and fails CI on a non-whitelisted hit. Quotes are delivered 1-on-1
   by a manager.
2. **No medical claims in UI copy.** Every treatment page carries the
   disclaimer.
3. **PII encrypted at rest.** Phone, email, photos. Photos in a private
   bucket served by 5-minute signed URLs.
4. **Consent captured and timestamped.** ToS required; marketing +
   photo-publishing optional. Schema-level boolean + `consentedAt`.
5. **Audit log every admin mutation** (actor, before, after).
6. **i18n catalogs are source of truth** for static copy past M1.
   `pnpm i18n:check` enforces key parity across KZ/RU/KR.
7. **PWA only.** No native apps in MVP.
8. **Channel enum: write only `inapp` / `email`.** `wa`, `tg`, `sms`
   values stay in the enum for forward-compat but are guarded against
   writes via `lib/messaging/send.ts`. Real adapters arrive in M-POST.
9. **`Template`, `AutomationRule`, `PushSubscription`, `OtpAttempt`
   are not in the MVP migration.** They land in a single additive
   migration when M-POST begins.

## 3. Source of truth

| File                       | Purpose                                                                  |
| -------------------------- | ------------------------------------------------------------------------ |
| `MVP Roadmap & WBS.html`   | Master spec — read end-to-end before any task                            |
| `K-Beauty Сana MVP.html`   | Interactive prototype (22 screens, 3 locales)                            |
| `docs/prototype/*.jsx`     | Prototype React source — visual + UX reference                           |
| `docs/prototype/theme.jsx` | Color / typography source for the design tokens (M0-04)                  |
| `docs/prototype/i18n.jsx`  | Seed strings for KZ/RU/KR catalogs                                       |
| `prisma/schema.prisma`     | Data model (lands in M0-03)                                              |
| `messages/{kz,ru,kr}.json` | i18n catalogs                                                            |
| `_archive/v1-handoff/`     | Older full-scope handoff — **do not follow**; MVP wins on every conflict |

## 4. Stack (MVP)

Next.js 14 App Router · TypeScript strict · Tailwind · shadcn/ui · next-intl ·
TanStack Query · React Hook Form + Zod · Pretendard Variable (self-host) ·
next-pwa.

PostgreSQL 16 on Supabase (EU, Stockholm) · Prisma · Supabase Storage ·
Supabase Realtime (chat) · Better-Auth (email+password, staff only) ·
Resend (transactional email only).

Vercel · Cloudflare DNS · Sentry · PostHog · GitHub Actions · Playwright ·
Vitest.

Deferred to M-POST (do not add deps): Inngest, Twilio/Mobizon, WhatsApp
Cloud API, Telegram Bot API, OTP providers, web push (VAPID).

## 5. Repo layout

```
knsis.kz/
├─ app/                    # Next.js App Router
│  ├─ (marketing)/[locale]/   # public web (mobile-first)
│  ├─ (app)/[locale]/         # guest + returning customer
│  └─ admin/[locale]/         # desktop admin (staff)
├─ components/             # shared UI (shadcn variants)
├─ lib/
│  ├─ auth/               # session, RBAC
│  ├─ db/                 # prisma client
│  ├─ i18n/               # next-intl helpers
│  └─ messaging/          # send.ts (inapp/email today, stubs for M-POST)
├─ prisma/                # schema + migrations + seeds
├─ messages/              # i18n catalogs (kz.json, ru.json, kr.json)
├─ scripts/               # price/i18n CI guards, seed helpers
├─ tests/                 # vitest + playwright
├─ docs/                  # runbooks, prototype reference
└─ _archive/              # v1 handoff (read-only)
```

## 6. Working style

- **Milestone-by-milestone PRs.** One PR per milestone (M0..M6), commits
  separated per WBS task ID. If a milestone is too big (M5 has 8 tasks),
  split into sub-PRs all branched off `main`.
- **Conventional commits with WBS ID.** `feat(M2-03): treatment detail page`.
- **Vertical slice always.** A lead-create change touches schema, API,
  FE form, admin inbox — ship all four together.
- **Type-safe end to end.** Zod schemas for forms and DTOs; Prisma types
  for DB; shared types in `lib/types`.
- **Server components by default.** Client components only when state or
  browser APIs are required.
- **No premature abstractions.** Inline first, extract on the third
  repetition.
- **When in doubt, ask.** Especially on §14 open questions
  (Supabase region, staff sign-in, email provider, photo retention).

## 7. Definition of Done (per task)

- [ ] `pnpm typecheck` green
- [ ] `pnpm lint` green
- [ ] `pnpm price:check` green
- [ ] `pnpm i18n:check` green
- [ ] Tests cover new logic (skip for trivial layout)
- [ ] Renders at 390 / 768 / 1280 px
- [ ] All three locales render without overflow (KZ is usually longest)
- [ ] No console errors, no Sentry leaks
- [ ] PR description references the WBS ID with before/after screenshots

## 8. Definition of Done (per milestone)

The phase's "Deliverable" line in §05 of `MVP Roadmap & WBS.html` passes
a manual end-to-end test on a clean preview URL, **and** every WBS row
for that milestone is committed with the task ID.

## 9. Quick start

```bash
pnpm install
cp .env.example .env.local
# (M0-03 onwards) pnpm db:migrate:dev && pnpm db:seed
pnpm dev    # → http://localhost:3000
```

## 10. Open questions

§14 of `MVP Roadmap & WBS.html`. Several are answered in this PR's
description (commit-1 of M0). When you hit a fresh decision that has
material impact (schema shape, dep choice, vendor pick), **ask first**.

Now read `MVP Roadmap & WBS.html` §06 for the current milestone's WBS
table and begin.
