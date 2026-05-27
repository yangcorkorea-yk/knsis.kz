# Decision: KR disclaimer copy — drop "면허" (license) qualifier

**Date:** M2 polish window (post M2-07 sign-off, pre PR #11 merge)
**Decided by:** PM
**Status:** Accepted — applied in PR #11 follow-up commit

## Context

Every M2 customer surface that touches medical-adjacent content
carries a `MedicalDisclaimer` panel:

| Surface                      | i18n key                  |
| ---------------------------- | ------------------------- |
| Treatment detail (M2-03)     | `treatments.disclaimer.*` |
| Clinic detail (M2-04)        | `clinics.disclaimer.*`    |
| Reviews feed (M2-06)         | `reviews.disclaimer.*`    |
| Search results (M2-08)       | `search.disclaimer.*`     |
| Before/After gallery (M2-07) | `gallery.disclaimer.*`    |

The KR copy on the first three surfaces was Claude Code's
first-cut translation, which used the formal "면허 의사" (licensed
doctor) construction across the board.

When PM authored the disclaimer copy for M2-07 (B/A gallery)
and M2-08 (search) directly, the natural choice was the plain
"의사" (doctor). The "면허" qualifier reads as formal /
legalistic to a Korean reader — accurate, but noticeably
heavier in tone than the surrounding product copy.

Mixing the two left users hopping between "의사" (gallery,
search) and "면허 의사" (treatment, clinic, reviews) across
adjacent flows, which leaks tonal inconsistency into the
launch surface.

## Decision

**Drop the "면허" qualifier from every KR disclaimer copy.** The
plain "의사" is the launch-ready form across all five surfaces.

| Surface   | Before                                     | After                                 |
| --------- | ------------------------------------------ | ------------------------------------- |
| Treatment | `…의료 상담은 면허 의사와 하시기…`         | `…의료 상담은 의사와 하시기…`         |
| Clinic    | `…의료 상담은 면허 의사와 하시기…`         | `…의료 상담은 의사와 하시기…`         |
| Reviews   | `…구체적인 안내는 면허 의사와 상담하시기…` | `…구체적인 안내는 의사와 상담하시기…` |
| Search    | `…의사와 상담하시기…` (already)            | unchanged                             |
| Gallery   | `…의사와 하시기…` (already)                | unchanged                             |

KZ + RU copy is untouched. M7 native-speaker QA (per
`docs/runbook/i18n-dynamic-content.md` §Translation authorship)
is the final reviewer pass for those locales.

## What this is NOT

- Not a legal interpretation. "의사" (doctor) standing alone is
  conventionally understood to mean a licensed practitioner in
  Korean medical-context copy. The "면허" qualifier was
  belt-and-suspenders, not load-bearing.
- Not a re-translation of the other clauses. Only the licensed-
  doctor noun phrase changes; "본 정보는 일반적 안내입니다",
  "의료 조언이 아닙니다", etc. all stay.
- Not a precedent for "shorten every qualifier we can find."
  Consistency, not brevity, is the driver — if PM later judges
  another phrase to be inconsistent across the surfaces, that's
  a separate decision.

## Tests + verification

The existing catalog-fidelity tests for each surface
(`components/treatments/medical-disclaimer.test.tsx`,
`components/reviews/review-card.test.tsx`,
`lib/gallery/mock-cases.test.ts`) match against `의사` (the
generic doctor noun). All keep passing after this change —
removing "면허" doesn't drop "의사".

Visual sign-off across the PR #11 matrix re-checks the KR
disclaimer string on every surface for tonal consistency.

## Reversibility

Reversing this is a 3-line edit in `messages/kr.json` if PM
later decides "면허" added legal weight that's worth the tonal
cost. The decision lives here so the next implementer doesn't
re-introduce "면허" out of training-data instinct.
