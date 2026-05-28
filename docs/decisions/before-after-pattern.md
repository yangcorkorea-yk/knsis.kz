# Decision: Before/After gallery — single-depth feed card with thumbnail-row + modal (Iteration 3b)

**Date:** M2 polish window (PR #11 final shape)
**Decided by:** PM
**Status:** Accepted — shipped in PR #11

## Iteration history

The B/A surface went through three shapes before the launch
form landed. Each iteration is captured so a future implementer
can read the arc instead of re-deriving it.

### Iteration 1 — per-card interactive slider

**What it was.** Spec letter (`MVP Roadmap & WBS.html` §05
M2-07): "Before/After gallery — Mobile-only; consent banner;
slider compare component." First build put an interactive
`<BeforeAfterSlider>` (drag handle reveals the After layer over
the Before layer) inside every list card on
`/[locale]/before-after`.

**Why it failed PM sign-off.**

1. Pattern inconsistency. Every other M2 discovery surface
   (Treatment, Clinic, Review on the home strip) uses
   list → detail. The gallery was the only surface where the
   "click into detail" affordance was a per-card interactive
   widget instead of a tap on the whole card.
2. Mobile visual load. Six interactive sliders stacked
   vertically competed with page-level scroll. Users
   mis-triggered a slider drag while trying to swipe past the
   card.

### Iteration 2 — list → detail

**What it was.** Restructured to a list page + detail route:

- `/[locale]/before-after` (list) — stacked cards with a
  **static** split preview (left half before-tone, right half
  after-tone, thin centre divider) + caption + meta. Tap → detail.
- `/[locale]/before-after/[slug]` (detail) — back link →
  caption h1 → consent banner → disclaimer → interactive
  `<BeforeAfterSlider>` full-width → meta line.

**Why it failed PM sign-off.**

Pattern survived but didn't feel right against the reference
PM was holding (강남언니 KR medical-aesthetic app). That app's
B/A surface is single-depth — everything the user needs to
evaluate the case lives on one card: image swipe row,
procedure tag, user interview quote, clinic meta. Sending the
user one level deeper to see the actual content broke that
mental model and added a click + a back-tap to every case
view.

### Iteration 3a — single-depth feed card with horizontal-swipe row

**What it was.** No detail route. The list card carried a
full-width image at the top, four CSS scroll-snap pages
(2 before + 2 after angles), with a static 4-dot indicator
underneath. Caption + procedure #tag + interview blockquote +
clinic meta sat below.

**Why it failed PM sign-off.**

The visual reference PM was holding against (강남언니 캡처 4)
is **not** a full-width swipe surface. It is a row of small
thumbnails — all 4 angles visible at a glance — that open a
modal when tapped. Iteration 3a optimised for the wrong
mental model:

1. The user has to swipe to see angles 2-4. Three swipes
   per case across a 6-case feed is friction; the social-feed
   pattern PM wants is "scan the angle row, decide, open
   one image full-screen if it catches you."
2. The 1-image full-width hero competed with the caption +
   interview for vertical space. The thumbnail row compresses
   the photographic real estate so the trust copy
   (interview blockquote) lands above the fold.

### Iteration 3b — 4-thumbnail row + image modal (LAUNCH FORM)

**What it is.** Still no detail route. The list card carries
everything, with the image affordance reshaped:

- **Row of 4 small square thumbnails** at the top edge of the
  card (CSS grid, `grid-cols-4`). All 4 angles visible
  simultaneously without a gesture. Each thumbnail is a
  `<button>` element.
- Tapping any thumbnail opens an **`<ImageModal>` lightbox**
  showing that image full-screen. Left / right arrows (or ←/→
  keyboard, or horizontal touch swipe) navigate across the 4
  angles. Close via X button, backdrop click, or Esc.
- The modal carries full a11y: `role="dialog"` + `aria-modal`
  - initial focus on the close button + focus return to the
    triggering thumbnail on close + body-scroll lock while open.
- Caption, procedure `#tag`, interview blockquote, clinic meta
  — unchanged from 3a.

The page-indicator dots from 3a are deleted (no scroll context
to indicate). The horizontal scroll-snap row is deleted (all
angles already visible inline).

## Why Iteration 3b is right

- **Depth 0 evaluation, depth 1 close-up.** The card surfaces
  all 4 angles at a glance for "is this case relevant?"; the
  modal handles "show me this one bigger." The 강남언니
  reference pattern PM validated against works exactly this
  way.
- **Multiple angles, no gesture cost.** All 4 angles visible
  inline. Users compare before-vs-after with their eyes, not
  their thumbs.
- **Trust copy lands above the fold.** Compressing the photo
  row from full-width to a thumbnail strip pulls the interview
  blockquote — the surface's reason to exist — up where it
  catches the user during the scan.
- **Mobile-native, accessible.** Thumbnail-grid + modal is a
  dominant medical/portfolio pattern; the modal carries full
  WCAG 2.1 AA keyboard + screen-reader support.

## Files affected by Iterations 3a → 3b

Deleted across the 3 → 3b arc:

- `app/[locale]/before-after/[slug]/page.tsx` (Iteration 2)
- `components/gallery/before-after-slider.tsx` (Iteration 2)
- `components/gallery/before-after-slider.test.tsx` (Iteration 2)
- Iteration 3a page-indicator dots + scroll-snap row inside
  `components/gallery/case-card.tsx` (replaced in 3b)

i18n keys retired:

- `gallery.before_label`, `gallery.after_label` (image overlay
  labels — Iteration 3 images are decorative gradients)
- `gallery.slider_aria_label` (no slider anymore)
- `gallery.case_caption_label` (sr-only prefix retired)

i18n keys added in 3a:

- `gallery.interview_label` — sr-only prefix on the
  interview blockquote ("후기" / "Отзыв" / "Пікір")

i18n keys added in 3b:

- `gallery.image_modal_label` — `aria-label` on the dialog
- `gallery.image_modal_close` — sr-only label on the X button
- `gallery.image_modal_prev` — sr-only label on the ← arrow
- `gallery.image_modal_next` — sr-only label on the → arrow

i18n keys touched (M2-polish dev-jargon scrub):

- `gallery.subtitle` — parenthetical "(mobile optimised)"
  removed in all three locales

Rewritten / added:

- `components/gallery/case-card.tsx` — Iteration 3b layout
  (now `"use client"`; state drives which thumbnail's modal
  is open)
- `components/gallery/image-modal.tsx` — **new** Iteration 3b
  lightbox component
- `components/gallery/case-card.test.tsx` — rewritten for 3b
  shape
- `components/gallery/image-modal.test.tsx` — **new** a11y +
  structural contract
- `lib/gallery/mock-cases.ts` — `GalleryCase` shape gains
  `images: [GalleryImage, GalleryImage, GalleryImage,
GalleryImage]` + `interview: TrilingualText`. 6 cases × 3
  locales = 18 interview blurbs; KR carries PM sign-off;
  KZ + RU queued for M7.

## M5 swap path (real images + real interviews)

Single boundary, same shape as M2-09 / M2-06:

- `MOCK_CASES` → `prisma.beforeAfterCase.findMany(…)` returning
  the same `GalleryCase[]` shape.
- `GalleryImage.tone` → `GalleryImage.src` (signed URL) +
  `GalleryImage.alt` already on the shape.
- `GalleryCase.interview` → linked via a `reviewCode` field on
  the new Prisma model, joining to a Review.body so the
  interview = the user's existing review (consistency with M2-06).

The card layout, dots, swipe scroll, focus rings, i18n keys —
all unchanged.

## Reversibility

**Back to Iteration 3a (full-width swipe + dots):** rewrite
the thumbnail row in `case-card.tsx` to a `snap-x snap-mandatory
overflow-x-auto` flex row of full-width images + a static dot
indicator beneath; delete the `<ImageModal>` mount and its 4
i18n keys.

**Back to Iteration 2 (separate detail page):** if a UX study
later prefers deep-linkable case URLs / more room for context
copy:

1. Restore `app/[locale]/before-after/[slug]/page.tsx` from
   PR #11's deleted-files diff.
2. Restore `components/gallery/before-after-slider.tsx` +
   its test.
3. Restore the `slider_aria_label` / `before_label` /
   `after_label` i18n keys.
4. Change `CaseCard` to wrap in `<Link href=".../[slug]">`
   and drop the inline interview + tag + meta + modal.

The mock data layer doesn't change for any of these paths —
`GalleryCase` already carries everything each pattern needs.
