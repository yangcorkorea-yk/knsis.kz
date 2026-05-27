# Decision: Before/After gallery — single-depth feed card (Iteration 3)

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

### Iteration 3 — single-depth feed card (LAUNCH FORM)

**What it is.** No detail route. The list card carries
everything:

- 4-image horizontal-swipe row at the top edge (2 before + 2
  after angles). Pure CSS scroll snap; no JS. Static page
  dots underneath.
- Caption.
- Procedure as a `#tag` linking to the M2-03 treatment
  detail page.
- User interview blockquote — the trust artefact this surface
  exists for.
- Clinic meta line linking to the M2-04 clinic detail page.

The interactive `<BeforeAfterSlider>` from Iterations 1 and 2
is deleted; the swipe-through-angles pattern replaces the
drag-reveal pattern entirely (the M5 real-image step still
benefits — multiple angles is what users actually want to see).

## Why Iteration 3 is right

- **Depth 0.** Matches the PM's reference app pattern. No
  click to evaluate; users scan the feed and stop when an
  interview catches them.
- **Multiple angles.** A surgeon's "after" rarely tells the
  story from one angle; swiping through 2 + 2 reads as
  evidence rather than marketing.
- **Trust copy.** The interview blockquote is the surface's
  reason to exist — user-voice copy reads as a real human
  experience and tracks with the M2-06 reviews pattern.
- **Mobile-native.** Horizontal swipe inside a vertical feed
  is the dominant pattern (Instagram, TikTok carousels,
  강남언니). No new mental model.

## Files affected by Iteration 3

Deleted:

- `app/[locale]/before-after/[slug]/page.tsx`
- `components/gallery/before-after-slider.tsx`
- `components/gallery/before-after-slider.test.tsx`

i18n keys retired:

- `gallery.before_label`, `gallery.after_label` (image overlay
  labels — Iteration 3 images are decorative gradients)
- `gallery.slider_aria_label` (no slider anymore)
- `gallery.case_caption_label` (sr-only prefix retired)

i18n keys added:

- `gallery.interview_label` — sr-only prefix on the
  interview blockquote ("후기" / "Отзыв" / "Пікір")

i18n keys touched (M2-polish dev-jargon scrub):

- `gallery.subtitle` — parenthetical "(mobile optimised)"
  removed in all three locales

Rewritten:

- `components/gallery/case-card.tsx` — Iteration 3 layout
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

If a UX study later prefers Iteration 2's separate detail
page (e.g. deep-linkable case URLs, more room for context
copy), the path back is:

1. Restore `app/[locale]/before-after/[slug]/page.tsx` from
   PR #11's deleted-files diff.
2. Restore `components/gallery/before-after-slider.tsx` +
   its test.
3. Restore the `slider_aria_label` / `before_label` /
   `after_label` i18n keys.
4. Change `CaseCard` to wrap in `<Link href=".../[slug]">`
   and drop the inline interview + tag + meta.

The mock data layer doesn't change either way — `GalleryCase`
already carries everything either pattern needs.
