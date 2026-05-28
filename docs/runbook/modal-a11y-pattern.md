# Modal a11y — the site-wide pattern

## Reference implementation

`components/gallery/image-modal.tsx` (M2-07 Iteration 3b). Any
new modal on the site should match this contract — not because
the implementation is sacred, but because users come to expect
the same close behaviour, the same keyboard shortcuts, and
the same focus return everywhere.

## The contract

| Concern          | What                                                                                                                        |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Role             | `<div role="dialog" aria-modal="true">` on the outermost element                                                            |
| Label            | `aria-label={…}` from the i18n catalog — never hard-coded                                                                   |
| Initial focus    | Move focus to the close button on mount via `useEffect` + `ref.current?.focus()`                                            |
| Focus return     | The parent passes an `onClose` that fires `requestAnimationFrame(() => triggerRef.current?.focus())` after `setOpen(false)` |
| Close — X button | Top-right, `<button>` with `<span aria-hidden>×</span>` + `<span class="sr-only">Close</span>`                              |
| Close — backdrop | `onClick={(e) => e.target === e.currentTarget && onClose()}` on the dialog root                                             |
| Close — Esc      | `document.addEventListener("keydown", …)` inside the mount `useEffect`, removed in cleanup                                  |
| Body scroll lock | Set `document.body.style.overflow = "hidden"` on mount; restore the previous value in cleanup                               |
| Focus ring       | `focus-visible:ring-ink-mute` (3.28:1 vs paper — WCAG AA) on every interactive control                                      |

## What we DON'T do

- **No `focus-trap-react` / no Radix Dialog.** Two `<button>`s
  plus an Esc handler covers the modal's keyboard surface; the
  dependency cost isn't justified.
- **No `inert` on background content.** Browser support is
  uneven and `aria-modal` already signals "background is
  inert" to assistive tech.
- **No `tabindex="-1"` on the dialog root.** Initial focus
  goes to the close button (always present, always actionable),
  not the dialog itself.

## Why initial focus on the close button (not the dialog)

Screen-reader users hear the dialog's `aria-label` announced
when focus enters, **and** they're parked on the always-safe
"get me out" affordance. If a user opens a modal by mistake
they're one Enter away from closing it. Initial focus on the
dialog root reads as "I'm trapped, where do I go" — initial
focus on close reads as "you can leave any time."

## When the modal has navigation (prev / next)

ImageModal navigates across 4 images. The keyboard contract
extends:

- `←` → previous image
- `→` → next image
- Both handlers `preventDefault()` to keep the browser from
  scrolling the underlying page.

Touch swipe is a parallel input — track `clientX` on
`touchstart` / `touchend`, fire prev / next at a 40 px
threshold (`SWIPE_THRESHOLD`). Below the threshold the
gesture reads as a tap or accidental drag.

## Tests

- **Vitest (SSR-only)** — structural a11y attributes:
  `role="dialog"`, `aria-modal="true"`, sr-only labels on
  X / prev / next buttons, focus-ring class consistency.
- **Playwright (DOM behavioural)** — Esc closes, ←/→
  navigates, focus returns to trigger on close, body scroll
  is locked while open.

(See `docs/runbook/vitest-vs-playwright-coverage.md` for
why this split.)

## Adding a new modal to the site

1. Copy `image-modal.tsx`'s a11y scaffold.
2. Add new i18n keys for the modal's `aria-label` + every
   sr-only control label, in all three locales.
3. Mirror the focus return pattern in the trigger (rAF +
   ref.current?.focus()).
4. SSR-only vitest covers the structural contract.
5. Playwright covers the behavioural contract.
