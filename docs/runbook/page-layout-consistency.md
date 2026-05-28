# Page layout consistency — the `mx-auto max-w-md` contract

## Pattern

Every public-app page (`app/[locale]/...`) shares one column
shape:

```tsx
<main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24 md:max-w-3xl">
  <header className="px-4 pt-8">...</header>
  <SomeAside /> {/* owns its own `mx-4` if present */}
  <div className="px-4">
    {" "}
    {/* list / form / detail body */}
    ...
  </div>
</main>
```

Three things keep the layout consistent across the site:

1. **`mx-auto` + `max-w-md` + `md:max-w-3xl`** — mobile-first
   28 rem column that widens to 48 rem on desktop. Centered at
   every viewport. Adjacent navigations don't "jump" — the eye
   anchors to the same column every page.
2. **Header is a direct child of `<main>` with its own `px-4`**
   — never inside a wrapper that already applies padding.
3. **Asides that carry their own `mx-4`** (e.g.
   `MedicalDisclaimer`, `ConsentBanner`) sit as direct children
   of `<main>`. Don't wrap them in another `px-4` div or you
   get double-indent.

## Exception — `before-after`

`/[locale]/before-after` stays at `max-w-md` (no
`md:max-w-3xl`). M2-07 spec wording: "Mobile-only per spec —
the layout caps at max-w-md even on desktop." Desktop viewers
see the same narrow column on purpose; the surface is a feed
intended for thumb-scroll.

## What broke (M3 sign-off matrix)

The consult page initially shipped:

```tsx
<main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24">
  <div className="px-4 pt-8">
    <ConsultForm /> {/* form rendered its own <header> + <MedicalDisclaimer> */}
  </div>
</main>
```

Two consequences:

1. **No `md:max-w-3xl`** — every other public page widened on
   desktop; the consult column stayed 28 rem. Users
   navigating from `/reviews` (wider) → `/consult` (narrower)
   perceived the consult column as "shifted" because the eye
   was anchored to where the reviews column lived.
2. **Double indent on the medical disclaimer** — the
   disclaimer owns its own `mx-4`. Sitting inside the form,
   which sat inside `<div className="px-4">`, gave it 32 px
   of horizontal padding instead of 16 px. Visually
   inconsistent with every other surface where the disclaimer
   uses the standard 16 px.

## The fix

`app/[locale]/consult/page.tsx` was restructured to mirror
`app/[locale]/before-after/page.tsx`'s pattern:

```tsx
<main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24 md:max-w-3xl">
  <header className="flex flex-col gap-2 px-4 pt-8">...</header>
  <MedicalDisclaimer ... />
  <div className="px-4">
    <ConsultForm ... />   {/* form no longer renders header or disclaimer */}
  </div>
</main>
```

`ConsultForm`'s Labels interface dropped `title` / `subtitle` /
`inputLocaleHint` / `disclaimerBody` / `disclaimerAriaLabel` —
the page owns those now. The form gained `formAriaLabel` (used
only for the `<form aria-label="…">` screen-reader semantics;
no visible h1 inside the form).

## Input affordance fix (related but separate)

The same sign-off matrix surfaced that `Input` / textarea /
`Select` primitives used `bg-ground` (#F7F4F0), only ~4 hex
points darker than the page's `bg-warm` (#FBF8F5). Users
couldn't recognise input boundaries at a glance.

Fix: every text input field uses `bg-paper` (#FFFFFF). The
contrast against `bg-warm` is now obvious. Border
(`border-line` = #ECE8E3) provides the affordance edge.

`bg-ground` stays valid for pill toggles, hover states, and
secondary surfaces — it's the difference between a _content
container_ (acceptable cream) and an _input affordance_
(needs to pop).

## When you add a new public page

1. Use the standard `<main>` class block above (with
   `md:max-w-3xl`) unless the page is intentionally
   mobile-only (document the exception inline).
2. Don't put a `<header>` inside a wrapper that already
   applies `px-4`.
3. Don't wrap `MedicalDisclaimer` / `ConsentBanner` /
   anything-with-`mx-4` inside another padded container.
4. Use the `Input` / `Select` primitives instead of raw
   `<input>` / `<select>` so the `bg-paper` decision can't
   regress.
5. If you write a raw `<textarea>`, copy the same
   `border border-line bg-paper` class fragment used in
   `components/consult/consult-form.tsx`.
