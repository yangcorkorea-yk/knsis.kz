# Backlog — deferred polish (M7 / content-fill / launch)

**Date:** M3 sign-off close
**Decided by:** PM
**Status:** Logged — execution deferred until WBS priority opens

The M3 sign-off matrix surfaced two cosmetic / capability gaps
that are intentionally **not** blocking the M3 merge. Capturing
them here so the next implementer doesn't re-derive the scope
or burn time deciding whether to ship them inside an earlier
milestone.

## Item 1 — Visual polish (M7 or M5 content-fill window)

Real imagery + bottom navigation + design-token finishing
land at M7 (visual polish milestone) or earlier whenever the
content batch lands. Specifically:

| Asset                                                       | Current state                                      | M7 / content target                                                                                           |
| ----------------------------------------------------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Category tile (home grid 3×3)                               | Text-only on `bg-paper` border tile                | Add an inline SVG / decorative photo per category (botox / filler / lift / etc.)                              |
| Clinic card image                                           | No image — name + city + Verified badge            | 16:9 clinic hero photo on each card (mock during M5 seed, real in M7)                                         |
| Before/After thumbnails                                     | CSS gradient placeholders                          | Real photographs (M5 admin moderation pass swaps the data layer per `docs/decisions/before-after-pattern.md`) |
| Design tokens                                               | M0-04 baseline (color + typography + radius)       | Final pass against the Kazakhstan-market reference visuals (shadows / spacing / radius nuances)               |
| Korea-visit (KV) entry banner                               | Not on home yet                                    | Cross-link banner once M4-01 ships the KV form                                                                |
| Bottom tab bar (Home / Treatments / Clinics / Reviews / Me) | `components/ui/bottom-tab.tsx` exists, not mounted | Mount on the public-app layout once the IA is locked                                                          |

These don't block M3 sign-off because:

- The M3 surface (consult flow) is functional without them.
- M5 admin moderation owns the clinic / before-after image
  workflows; bringing in mock images earlier creates churn.
- WBS critical path is M3 → M5 → M6; visual polish is M7.

## Item 1.5 — `/consult/done` "next steps" visual hierarchy

Current state (post-M3): plain `<ol>` with `border-l-2 rose-soft`
gutter + `font-semibold` step titles + small body text. M3 smoke
matrix surfaced: visual hierarchy reads weak — the three steps
look like a list, not a journey.

Target visual:

- Numbered tile per step (rounded square with the digit in
  rose-deep)
- Step title in larger weight
- Optional small icon per step (검토 / 연락 / 일정)
- Tighter rhythm between steps

Deferred because:

- The current implementation is functionally complete — copy
  is accurate, screen-readers parse it correctly
- The fix is decorative; landing it here means a follow-up
  PR that visual-polish-touches nothing else
- Fits naturally inside the M7 visual polish batch alongside
  bottom tab bar + category tiles + design-token finishing

Not blocking soft launch.

## Item 3 — `await notifyPm` → `waitUntil(notifyPm)` (latency recovery)

M3 hotfix (PR #14) switched the PM-alert email path from
`void notifyPm(...).catch(...)` to `await notifyPm(...)` to
work around the Vercel fire-and-forget trap
(`docs/runbook/vercel-fire-and-forget.md`).

The await adds ~300-700 ms to the `POST /api/leads` response.
Invisible to users today (they're already mid-redirect to
`/consult/done`), but the latency can come back via the
Vercel-blessed pattern:

```ts
import { waitUntil } from "@vercel/functions";

waitUntil(notifyPm(result.code, locale, payload));
return NextResponse.json({ code: result.code });
```

`waitUntil` registers the promise with the runtime so the
function context stays alive past the response send. The
PM-alert send completes in the background; user response
returns in <100 ms again.

Defer because:

- Current `await` shape is functionally complete + structured
  logs landed; the latency is below the M3 perception threshold
- `@vercel/functions` is a new dep (read it for the API surface
  first — confirm it's MVP-scope-compatible, no telemetry
  side-effects)
- Worth bundling with the M4-04 transactional email work
  (customer receipts) — same pattern applies to those
  `send()` calls; switch all of them together

M-POST carve check: `@vercel/functions` is a runtime helper,
not a queue (Inngest / SQS class). Hard rule §4 ("real queue
M-POST") not triggered. **Safe to land at M3 closure batch or
inside M4-04.**

## Item 4+ — TBD from M3 production smoke (steps 2/3/4)

Reserved for polish items surfaced by the M3 production smoke
matrix in progress (step 2 = `/kz` lead, step 3 = visual
regression sweep across home + clinics + reviews + consult,
step 4 = rate-limit positive). Populate as the matrix
completes.

## Item 2 — Language switcher on home top-right

Current: language switcher lives on `/[locale]/me` (mobile
settings entry).

Target: add a second entry point on the home `<header>` (top-
right corner) so a first-visit user can switch locale without
hunting through the Me page.

Spec:

- KZ / RU / KR dropdown (or short-pill row depending on
  width — defer to visual sign-off)
- Keep the existing Me-page switcher (two entry points, one
  source of truth: `lib/i18n` locale cookie + URL rewrite)
- aria-label per the M2 a11y pattern; reuse the modal-a11y
  runbook's focus-ring guidance if it ends up as a dropdown

This is deferred because:

- The home is already feature-complete for M3 sign-off
- Locale switching works (via URL + Me page) — this is a
  reach improvement, not a defect
- M7 polish window is the right place to make the visual
  decision (dropdown vs pill vs flag-icon)

## When to execute

| Trigger                   | Action                                                            |
| ------------------------- | ----------------------------------------------------------------- |
| M5 content batch lands    | Add mock clinic / category imagery alongside seeded data          |
| M4-01 KV form ships       | Wire the KV entry banner on home                                  |
| M5 admin moderation ships | Swap before/after gradient → real photo data layer                |
| M7 polish window opens    | Bottom tab bar, design-token finishing, language switcher on home |

If a defect is reported on one of these surfaces before the
trigger fires, evaluate case-by-case — sometimes a one-line
fix lands in the current milestone, sometimes it joins the
M7 batch.
