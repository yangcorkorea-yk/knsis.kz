# knsis.kz

K-Beauty consultation platform for Kazakhstan customers. Mobile-first PWA
in three languages (Kazakh default, Russian, Korean), plus a desktop admin
workbench.

The **MVP source of truth** is [`MVP Roadmap & WBS.html`](./MVP%20Roadmap%20%26%20WBS.html)
at the repo root. Engineers should also read [`CLAUDE.md`](./CLAUDE.md)
before contributing.

## Status

| Milestone               | Scope                                          | State       |
| ----------------------- | ---------------------------------------------- | ----------- |
| M0 · Foundation         | Repo, tokens, base components, i18n shell      | in progress |
| M1 · Sessions           | Guest cookies + staff email/password           | not started |
| M2 · Discovery          | Public site, 3 languages                       | not started |
| M3 · Lead capture       | Consult form + photo upload + admin inbox      | not started |
| M4 · KV · Chat · Inbox  | Realtime chat, in-app notifications, KV flow   | not started |
| M5 · Admin core         | Manager workbench (7 admin screens)            | not started |
| M6 · Hardening & launch | Perf, a11y, i18n QA, security, soft launch, GA | not started |

External channels (WhatsApp / Telegram / SMS / phone OTP / template editor /
automation rules) are deferred to **M-POST** and explicitly out of MVP
scope.

## Quick start

Requires Node ≥ 20 (see `.nvmrc`) and pnpm ≥ 9.

```bash
pnpm install
cp .env.example .env.local
pnpm dev          # → http://localhost:3000
```

Other commands:

```bash
pnpm typecheck    # tsc --noEmit
pnpm lint         # next lint
pnpm format       # prettier --write .
pnpm test         # vitest run
pnpm e2e          # playwright test
pnpm price:check  # CI guard — fail on any price term
pnpm i18n:check   # CI guard — fail on missing/unreviewed catalog keys
```

## Hard rules

1. No price field anywhere — UI, schema, copy, templates.
2. No medical claims in UI copy.
3. PII (phone, email, photos) encrypted at rest; photos served via
   5-minute signed URLs from a private bucket.
4. Audit log on every admin mutation.
5. PWA only. No native apps in MVP.
6. KZ is the default locale; RU + KR are mandatory; catalog parity
   enforced in CI.

See `CLAUDE.md` §2 for the full list.

## Repo layout

See `CLAUDE.md` §5.

## Archive

`_archive/v1-handoff/` holds the older full-scope handoff (OTP, WhatsApp,
Inngest, etc.) for historical reference and partial re-use in M-POST.
**MVP wins on every conflict** — do not follow archived docs.
