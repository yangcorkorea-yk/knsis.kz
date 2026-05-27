# Horizontal-scroll pill rows — keep the scroll, hide the scrollbar

## Pattern

Filter pill rows on M2-02 categories, M2-04 clinics, and M2-06
reviews use `overflow-x: auto` so users can swipe (mobile) or
drag (desktop) past pills that don't fit the column width. The
scroll behaviour is **deliberate** — there are more pills than
the 390 px mobile width can hold.

The default browser scrollbar on those rows reads as visual
noise — a 12 px chrome bar that doesn't earn its space on a
mobile column. Hide it without breaking the scroll.

## Implementation

`app/globals.css` ships a `.scrollbar-none` utility class:

```css
@layer utilities {
  .scrollbar-none {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-none::-webkit-scrollbar {
    display: none;
  }
}
```

`scrollbar-width: none` (standard CSS — Firefox) +
`-ms-overflow-style: none` (legacy MS Edge) +
`::-webkit-scrollbar { display: none }` (Chromium / WebKit).

Apply the class on the pill-row container:

```tsx
<div className="scrollbar-none flex snap-x snap-mandatory scroll-pl-4 scroll-pr-4 gap-2 overflow-x-auto pb-1">
  {/* pills */}
</div>
```

The shared `<FilterAxis>` primitive
(`components/discover/filter-axis.tsx`) sets it once; the M2-02
/ M2-04 / M2-06 filter bars all flow through that, so a
future refactor that drops the class only has to drop it in
one place.

## What this is NOT

- ❌ Don't apply `.scrollbar-none` to page-content scrollers
  (a long article, the `<main>` body, etc.). Users need a
  visible scrollbar there to know how much page is left. The
  utility is opt-in per-element on purpose.
- ❌ Don't merge with `overflow-x: hidden`. We want the scroll;
  we just don't want the chrome bar. `overflow-x-auto +
scrollbar-none` is the correct pair.

## Cross-references

- `docs/runbook/mobile-overflow-and-pwa-cache.md` — the global
  `html, body { overflow-x: hidden }` guard from M2-04. That's
  for **rogue** horizontal overflow (a flex item that won't
  shrink); pill-row scroll is **intentional** and uses its own
  scroll context via `overflow-x-auto`, so the body-level rule
  doesn't affect it.
- `docs/decisions/filter-axis-threshold.md` — pill rows only
  apply when `options.length ≤ PILL_THRESHOLD`. Above the
  threshold the axis renders as a native `<select>`, and the
  scrollbar-hiding rule is moot.
