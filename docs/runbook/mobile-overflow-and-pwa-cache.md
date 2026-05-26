# Mobile horizontal-overflow + PWA stale-page traps

Two distinct mobile-first traps that surfaced together at the PR #8
M2-04 sign-off. Symptom on `/[locale]/clinics/<slug>` (mobile
390 px): first paint shows the rightmost characters of every
right-aligned row clipped (`"10:00-16:0"`, `"closed"` jammed at
the edge). Toggling DevTools device mode (mobile → PC → mobile)
restores the proper layout.

## Trap A — `overflow-x` is not guarded by default

Tailwind preflight sets `box-sizing: border-box` but does **not**
clamp horizontal overflow. Anything that ends up wider than the
viewport (a flex item that refuses to shrink, an unbreakable
token like `Pretendard_Variable_subset.woff2?12345`, an SVG with
no `max-width`) lets the browser introduce a horizontal scrollbar
silently. On mobile that surfaces as "the right edge of every
right-aligned content is clipped" because the document scroll
offset isn't visible (no mouse to scroll).

**Defence:** `app/globals.css` clamps both `html` and `body`:

```css
html,
body {
  overflow-x: hidden;
}
```

This does NOT break intentional horizontal scrollers
(`overflow-x: auto` on the filter bar pill rows) — those have
their own scroll context.

**Component-level belt-and-suspenders:** flex children that
contain text default to `min-width: auto = min-content` and
**refuse to shrink below the longest unbreakable word**. Add
`min-w-0` to flex children that hold variable-length text:

```tsx
<li className="flex justify-between gap-3">
  <span className="min-w-0 text-ink-mute">{day}</span>
  <span className="min-w-0">{range}</span>
</li>
```

## Trap B — PWA `StaleWhileRevalidate` shows yesterday's build

The default workbox runtime for HTML navigation is
`StaleWhileRevalidate` — serve the cached HTML immediately and
revalidate in the background. The catch: on the first visit
after a deploy, the user sees the **previous** build's HTML,
even if the new build has a critical bug fix.

PR #8 caught this dramatically — the `d83d231` fix that
unnested `<main>` on clinic detail shipped, CI was green, the
Vercel preview rendered correctly in cold-load tests, but the
user's browser kept showing the broken (nested-`<main>`) page on
every navigation until the cache revalidated.

**Defence:** `next.config.mjs` overrides the navigation runtime
to `NetworkFirst` with a 4-second network timeout:

```js
runtimeCaching: [
  {
    urlPattern: ({ request }) => request.mode === "navigate",
    handler: "NetworkFirst",
    options: {
      cacheName: "pages-cache",
      networkTimeoutSeconds: 4,
      expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
    },
  },
],
```

Hashed assets (CSS / JS / fonts) keep the default `CacheFirst`
behaviour — file-name hashing makes that safe.

**Trade-off:** repeat visitors on fast networks lose a small
amount of first-paint speed (network round-trip vs cache hit).
The win: deploys take effect immediately. For the MVP launch
window this trade-off is correct; once layouts stabilise, we
can revisit a hybrid strategy (e.g., per-route policy).

## How to verify

After every deploy, hit any page on a clean profile or
incognito window and inspect first-paint behaviour:

| Check                                                        | Pass criterion                                                           |
| ------------------------------------------------------------ | ------------------------------------------------------------------------ |
| First paint matches subsequent paint                         | No "fix on F12 toggle" — layout is correct on the first server response. |
| DevTools → Application → Cache Storage                       | `pages-cache` exists; entries match the current deploy's HTML.           |
| DevTools → Network → Disable cache + hard reload             | Page renders correctly without any visual regression.                    |
| `document.documentElement.scrollWidth === window.innerWidth` | No hidden horizontal overflow.                                           |

## Related runbooks

- `docs/runbook/nextjs-not-found.md` — `not-found.tsx` files
  prevent the duplicate-`<html>` hydration crash on 404 pages.
  The two traps are independent but caught in the same PR.
- `docs/runbook/optimistic-feedback.md` — when filter UI runs
  client-side instead of via `router.push`, no PWA navigation
  fires and this trap can't trigger; that's a side benefit of
  the bulk-fetch + island shape beyond the latency fix.
