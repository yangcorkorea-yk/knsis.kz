# Runbook

Operational notes that bit us once and shouldn't again.

- [powershell.md](./powershell.md) — Windows PowerShell quirks +
  Vercel env var redeploy + Vercel CDN 404 caching gotcha
- [react.md](./react.md) — `React.Children.only` (#143) from Radix
  `<Slot>` with multi-child JSX
- [optimistic-feedback.md](./optimistic-feedback.md) —
  `useTransition` + local optimistic state + pulsing dot pattern
  for filter / submit interactions on slow Vercel ↔ Supabase EU
  round-trips. Apply from the start in M2-04, M2-06, M2-08, M3,
  M5-03.
- [i18n-dynamic-content.md](./i18n-dynamic-content.md) —
  three-locale seed at first-write time. KZ fallback visible to
  RU/KR users is a launch-quality defect, not a deferred-to-M7
  cosmetic. Fill-blanks merge protects reviewer edits.
- [nextjs-not-found.md](./nextjs-not-found.md) —
  `not-found.tsx` must NOT duplicate `<html>`. The root layout
  is `{children}` only (locale layout owns `<html lang>`), so
  the locale not-found has body content only and the root
  not-found supplies the document. Missing either file lets
  Next's built-in default 404 inject a second `<html>` →
  HierarchyRequestError + React #418/#423 hydration crash.
- [mobile-overflow-and-pwa-cache.md](./mobile-overflow-and-pwa-cache.md) —
  global `html, body { overflow-x: hidden }` against rogue
  horizontal overflow, `min-w-0` on flex children that hold
  variable-length text, and PWA navigation override from
  `StaleWhileRevalidate` to `NetworkFirst` so fresh deploys
  take effect immediately instead of one navigation later.
- [environment-recovery-checklist.md](./environment-recovery-checklist.md) —
  flat 7-step "I just came back / fresh laptop" checklist:
  branch sync, prisma generate, migration deploy, db:seed
  verification, Vercel env vars, admin user check, PWA service
  worker reset.
- [horizontal-scroll-pills.md](./horizontal-scroll-pills.md) —
  pill-row scroll behaviour stays (swipe + drag); the chrome
  scrollbar is hidden via the `.scrollbar-none` utility on the
  scrolling container. Don't apply to page-content scrollers —
  those need a visible scrollbar.
- [icu-message-format-quotes.md](./icu-message-format-quotes.md) —
  ASCII single quotes around an ICU placeholder
  (`'{query}'`) escape the placeholder and surface the literal
  on screen. Use locale-appropriate typographic quotes
  (`«…»` for kz/ru, `“…”` for kr) and let the catalog hygiene
  test guard the regression vector.
- [preview-url-volatility-and-branch-alias.md](./preview-url-volatility-and-branch-alias.md) —
  Vercel branch alias + PWA SW + CDN cache stack three layers
  of "the preview is showing the previous deploy" between
  push and visual sign-off. Five-step triage before declaring
  a HEAD defect.
- [modal-a11y-pattern.md](./modal-a11y-pattern.md) — the
  site-wide modal contract: `role="dialog"` + `aria-modal`,
  initial focus on the close button, focus return to the
  trigger, Esc / outside / X close, body scroll lock.
  ImageModal is the reference implementation.
- [vitest-vs-playwright-coverage.md](./vitest-vs-playwright-coverage.md) —
  vitest runs in node env (no DOM); it covers SSR structural
  assertions only. Behavioural assertions (events, focus,
  side effects) go to Playwright. Don't add jsdom.
- [preview-vs-production-coverage.md](./preview-vs-production-coverage.md) —
  the three-environment (local / Vercel preview / production)
  matrix: what each layer catches, what each misses, and why
  the preview visual sign-off is non-negotiable.
