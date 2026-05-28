# Decision: filter axis pill / dropdown threshold

**Date:** M2 polish window (PR #11 follow-up)
**Decided by:** PM
**Status:** Accepted — applied to Categories / Clinics / Reviews

## Context

Filter axes on the M2 discovery surfaces (Categories, Clinics,
Reviews) render as a horizontal scrolling row of pills. The
pattern works cleanly at the mock-data scale (≤ 9 options per
axis); pre-launch the operator-admin tooling (M5) registers real
treatments + clinics, and we should expect a long tail:

- Treatments: corpus grows past 30 within the first launch
  quarter — plausible per spec §02 scope.
- Clinics: ≥ 50 partner clinics is the launch target.
- Reviews: data-driven treatment + clinic facets follow the
  underlying corpora.

A horizontal pill row with 50 options is a swipe-fatigue trap —
the user can't see the option they want without scrolling
through everything, and there's no way to type to narrow.

## Decision

Add a hard threshold to the shared `<FilterAxis>` primitive:

| `options.length`                     | Render shape                   |
| ------------------------------------ | ------------------------------ |
| `≤ PILL_THRESHOLD` (currently **7**) | Horizontal pill row (existing) |
| `> PILL_THRESHOLD`                   | Native `<select>` dropdown     |

The flip is automatic — page code passes its option array
to `<FilterAxis>` and the threshold check happens in one place.
No callsite needs to know which shape it gets.

## Why native `<select>` (not a custom combobox)

- Keyboard accessibility ships free (the platform widget).
- Mobile gets the OS picker chrome — familiar, scrollable
  in-context, and searchable (long-press / type-ahead) on iOS
  and Android.
- One less custom widget to maintain through M5 admin review.

Trade-off: the dropdown can't be searchable by typing on
desktop the way a true combobox would be. If user research at
M5 sign-off shows desktop operators wanting that, we revisit
with a styled combobox — but the bar to clear is real user
data, not speculation.

## Threshold value (7)

A value of 7 puts Categories.concern (9 TreatmentCategory
enum values) into the dropdown path immediately, while leaving
Area (4), Language (4), Kind (2) as pills. That gives the
launch surface a mix of both shapes — confirms the visual
treatment for both on day one without waiting for the operator
corpus to grow.

The threshold lives at `PILL_THRESHOLD` in
`components/discover/filter-axis.tsx`. Change it in one place;
all three filter bars re-render the next time.

## Reversibility

- Lowering to 5 (more aggressive dropdown) → one-line edit.
- Raising to 10 (almost always pill) → one-line edit.
- Per-axis override (e.g. Concern always pill regardless of
  count) → add an optional `forceShape` prop on FilterAxis.

## Not in scope

- Combobox / typeahead search inside the dropdown. Native
  `<select>` is the launch form; revisit per actual user data.
- Per-locale threshold (e.g. KR shorter pill labels could fit
  more on screen). Single global value keeps the decision tree
  small.
- Sticky / floating filter bar on long lists. Separate UX
  decision.

## Verification

- `components/discover/filter-axis.test.tsx` pins the threshold
  behaviour: 7 options → pill markup present, 8 options →
  `<select>` markup present.
- Manual sign-off on /kz/categories (Concern → dropdown), /ru
  - /kr same. No regression on the other axes.
