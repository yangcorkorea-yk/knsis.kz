# Deviations from `MVP Roadmap & WBS.html`

> **Hosting timeline:** Spec said Vercel. M0-02 chose Cloudflare Pages
> for cost + DNS single-vendor. **M1-03 (mid-stream) reverted to
> Vercel** after Cloudflare Workers + Next 14 + Prisma proved
> incompatible — see the "M1-03 · Hosting migration" entry below for
> the failure mode and triage. The earlier Cloudflare-related entries
> are kept for context but are no longer active decisions.

---

## M1-03 · Hosting migration — Cloudflare Pages → Vercel

**State**: active. Reverts the M0-02 hosting decision.

**Trigger**: After M1-03 shipped staff sign-in, hitting
`POST /api/auth/signin` on the Cloudflare Pages preview returned 500
with an empty body. Triage:

1. Cloudflare Pages requires every non-static route to declare
   `export const runtime = "edge"`. Added.
2. `@prisma/client`'s default engine doesn't run on Workers — needs a
   driver adapter. Tried `@prisma/adapter-pg-worker@5.22.0` +
   `@prisma/pg-worker@5.22.0` + `previewFeatures = ["driverAdapters"]`.
3. The adapter pulls in `cloudflare:sockets` (a Workers-only virtual
   module) and a dozen `node:*` prefixed built-ins. Webpack at build
   time couldn't resolve either. Added:
   - function-form externals for `cloudflare:sockets` + 11 Node
     built-ins (`crypto`, `path`, `stream`, `string_decoder`, etc.)
   - `NormalModuleReplacementPlugin` to strip the `node:` prefix
   - `export const dynamic = "force-dynamic"` on the routes
   - dynamic `await import("@/lib/db/client.edge")` inside POST
4. Webpack compile passed, but Next.js 14.2.5's build-time **edge
   sandbox** then failed: it evaluates the route module to collect
   metadata, and that sandbox doesn't apply `nodejs_compat`. Throws
   `Native module not found: url`. None of the above bypasses cured
   it — the eval is module-level, runs regardless of `dynamic =
   "force-dynamic"` or dynamic imports.

**Options evaluated** (Neon adapter incompatible with Supabase pooler;
Supabase REST API a partial fix that defers the same Prisma+Workers
problem to M3; Next 15 upgrade a milestone-sized risk).

**Decision**: revert hosting to Vercel. Standard Node runtime, Prisma
works without driver adapter, no webpack workarounds.

**Cost impact**: Vercel Pro $20/mo (shared account, no incremental
cost to this project).

**DNS**: remains on Cloudflare. M6 cutover swings the `knsis.kz`
A/CNAME to Vercel.

**Cleanup performed**:

- Removed `@cloudflare/next-on-pages`, `wrangler` devDeps; removed
  `build:cf` / `preview:cf` scripts; removed `workerd` from
  `pnpm.onlyBuiltDependencies`.
- Moved `wrangler.toml` → `_archive/v1-cloudflare/wrangler.toml`.
- Removed `runtime = "edge"` from `app/api/auth/{signin,signout}/
  route.ts`. Kept `dynamic = "force-dynamic"` since the routes always
  write.
- README.md "Deploy" section rewritten for Vercel; CLAUDE.md §4 +
  §9 updated likewise.
- All `@prisma/adapter-pg-worker` / `@prisma/pg-worker` / driver
  adapter experiments stashed and dropped — not committed to the
  branch.

**Re-evaluation trigger** (if any of these fire, reopen this
question): Vercel pricing changes, Cloudflare Workers + Next 15
becomes drop-in viable, or a future need for Workers KV/D1/R2 that
Vercel can't serve.

---

Decisions taken during MVP build that intentionally diverge from the
master spec. Each entry: WBS task, what the spec says, what we did,
why. The spec HTML is **not** edited — this file is the canonical
delta.

---

## M0-02 · Hosting / preview platform

- **Spec §02 Infra (`Vercel`)** → **Cloudflare Pages**
- **Spec M0-02 deliverable (`PR previews auto-deploy via Vercel`)** →
  Cloudflare Pages Git integration auto-deploys PR previews to
  `*.pages.dev`. Production at `knsis.kz` (DNS cutover deferred to M6).

Reasons:
- Vercel Hobby tier is non-commercial per ToS; Pro is $20/mo — not
  justified for MVP traffic.
- Cloudflare Pages: free tier covers 500 builds/mo + unlimited
  bandwidth, full Next.js 14 App Router support via
  `@cloudflare/next-on-pages`, edge presence in Almaty / Astana.
- DNS already on Cloudflare per the spec's "Infra" panel — keeps the
  control plane single-vendor.

Build & deploy mechanics:
- Cloudflare Pages → Git integration listens to the GitHub repo, builds
  on PR and on `main` push. No GitHub Actions job deploys to Cloudflare.
- Build command (set in Cloudflare dashboard, not in repo):
  `pnpm install --frozen-lockfile && pnpm exec @cloudflare/next-on-pages`
- Build output directory: `.vercel/output/static` (that's the adapter's
  output path, not Vercel).
- Node 22, pnpm 10.33.4.
- `wrangler.toml` at repo root declares project name + compatibility
  flags so `wrangler pages dev` works locally for edge-runtime smoke
  tests.

CI in GitHub Actions:
- `.github/workflows/pr.yml` — typecheck, lint, format:check,
  price:check, i18n:check, build (Next.js standard `next build`,
  not the Cloudflare adapter — adapter build only runs on Cloudflare's
  side).
- `.github/workflows/main.yml` — the above + Playwright smoke e2e.

When M-POST starts:
- If WhatsApp / Telegram webhooks need Node-only runtime bits, evaluate
  whether to move the corresponding routes to Cloudflare Workers
  (Node compat flag) or accept the constraint of edge runtime.

---

## M0-07 · PWA adapter

- **Spec §03 Frontend (`next-pwa`)** → **`@ducanh2912/next-pwa`** (App
  Router-compatible fork of next-pwa, currently at 10.2.9).

`next-pwa@5.6.0` (the package the spec names) hasn't been updated for
Next.js App Router and has open issues with the runtime. The maintained
fork ships a workbox-webpack-plugin integration that works out of the
box with `app/manifest.ts` and the App Router build pipeline. `serwist`
(next-pwa's spiritual successor) was also evaluated; we stayed with the
fork because the API surface is closer to what the spec describes.

The default workbox behaviour (StaleWhileRevalidate for navigations,
CacheFirst for hashed assets) is unchanged from the spec's E2 decision.

---

## next-on-pages retention decision (end of M0)

- A swap to `@opennextjs/cloudflare` is **not an adapter swap** — it's
  a Pages → Workers hosting-model change. Confirmed by a pre-PR-A
  spike.
- Change surface area spans six discrete things, all on the public path:
  build output directory (`.vercel/output/static` → `.open-next/`),
  wrangler schema (Pages `pages_build_output_dir` → Workers
  `main` + `assets`), deploy model (Cloudflare Git integration →
  GitHub Actions running `wrangler deploy` with an API token),
  preview URL pattern (`*.pages.dev` → Workers preview deployments),
  local dev command (`wrangler pages dev` → `wrangler dev`), and DNS
  attachment (Pages domain bind → Workers custom domain).
- That bundle of changes doesn't fit inside the MVP's 8-week budget
  and would re-open decisions C4–C5 of the M0 PR (no GH-Actions deploy
  step, no Cloudflare API token in CI).
- **Retention rationale**: `@cloudflare/next-on-pages` still works on
  Next 14 App Router. Its deprecation status is known and accepted.
- **Re-evaluation triggers** — revisit OpenNext/Workers when any of:
  1. We try to upgrade to Next 15+ and the adapter stops keeping up.
  2. Cloudflare formally EOLs Pages support for Next.js (today: only a
     "maintenance" label on the adapter, not on Pages itself).
  3. M-POST introduces a Workers-only need (Inngest workers, Workers
     KV, D1, R2 bindings without the Pages binding shim).
- Owner: whoever picks up M-POST should re-read this entry before
  spec'ing the WhatsApp / Inngest queues.

---

## M1-03 follow-up — Prisma Client on Cloudflare Pages edge runtime

The Cloudflare adapter (`@cloudflare/next-on-pages`) requires every
non-static App Router route to opt into the Workers edge runtime via
`export const runtime = 'edge'`. M1-03's `app/api/auth/signin/route.ts`
and `app/api/auth/signout/route.ts` now declare it; build is green and
both routes are emitted as Edge Function Routes.

That declaration is **necessary but not sufficient** for the routes
to actually serve traffic — Prisma Client's default engine (the
binary query engine that ships with `@prisma/client`) does not run on
the Workers/V8 runtime, even with `nodejs_compat`. The first
`prisma.user.findUnique` call from a signed-in attempt will throw
unless we move to a driver-adapter setup. Options (decision pending,
not picked yet):

1. `@prisma/adapter-pg-worker` + `previewFeatures = ["driverAdapters"]`
   in `schema.prisma`. Uses Cloudflare's `pg` (postgres.js fork) and
   the Cloudflare Hyperdrive accelerator if we want. Closest to the
   current code shape.
2. `@prisma/adapter-neon` if we route through a Neon-style pooled
   serverless driver. Requires the Supabase DB URL to expose the
   websocket endpoint Neon expects — likely doesn't, so probably out.
3. Prisma Accelerate — Prisma-hosted connection pooler. Cleanest dev
   ergonomics, but adds a paid Prisma dependency and one more vendor.
4. Move only the auth routes off Prisma and use raw SQL via
   `postgres` / `@neondatabase/serverless`. Smallest blast radius;
   keeps Prisma for the rest of M2/M3 where we want the generated
   types.

`nodejs_compat` is already in `wrangler.toml` from M0-02 so the flag
half of the story is done.

ESLint rule "every `app/api/**/route.ts` must export const runtime"
considered and rejected for now — small benefit, custom rule to
maintain, easier to lean on the Cloudflare adapter's build error
which is loud and immediate.

Trigger to revisit this entry: the first time someone tries to sign
in against the Pages preview and sees a 500.

---

## (running deviation note)

Known follow-up: `@cloudflare/next-on-pages` is in maintenance mode;
Cloudflare's newer recommended adapter is `@opennextjs/cloudflare` which
targets Cloudflare Workers Assets, not Pages. We stay on Pages +
`next-on-pages` for MVP per the M0-02 decision. Reassess at M-POST or
when Cloudflare formally deprecates Pages for Next.js.

---
