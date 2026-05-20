# CLAUDE.md — knsis.kz

You are the engineering implementer for **knsis.kz**, a Kazakhstan-facing K-Beauty consultation platform. Read this file first. It tells you the rules, where the spec lives, and how to work.

## 1. What you're building

A **responsive web app** (mobile-first PWA) that connects Kazakhstan customers with verified K-Beauty clinics in Korea and certified local partners. End users browse curated treatments, request a free consultation, and are handed off to a human manager via WhatsApp or Telegram. Managers convert leads, coordinate Korea-visit logistics, and follow up with aftercare.

**Three first-class languages:** Kazakh (default) · Russian · Korean.
**Three first-class surfaces:** mobile public app, authenticated mobile app, desktop admin.

## 2. Hard rules — never break these

1. **No prices.** No price field anywhere in the schema, UI, templates, or content. A CI lint step greps for `price|стоимость|цена|가격|баға|құн` in source and PR-fails on a non-whitelisted hit. Quotes are delivered 1-on-1 by a licensed manager via WhatsApp/Telegram only.
2. **No medical claims in UI copy.** All treatment pages carry the disclaimer.
3. **PII is encrypted at rest.** Phone, email, photos. Photos live in a private bucket served by 5-min signed URLs.
4. **Consent is captured and timestamped.** ToS consent is required; marketing + photo-publishing consents are optional. Schema-level boolean + `consentedAt` column.
5. **Audit log every admin mutation** with actor, before, after.
6. **i18n catalogs are source-of-truth** for static copy. No hardcoded strings in components past M1.
7. **No native apps in v1.** Ship a PWA.

## 3. Repo layout

```
knsis/
├─ app/                         # Next.js App Router
│  ├─ (marketing)/[locale]/     # public web (mobile-first)
│  ├─ (auth)/[locale]/          # login flow
│  ├─ (app)/[locale]/           # authenticated mobile UI
│  └─ admin/[locale]/           # desktop admin
├─ components/                  # shared UI (shadcn-based)
├─ lib/
│  ├─ auth/                     # session, rbac
│  ├─ db/                       # prisma client
│  ├─ i18n/                     # next-intl helpers
│  └─ messaging/                # whatsapp.ts, telegram.ts, sms.ts
├─ prisma/                      # schema + migrations + seeds
├─ inngest/                     # queue handlers (notifications, automation)
├─ messages/                    # i18n catalogs (kz.json, ru.json, kr.json)
├─ tests/                       # vitest + playwright
└─ docs/                        # ops runbooks
```

## 4. Stack

- **Frontend:** Next.js 14 App Router, TypeScript strict, Tailwind, shadcn/ui, next-intl, TanStack Query, React Hook Form + Zod, Pretendard Variable, next-pwa.
- **Backend:** Next.js Route Handlers, PostgreSQL 16 (Supabase, EU region), Prisma ORM, Supabase Storage, Supabase Realtime (chat), Inngest (queues + cron), Better-Auth (phone OTP), Resend (email).
- **Messaging:** WhatsApp Cloud API (Meta) · Telegram Bot API · Mobizon SMS (KZ).
- **Infra:** Vercel · Cloudflare DNS · Sentry · PostHog · GitHub Actions · Playwright · Vitest.

See `docs/00-stack.md` for full rationale.

## 5. Where the spec lives

| File | Purpose |
|---|---|
| `docs/00-stack.md` | Stack choices + rationale |
| `docs/01-responsive.md` | Breakpoints + per-surface strategy |
| `docs/02-data-model.md` | Entities + relationships (Prisma source-of-truth: `prisma/schema.prisma`) |
| `docs/03-api.md` | REST surface + auth + rate-limiting rules |
| `docs/04-i18n.md` | Locale strategy + translation workflow |
| `docs/05-permissions.md` | RBAC matrix → `lib/auth/rbac.ts` |
| `docs/06-nfr.md` | Performance, a11y, security, observability budgets |
| `docs/07-screens.md` | All 28 designed screens + acceptance criteria |
| `docs/08-design-tokens.md` | Colors, spacing, type, components → Tailwind theme |
| `wbs/M0-foundation.md` ... `wbs/M7-launch.md` | Phase task sheets — execute in order |

The visual prototype lives in **`/K-Beauty Сana MVP.html`** at the project root. Open it to see all 28 screens, three languages (toggle via the Tweaks panel), and the live interactive flow. **Treat the prototype as the canonical reference for layout, copy, and interaction.** When in doubt, re-read the prototype JSX (`screens-*.jsx`, `screen-admin*.jsx`).

## 6. Working style

- **Phase by phase.** Don't start M2 until M0+M1 ship a deployable preview.
- **Vertical slice always.** A "lead create" change touches schema, API, FE form, admin inbox — ship all four in one PR.
- **Type-safe end to end.** Zod schemas for forms and DTOs; Prisma types for DB; shared types in `lib/types`.
- **Server components by default.** Use client components only when you need state or browser APIs.
- **No premature abstractions.** Inline first, extract on the third repetition.
- **Conventional commits.** `feat:`, `fix:`, `chore:`, etc.
- **One PR per WBS task.** Title with the task ID, e.g. `M2-03: treatment detail page`.

## 7. Definition of Done (per task)

A task is done when **all** of:

- [ ] Code compiles, `pnpm typecheck` is green.
- [ ] `pnpm lint` is green.
- [ ] Unit/integration tests cover the new logic (no test for trivial layout work).
- [ ] Manual a11y check: tab order, focus visible, contrast.
- [ ] Renders correctly at 390 / 768 / 1280 px.
- [ ] Three languages render without overflow (KZ tends to be longest).
- [ ] PR description references the WBS ID and screenshots before/after.
- [ ] No console errors, no Sentry leaks.

## 8. Definition of Done (per phase)

A phase ships when its `wbs/Mx-*.md` checklist is fully ticked AND the phase's "Deliverable" line passes a manual end-to-end test on a clean preview URL.

## 9. Open questions

See `docs/99-open-questions.md`. Do NOT make these decisions yourself — ping the PM.

## 10. Quick start

```bash
# 1. Bootstrap
pnpm install
cp .env.example .env.local

# 2. Database
pnpm db:migrate
pnpm db:seed

# 3. Run
pnpm dev   # → http://localhost:3000/kz
```

Now read `wbs/M0-foundation.md` and start.
