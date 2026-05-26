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
