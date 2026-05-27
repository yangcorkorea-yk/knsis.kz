# Environment recovery checklist

A flat sequence of checks for any operator who returns to the
repository after a break, picks up a stale clone, or starts a
fresh laptop. Captures the traps that bit us in M2-04 / M2-06 +
the standing setup gotchas. Run **in order**; stop at the first
red flag.

## 1. Local checkout matches the branch you think you're on

```bash
git status
git log --oneline -3
```

Pass: HEAD matches what you expect for the branch (e.g. PR #N's
top commit). If a feature you "already shipped" looks missing,
you're likely on a stale branch or `main` instead of the feature
branch. M2-06 sign-off lost ~45 minutes to this — the operator
ran `pnpm db:seed` against the new schema migration on what they
thought was the M2-06 branch but was actually `main`, which had
no new migration to apply.

Fix: `git checkout <feature-branch> && git pull origin
<feature-branch>`.

## 2. node_modules + Prisma client match the schema

```bash
pnpm install
pnpm prisma generate
```

The Prisma client is generated from `prisma/schema.prisma` at
install / explicit generate time. If you switched branches across
a schema change (e.g. Review.body String → Json), the generated
client may still describe the old types and `pnpm typecheck`
catches it as a "type 'Json' not assignable to 'string'" error.

## 3. Migrations match the branch's data model

```bash
ls prisma/migrations/
pnpm db:migrate deploy
```

Pass: the directory contains every migration your branch's
schema requires AND `migrate deploy` reports either "Applied
N migration(s)" or "No pending migrations to apply." If the
listing is shorter than expected, you're on a stale branch — go
back to step 1. If `migrate deploy` errors, the DB is on a
divergent history; see the Prisma docs on baseline / reset.

## 4. Seed data matches the current loader contract

```bash
pnpm db:seed
```

Pass: the per-row diagnostic lines reflect what you expect.
After M2-09 + M2-06:

```
• Treatments… 0 created, 0 updated, 7 unchanged
• Clinics…    0 created, 0 updated, 6 unchanged
• Reviews + seed customers…
  · KB-RV-0001: filled body.ru, body.kr           ← appears on first run after the M2-06 migration
  ...
  reviews: 0 created, 6 updated (filled blanks), 0 unchanged
• Verification (sample row read-back)…
  Treatment "…" title:        {"kz":"…","ru":"…","kr":"…"}
  Clinic "…" name:            {"kz":"…","ru":"…","kr":"…"}
    location.cityI18n:        {"kz":"…","ru":"…","kr":"…"}
  Review "…" body:            {"kz":"…","ru":"…","kr":"…"}     ← M2-06 added this
```

If a verification line shows `"ru":null` or `"kr":null` for any
trilingual field, the fill-blanks merge didn't run — check that
you're on the feature branch (step 1) and the migration applied
(step 3), then re-run.

## 5. Vercel env vars match the branch's expectations

DATABASE_URL + DIRECT_URL need to point at the Supabase pooler
host the branch's prisma client expects. When Supabase rotates
the pooler hostname (rare, but it happened during M2 prep), the
old preview / production env vars resolve to a host that 404s
the connection. Symptoms: Vercel preview hangs on first server-
component fetch, deployment logs show
`getaddrinfo ENOTFOUND db.<old-id>.supabase.co`.

Fix path:

1. Open Vercel → Settings → Environment Variables.
2. Confirm DATABASE_URL + DIRECT_URL hostname matches the value
   in your local `.env.local` (operator's source of truth).
3. Set the same value on **Production**, **Preview**,
   **Development**. Vercel scopes env vars per environment —
   forgetting one is a silent fall-through to default empty.
4. Re-deploy: env-var changes don't auto-trigger a redeploy.
   Vercel → Deployments → ⋯ → Redeploy on the latest commit.

This step is operator-only — Claude Code has no Vercel access
and can't make this change for you.

## 6. Admin (`role=admin`) user still exists

Admin sessions are seeded out-of-band via `scripts/hash-password.mjs`
(the M0 PR baked this pattern; admin seeds are NOT in
`prisma/seed.ts` to keep secrets out of the repo). If the User
table got dropped or the row was accidentally deleted, sign-in
to the admin surface 401s.

Quick check via Supabase SQL editor:

```sql
SELECT id, email, role, "passwordHash" IS NOT NULL AS has_password
FROM "User"
WHERE role IN ('admin', 'head', 'manager', 'support')
ORDER BY role;
```

If the operator-admin row is missing, re-seed it:

```bash
node scripts/hash-password.mjs '<your-admin-password>'
# Copy the bcrypt hash output.
# In Supabase SQL editor:
INSERT INTO "User" (id, email, name, role, locale, "consentTos", "consentedAt", "passwordHash", "createdAt", "updatedAt")
VALUES (gen_random_uuid(), 'admin@example.com', 'Admin', 'admin', 'kz', true, NOW(), '<bcrypt-hash>', NOW(), NOW());
```

Step is operator-only — passwords don't belong in the repo.

## 7. PWA service worker isn't serving stale HTML

If a deploy is up-to-date but the browser shows yesterday's
build, the previous PWA service worker is serving cached HTML.
PR #8 covers this trap in detail at
`docs/runbook/mobile-overflow-and-pwa-cache.md`; the navigation
runtime now defaults to NetworkFirst with a 4 s timeout.

For an operator-side verification:

1. DevTools → Application → Service Workers → Unregister.
2. DevTools → Application → Cache Storage → Delete all entries.
3. Hard reload (Ctrl/Cmd+Shift+R).
4. Open in a private window for a second opinion.

## Cross-references

- `docs/runbook/powershell.md` — Windows-specific gotchas
  (PowerShell `$2b$…` interpolation, Vercel env var redeploy).
- `docs/runbook/i18n-dynamic-content.md` — what the trilingual
  fill-blanks merge guarantees + when it triggers.
- `docs/runbook/nextjs-not-found.md` — the duplicate-`<html>`
  hydration crash + the not-found.tsx files that prevent it.
- `docs/runbook/mobile-overflow-and-pwa-cache.md` — the
  StaleWhileRevalidate → NetworkFirst override + the
  global `overflow-x: hidden` guard.
- `docs/runbook/optimistic-feedback.md` — bulk-fetch + client-
  island vs server-side optimistic UI, and when client-side
  wins.
