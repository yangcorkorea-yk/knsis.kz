# Deviations from `MVP Roadmap & WBS.html`

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

## (running deviation note)

Known follow-up: `@cloudflare/next-on-pages` is in maintenance mode;
Cloudflare's newer recommended adapter is `@opennextjs/cloudflare` which
targets Cloudflare Workers Assets, not Pages. We stay on Pages +
`next-on-pages` for MVP per the M0-02 decision. Reassess at M-POST or
when Cloudflare formally deprecates Pages for Next.js.

---
