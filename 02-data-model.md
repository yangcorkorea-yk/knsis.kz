# 00 · Tech stack

> **Principle:** boring, fast, runnable by one mid-level full-stack engineer with Claude Code.

## Frontend

| Package | Version | Why |
|---|---|---|
| `next` | `14.2.x` (App Router) | SSR + edge + image optim out of the box |
| `react` | `18.3.x` | Stable, well-supported by shadcn |
| `typescript` | `5.4.x` (`strict: true`) | Type safety is non-negotiable |
| `tailwindcss` | `3.4.x` | Design-token-driven styling |
| `shadcn/ui` | latest | Composable, owned components |
| `next-intl` | `3.x` | Server-side i18n with `/[locale]` routing |
| `@tanstack/react-query` | `5.x` | Client-side data + caching |
| `react-hook-form` + `zod` | `7.x` / `3.x` | Form state + validation |
| `next-pwa` | latest | Installable PWA |
| Pretendard Variable | static | Single font for Latin · Cyrillic · Hangul |

## Backend

| Package | Version | Why |
|---|---|---|
| Next.js Route Handlers | bundled | One runtime, edge-capable |
| `prisma` | `5.x` | Schema + types + migrations |
| PostgreSQL | `16` (Supabase) | Battery-included managed Postgres in EU |
| Supabase Storage | — | Private buckets + presigned URLs |
| Supabase Realtime | — | In-app chat between user and manager |
| `inngest` | latest | Durable queues + cron for automation workers |
| `better-auth` | latest | Phone OTP auth, cookie sessions |
| `resend` | latest | Transactional email |

## Messaging integrations

- **WhatsApp Cloud API (Meta)** — primary outbound for managers; pre-approved templates required outside the 24-h customer reply window.
- **Telegram Bot API** — secondary channel, faster to ship (no template approval).
- **Mobizon SMS** — fallback + OTP delivery for KZ phones.
- One abstraction: `lib/messaging/MessageProvider.ts`. Per-template channel routing.
- Webhook ingestion on dedicated edge routes, signature verification mandatory.

## Infra & ops

- **Vercel** — web + serverless functions, preview deploys per PR.
- **Supabase EU (Stockholm)** — data residency default. Confirm with legal before launch.
- **Cloudflare** — DNS + bot mitigation. Turnstile for unauth forms.
- **Sentry** — FE + BE errors, release tagging, source maps uploaded in CI.
- **PostHog** — product analytics, funnels, session replay (PII masked).
- **GitHub Actions** — CI: lint, typecheck, unit, integration, e2e, visual regression, Lighthouse budget.

## Testing

- **Vitest** — unit tests for utilities, RBAC, plural rules, template renderer.
- **Integration tests** — API route handlers behind real Postgres via testcontainers.
- **Playwright** — 5 critical e2e journeys, run on every PR.
- **Visual regression** — Chromatic-style screenshot diffs across 390 / 768 / 1280 px on all 28 designed screens.

## What we are not using (and why)

- **No tRPC.** Public marketing surfaces need plain REST for caching and SEO crawlers.
- **No Drizzle / Kysely.** Prisma is fine here, the perf delta doesn't matter at our scale.
- **No Redux / Zustand at the app level.** TanStack Query + URL state + React state are enough.
- **No CMS.** Treatments and clinics live in DB as JSON-with-locale columns. We will not regret this at 100 clinics.
- **No native apps.** PWA only in v1. Schema designed forward-compatible for an Expo wrapper later.
