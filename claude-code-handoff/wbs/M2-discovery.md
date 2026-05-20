# M2 · Discovery surface

> Public, browsable site without lead capture. Week 3–5.

**Phase done when:** the entire public site is browsable in three languages and indexed correctly. No lead capture yet.

## Tasks

### M2-01 · Home page
- [ ] Hero block (greeting, sub).
- [ ] Search input → routes to `/[locale]/search`.
- [ ] Popular categories grid (9).
- [ ] Korea consultation rail.
- [ ] Local partners rail.
- [ ] Verified-only band.
- [ ] Reviews strip (3 cards).
- [ ] Bottom tab on root only.
- **DoD:** Matches prototype layout at 390/768/1280; SEO meta per locale.
- **Owner:** FE. **Est:** 3d.

### M2-02 · Categories + filters
- [ ] 9 tiles with SVG art (port from `category-art.jsx`).
- [ ] Filter chips (area, concern, language) with URL state.
- [ ] Server-side filtering, not client-side.
- **DoD:** Filter URL is shareable and back-button restores state.
- **Owner:** FE. **Est:** 2.5d.

### M2-03 · Treatment detail
- [ ] Hero (kicker + title + summary + duration + languages).
- [ ] Recommended-for list.
- [ ] What-to-expect list.
- [ ] 4 info blocks (time, recovery, pre-consult, caution).
- [ ] Related clinics rail.
- [ ] Disclaimer footer.
- [ ] Sticky CTA (routes to `/consult/new?tx=slug`).
- **DoD:** Real treatment slug from seed renders.
- **Owner:** FE. **Est:** 2d.

### M2-04 · Clinic list + tabs
- [ ] Tabs: All / Korea / Local.
- [ ] Sort: reviews / popularity.
- [ ] Card per clinic.
- **DoD:** Sort URL is shareable.
- **Owner:** FE. **Est:** 2d.

### M2-05 · Clinic detail
- [ ] Hero + verified badge.
- [ ] Badges row (interpreter, partnership, aftercare).
- [ ] About text.
- [ ] Doctors list (names + roles).
- [ ] Treatment areas chips.
- [ ] Hours table.
- [ ] B/A strip (consent gated).
- [ ] Certification info block.
- [ ] Reviews section.
- [ ] Sticky CTA.
- **DoD:** Real clinic slug renders.
- **Owner:** FE. **Est:** 2d.

### M2-06 · Reviews feed
- [ ] Filter strip (treatment, region, clinic, rating min).
- [ ] Summary line.
- [ ] Pagination (not infinite scroll).
- [ ] Photo consent gating on thumbs.
- **DoD:** Disclaimer present at footer.
- **Owner:** FE. **Est:** 1.5d.

### M2-07 · Before/After gallery
- [ ] Mobile-only route.
- [ ] Slider-compare component.
- [ ] Consent banner above each post.
- [ ] Filter by treatment.
- **DoD:** No photo renders without `photoConsent: true`.
- **Owner:** FE. **Est:** 1.5d.

### M2-08 · Search results
- [ ] Empty state: recent searches + trending.
- [ ] Result state: tabs (All / Treatment / Clinic / Review) with counts.
- [ ] Highlight matched substring (`<mark>`).
- [ ] Server search using Postgres full-text per locale.
- **DoD:** Searching "лифтинг" in RU returns at least Ulthera + Lienne + a review.
- **Owner:** FE. **Est:** 2.5d.

### M2-09 · Seed content pipeline
- [ ] CSV → DB import script for treatments + clinics.
- [ ] Validation: every i18n field has 3 locales.
- [ ] Admin-triggerable from a hidden `/admin/seed` route (head+ only).
- **DoD:** Re-running import is idempotent.
- **Owner:** BE. **Est:** 2d.
