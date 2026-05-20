# 06 · Non-functional requirements

> Hard budgets. CI fails if violated. Don't loosen these without writing why in the PR.

## Performance (Moto G4, 3G Slow throttled in Lighthouse)

| Metric | Budget |
|---|---|
| LCP — Home | < 2.5 s |
| LCP — Treatment / Clinic detail | < 2.8 s |
| CLS | < 0.1 |
| TBT | < 200 ms |
| JS bundle per route | ≤ 130 KB gzipped |
| Images | `next/image`, AVIF/WebP, lazy below the fold |

CI runs Lighthouse against 6 pages on PR. Median P75 from PostHog real-user metrics tracked weekly.

## Accessibility

- WCAG 2.1 AA on the entire public flow.
- Color contrast ≥ 4.5:1 on body text. Audit the rose-on-tint chips.
- Keyboard reachable everywhere including the bottom tab bar (`Tab` → `Enter` activates).
- Real `<label>` on every input; error text wired with `aria-describedby`.
- Focus ring visible. Don't kill outlines.
- `prefers-reduced-motion` respected (no card-lift animation, no auto-carousel).
- Manual a11y QA once per phase using NVDA + VoiceOver.

## Security & privacy

- PII (phone, email, photos) encrypted at rest via Supabase column-level encryption.
- Photos in a private bucket; served with 5-min signed GET URLs.
- Rate-limit every mutating route (see `docs/03-api.md`).
- Turnstile widget on unauth forms.
- Audit log for every admin mutation.
- Data residency: Supabase EU region. (Confirm with KZ counsel before launch — open question.)
- "Delete account" actually deletes. 30-day reversible tombstone, then hard delete.
- Webhooks: signature verify before reading body. 401 immediately on bad sig.

## Observability

- **Sentry** — FE + BE errors, release tagging, source maps.
- **PostHog** — funnels: `onb → home → tx → consult` and `kv-landing → kv-plan → kv-ok`. Session replay with PII masking on inputs.
- **Inngest** — automation run history per rule, retries visible.
- **Provider dashboards** — admin-only views of WhatsApp / Telegram / SMS delivery rates.

## Browser support

- Chrome / Edge / Safari last 2 versions.
- Firefox last 2 versions.
- iOS Safari ≥ 15, Android Chrome ≥ 100.
- No IE. No old Samsung Internet < 18.
