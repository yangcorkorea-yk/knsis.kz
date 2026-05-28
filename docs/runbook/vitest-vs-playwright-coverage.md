# vitest vs Playwright — what each covers, and why

## The split

`vitest.config.ts` sets `environment: "node"`. **No jsdom, no
happy-dom.** Component tests run in a Node process where
`document` and `window` don't exist. We render components via
`renderToString` from `react-dom/server`.

That means:

| Concern                                              | vitest                   | Playwright |
| ---------------------------------------------------- | ------------------------ | ---------- |
| JSX renders without throwing                         | ✅                       | ✅         |
| Props plumb through to rendered HTML                 | ✅                       | ✅         |
| `aria-label`, `role`, `data-*` attribute presence    | ✅                       | ✅         |
| Locale-resolved text (via `tr()`) lands in HTML      | ✅                       | ✅         |
| Conditional rendering on prop values (`{open && …}`) | ✅ (initial render only) | ✅         |
| `useState` initial state in the rendered HTML        | ✅                       | ✅         |
| `useState` after a user event                        | ❌                       | ✅         |
| `useEffect` side effects                             | ❌                       | ✅         |
| Click / keyboard / touch handlers fire               | ❌                       | ✅         |
| Focus management (`ref.current?.focus()`)            | ❌                       | ✅         |
| `document.addEventListener` listeners attach         | ❌                       | ✅         |
| `document.body.style.overflow` mutation              | ❌                       | ✅         |
| Full page navigation                                 | ❌                       | ✅         |

## Why we keep the node environment

- **Fast.** 286 tests run in ~9 s. Adding jsdom adds startup
  cost per test file and pulls a whole DOM polyfill into the
  Node process for assertions we'd still split with Playwright
  anyway.
- **Honest boundary.** Tests in node-env can't lie about
  behaviour they didn't exercise — they assert on the SSR
  output, which is what hits the user's first paint. The
  behavioural surface lives where users actually live: a real
  browser, driven by Playwright.
- **No "I have a green test but the feature is broken in the
  browser" trap.** Behavioural assertions in a fake DOM are a
  common false-confidence vector; we sidestep it by sending
  every behavioural assertion to a real browser.

## Rule of thumb

> If the assertion can be made from the HTML string that
> `renderToString` produces with the component's initial
> props, write a vitest. Otherwise write a Playwright.

Initial props include the `open=true` branch — render the
modal with `<ImageModal initialIndex={2} … />` and assert the
3rd image is the one in the `role="img"` slot. That's a
vitest, not a Playwright.

What's NOT vitest territory:

- "User clicks the close button → modal disappears" → state
  change after an event → Playwright.
- "Esc closes the modal" → keyboard event + listener → Playwright.
- "Focus moves to the close button on open" → `useEffect`
  fires → Playwright.
- "Body scroll is locked while open" → `useEffect` side
  effect → Playwright.

## What vitest CAN do for behavioural-looking concerns

Pure logic — extract it from the component and test the
function:

- Token bucket rate limit math → `lib/ratelimit/bucket.ts` +
  `bucket.test.ts`.
- ICU placeholder regex sweep → catalog-walker test that
  doesn't render any component.
- Form validation rules (Zod schemas) → `schemas/*.test.ts`.

If the behaviour can be expressed as a pure function, vitest
is faster than Playwright and gives a tighter feedback loop.
Extract the function; cover the function; let the component
just call it.

## Playwright is for the user-facing journey

Playwright lives in `tests/e2e/`. The smoke suite runs on push
to `main` via `.github/workflows/main.yml`. It covers:

- 3 locales × top-level routes load without console errors.
- Submit form → admin inbox shows the row (M5+).
- Modal open / close / keyboard navigation (per-modal e2e).
- PWA install prompt + offline navigation (M5+).

When a vitest can't express the assertion you need, add a
Playwright spec — don't reach for jsdom.
