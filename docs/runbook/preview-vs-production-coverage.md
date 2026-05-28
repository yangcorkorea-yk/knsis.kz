# Preview vs production — three-environment matrix

## The three environments

| Env                | URL pattern                                                                  | Lifecycle                            | What it proves                                                                            |
| ------------------ | ---------------------------------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------------------------------- |
| **Local**          | `http://localhost:3000` after `pnpm dev`                                     | Live with HMR                        | Code correctness; layout at 390/768/1280; locale switch                                   |
| **Vercel preview** | `https://seoulbeauty-kz-git-{branch}.vercel.app` (or the per-deploy SHA URL) | Per push; auto-purged after PR close | Production build path; real CDN + SSR runtime; real Supabase EU latency; PWA SW behaviour |
| **Production**     | `https://seoulbeauty-kz.vercel.app`                                          | Per merge to `main`                  | Real users hit this; real cache headers; real network conditions                          |

## Why all three matter

Each layer has failure modes the others miss.

### Local catches

- Type errors, lint errors, test failures.
- Layout shift on viewport resize.
- Console errors / React warnings during HMR.
- Anything that breaks the dev server's hot reload (rare;
  usually a misconfigured config file).

### Local **misses**

- Production-only minification bugs.
- Production-only `dynamic = "force-dynamic"` interactions
  with `setRequestLocale`.
- Real Supabase EU round-trip latency (M2-04 PR #8 needed
  optimistic feedback because the dev DB was fast — the
  preview against the real Supabase exposed the 400+ ms
  filter-bar perceived freeze).
- PWA service worker behaviour (the SW only registers in
  production builds).
- Vercel CDN caching of the HTML envelope.

### Preview catches

- All of the above plus first-paint regressions on real
  network paths.
- Branch-aliased deploys serving the wrong commit briefly
  (see `preview-url-volatility-and-branch-alias.md`).
- Stale SW serving the previous build for one navigation
  after a new deploy.

### Preview **misses**

- Real production traffic patterns (cold start vs warm
  serverless function differences).
- Real custom-domain DNS / TLS chain (we're at the Vercel
  default; Cloudflare DNS still owns the apex but `seoulbeauty-kz`
  is the Vercel-hosted subdomain).
- Real production cache headers vs preview's "no cache for
  unauthed users" policy.

### Production catches

- Whatever the user actually hits.

## The visual sign-off matrix

For every M-milestone PR sign-off:

1. **Local — implementer.** Type / lint / test / build green
   before push.
2. **Preview — PM visual.** 3 locales × the new surface +
   any adjacent surface that could regress. Mobile 390 first;
   then 768; then 1280 if the surface is desktop-touched.
3. **Production — post-merge smoke.** PM hits the production
   URL once for each locale, confirms the change is live and
   no Sentry leaks fire in the first 5 minutes.

If step 3 surfaces a defect that step 2 didn't catch, treat
it as a preview-vs-production drift — usually CDN cache or SW.
Run through the triage in
`preview-url-volatility-and-branch-alias.md` before declaring
a real regression.

## Don't ship without preview sign-off

The temptation is "tests are green, build is green, ship it."
The defects that have actually hit users on this codebase —
ICU placeholder eat (PR #10), "면허" tone drift (PR #11
initial KR copy), 404 hydration crash (PR #8) — none of them
were caught by typecheck / lint / vitest / build. All four
were caught by the preview visual matrix.

CI gates protect against code rot; the preview matrix
protects against UX rot. Both are required.

## Mobile-first matrix

KZ is the longest-text locale (Cyrillic + Kazakh suffixes
inflate line length 20-30% vs KR). If a surface fits in KZ
at 390 px, it fits in RU and KR. Start the matrix in KZ at
390; widen + switch locales as the surface earns it.
