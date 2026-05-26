# Next.js 14 — not-found.tsx must NOT duplicate `<html>`

## Symptom

Browser console on a 404 path (e.g. `/kr/clinics/<slug>` where the
route doesn't exist):

```
React error #418 — Hydration failed because the initial UI does not match
React error #423 — There was an error while hydrating
HierarchyRequestError: Failed to execute 'appendChild' on 'Node':
  Only one element on document allowed.
NotFoundError: Failed to execute 'removeChild' on 'Node':
  The node to be removed is not a child of this node.
```

The 404 page is visible but the page is broken from hydration on
— buttons don't react, client islands don't mount, Sentry would
log a non-stop stream of these errors in production.

## Root cause

This repo's root layout (`app/layout.tsx`) intentionally returns
just `{children}` — no `<html>` / `<body>`. The reason: the
locale layout `app/[locale]/layout.tsx` owns `<html lang>` so the
attribute reflects the active locale (`kk` / `ru` / `ko`).

When a path under `/[locale]/` doesn't match any page, Next.js
needs a `not-found.tsx`. Without one, Next falls back to its
built-in default 404 UI. **That default UI ships with its own
`<html>` and `<body>`.** Next renders it as the locale layout's
`{children}` — so the browser receives:

```html
<html lang="kk">
  <!-- from [locale]/layout.tsx -->
  <body>
    <html lang="en">
      <!-- from Next default 404 -->
      <body>
        ...
      </body>
    </html>
  </body>
</html>
```

The browser DOM rejects the inner `<html>` (only one root element
is allowed under `document`), throws `HierarchyRequestError`,
and the React reconciler crashes.

## Fix

Explicit `not-found.tsx` files at the right boundaries:

| File                         | Provides `<html>`?         | When it renders                                                                                                                                                                 |
| ---------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `app/[locale]/not-found.tsx` | **NO** — body content only | Path matched `/[locale]/...` but no page; locale layout's `<html>/<body>` wraps this.                                                                                           |
| `app/not-found.tsx`          | **YES** — full document    | Path didn't match a known locale (`[locale]/layout.tsx` called `notFound()`); locale layout is abandoned, this file renders under the root layout (which is `{children}` only). |

`app/[locale]/not-found.tsx` is locale-aware: `setRequestLocale`
already ran in the locale layout, so `getTranslations` resolves
to the user's locale. `app/not-found.tsx` is locale-agnostic
English (by definition we got here because the URL didn't carry
a known locale).

## How to verify (smoke checklist)

| Path                             | Expected                                                                                |
| -------------------------------- | --------------------------------------------------------------------------------------- |
| `/kz/clinics/does-not-exist`     | Locale-aware 404 (Kazakh copy), no console errors, no double `<html>` in DOM inspector. |
| `/ru/treatments/does-not-exist`  | Russian copy.                                                                           |
| `/kr/categories/foo/bar`         | Korean copy.                                                                            |
| `/foo/anything` (invalid locale) | Generic English 404 (root not-found), single `<html lang="en">` in DOM.                 |
| `/random-no-locale`              | Same as above — root layout is `{children}` only, root not-found supplies the document. |
| `/kz` (valid home)               | Normal page, no regression.                                                             |

In all cases: open DevTools → Elements panel → confirm exactly
ONE `<html>` element under `<document>`.

## What NOT to do

- ❌ Move `<html>/<body>` to the root layout to "make
  not-found.tsx easier" — it removes the per-locale `lang`
  attribute, breaks screen reader pronunciation and the
  WCAG 3.1.1 pass we already have.
- ❌ Have `app/[locale]/not-found.tsx` supply `<html>` — exactly
  the bug this runbook documents.
- ❌ Skip `app/not-found.tsx` and let Next default UI render —
  it shows English-only generic copy that doesn't match the
  product visual.

## Related

- Next.js docs: [`not-found.tsx`
  file convention](https://nextjs.org/docs/app/api-reference/file-conventions/not-found)
- React error decoder: errors [#418](https://react.dev/errors/418)
  (hydration mismatch) and [#423](https://react.dev/errors/423)
  (hydration error).
- M2-04 PR #8 caught this — the slug routes added in M2-03 / M2-04
  expand the surface of "valid `[locale]` prefix, missing page"
  paths.
