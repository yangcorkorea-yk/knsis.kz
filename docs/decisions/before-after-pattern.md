# Decision: Before/After gallery — list + detail (not in-card slider)

**Date:** M2 polish window (PR #11 follow-up)
**Decided by:** PM
**Status:** Accepted — `/[locale]/before-after/[slug]` route added

## Context

The M2-07 spec line reads:

> M2-07: Before/After gallery — Mobile-only; consent banner;
> slider compare component

The first build interpreted "slider compare component" as a
per-card payload — every list card on `/[locale]/before-after`
rendered its own interactive `<BeforeAfterSlider>`. PM sign-off
flagged two problems:

1. **Pattern inconsistency.** Every other M2 discovery surface
   uses a list → detail pattern (Treatment, Clinic, Review on
   the home strip, then drill into detail). A surface with the
   "click into detail" affordance attached to part of every
   card is a one-off mental model.
2. **Mobile visual load.** Six interactive sliders stacked
   vertically on mobile compete for swipe + drag input with
   the page-level scroll. Users mis-trigger one when trying
   to scroll past.

## Decision

Restructure the gallery to **list → detail**:

| Surface                                  | What renders                                                                                                                                                                                                                       |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/[locale]/before-after` (list)          | Header → consent banner → disclaimer → stacked `CaseCard`s. Each card shows a **static** split preview (left half before-tone, right half after-tone, thin centre divider) + caption + treatment / clinic meta line. Tap → detail. |
| `/[locale]/before-after/[slug]` (detail) | Back link → case caption as `<h1>` → consent banner → disclaimer → **interactive** `<BeforeAfterSlider>` (full width inside the mobile-only column) → meta line linking to treatment / clinic detail pages.                        |

The interactive slider component (`BeforeAfterSlider`) is
unchanged — it just moves from per-card on the list to once on
the detail page. The mechanics (drag, keyboard, pointer
capture, `touch-none`, ARIA `role="slider"`) all carry through.

The static split preview is intentional: the slider is the
**payoff** of clicking into a case. A scrolling list of six
interactive sliders is fatiguing AND robs the detail page of
its reason to exist.

## How "slider compare component" still applies

The spec line names the component; it doesn't dictate placement.
The slider lives in `components/gallery/before-after-slider.tsx`
and renders on the detail page. The list page's static preview
shows the colour intent (before vs after tones) without the
interaction overhead.

## What this changes downstream

- `CaseCard` no longer renders the slider; it renders a static
  preview + `<Link>` to the detail route. The slider's
  `aria-label` need (and the `labels.sliderAria` prop) drops
  off the list-page label set.
- The detail page reuses `<ConsentBanner>`, `<MedicalDisclaimer>`,
  and `<BeforeAfterSlider>` — no new components.
- Mock-data shape unchanged. M5 admin's `BeforeAfterCase` model
  - Supabase Storage signed URLs still swap at the same
    boundary: `MOCK_CASES` → Prisma query returning the same
    `GalleryCase` shape, slider `beforeTone` / `afterTone` props
    → `beforeImageSrc` / `afterImageSrc`.

## Reversibility

If a future UX study shows users prefer the per-card slider
(swipe-to-explore browsing without committing to a detail
page), the change back is:

1. Restore the slider import to `case-card.tsx` and the
   `sliderAria` label.
2. Replace the static split-preview JSX with the
   `<BeforeAfterSlider>` call.
3. Optional: keep the detail route as a deep-link surface or
   delete `[slug]/page.tsx`.

The data layer doesn't change either way.

## Verification

- `components/gallery/case-card.tsx` test: card renders a Link
  to `/[locale]/before-after/[slug]`, no slider markup in the
  list card.
- Detail page renders the slider + meta links to existing M2-03
  / M2-04 detail pages.
- Mobile + desktop sign-off across 3 locales — same matrix as
  the original M2-07 build.
