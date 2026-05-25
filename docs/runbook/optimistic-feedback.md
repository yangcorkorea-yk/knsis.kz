# Optimistic UI feedback for filter / submit interactions

Vercel ICN → IAD function → Supabase EU = 1–2 s round-trip for
Kazakh users on every URL-state change. Without a synchronous
visual reply, taps look dead and users re-tap — which often
inverts their intent (e.g. `toggleFilter` reads the second tap as
the off-switch).

Apply this three-layer pattern to **any** client interaction that
changes server state via `router.push` (filter pills, list sort,
submit buttons that show a result page). M2-02's
`components/discover/filter-bar.tsx` is the reference
implementation.

## Pattern

### 1. `useTransition` to mark the navigation non-urgent

```tsx
const [isPending, startTransition] = useTransition();

function onPillTap(...) {
  startTransition(() => {
    router.push(newUrl);
  });
}
```

`isPending` flips to `true` synchronously when `startTransition`
is called and back to `false` once the new server render commits.
Without `startTransition`, React treats the URL change as urgent
and won't expose the `isPending` flag at all.

### 2. Local optimistic state, scoped to the interaction's axis

React 18 doesn't export `useOptimistic` from the stable channel.
Next.js 14 vendors React canary internally but the installed
`react` package's public types don't include the hook. The
portable substitute:

```tsx
type AxisKey = "area" | "concern" | "language";
type OptimisticMap = Partial<Record<AxisKey, string | null>>;

const [optimistic, setOptimistic] = useState<OptimisticMap>({});

function navigate(key: AxisKey, value: string) {
  const next = toggleFilter(new URLSearchParams(searchParams.toString()), key, value);
  setOptimistic((prev) => ({ ...prev, [key]: next.get(key) }));
  startTransition(() => {
    router.push(buildUrl(next));
  });
}

// Pill reads from optimistic first, URL second.
function effectiveActive(key: AxisKey): string | null {
  return key in optimistic ? (optimistic[key] ?? null) : searchParams.get(key);
}
```

`"key" in optimistic` (not `optimistic[key] !== undefined`) is the
right guard — clearing an axis sets the value to `null`, which is
a valid "intended state" the URL should converge to.

### 3. Clear the overlay once the URL catches up

```tsx
useEffect(() => {
  if (!isPending) setOptimistic({});
}, [isPending]);
```

Without this the optimistic state lingers after back/forward
navigation and the user sees a phantom highlight that doesn't
match the URL.

### 4. Visual pending indicator on the affected element

```tsx
<button
  data-pending={pending ? "true" : undefined}
  className={cn("...", highlighted && "bg-rose-tint ...")}
>
  {children}
  {pending && (
    <span
      aria-hidden="true"
      className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-rose-deep"
    />
  )}
</button>
```

`aria-hidden="true"` on the dot — it's decorative, the
`data-pending` attribute is the machine-readable signal.

A pulsing 6 px dot inside the active element is louder than a
global spinner and doesn't shift layout when the request resolves.
The dot is positioned inside the pill, so the pill keeps
`whitespace-nowrap` and grows by ~10 px during pending — measure
the worst-case width in the active locale (KZ has the longest
labels) before shipping.

## Race condition handling

Rapid re-taps (200 ms apart) used to walk the user's intent
backwards. Under this pattern:

- Each tap calls `setOptimistic((prev) => ({ ...prev, [key]: target }))`
  → the pill always shows the **last** tapped value.
- Each tap calls `startTransition(...)` → React cancels the
  previous transition; only the final `router.push` survives.
- The final URL = `toggleFilter`'s last call, computed against the
  then-current `searchParams.toString()`. No ordering surprises.

If the third tap goes through to the server before the second
completes, that's fine — the optimistic overlay still shows the
right value, and the final URL converges within one navigation.

## When NOT to use it

- Inputs that are **only** form state (text fields not yet
  submitted) — vanilla controlled inputs already feel instant.
- Buttons whose action lives on the same page (toggle a sheet
  open) — that's local state, not a transition.
- Mutations through Server Actions where you want the form to
  block — use `useFormState` instead; it has a different lifecycle.

## When client-side filtering wins over server-side optimistic

The three-layer pattern above is a **mitigation** for slow server
round-trips on read-shaped interactions (filters, sort, search
narrowing). If you can avoid the round-trip altogether, do that
instead.

M2-02 started life as the canonical optimistic-UI example here.
After a sign-off pass on the preview we swapped it for client-side
filtering and the dead-tap class of bugs disappeared — including
the rapid multi-axis race the optimistic pattern still let slip
through (each axis was applied in order but intermediate server
renders surfaced briefly). The criteria that decided the swap:

1. **Bounded dataset.** The full set of items the user can filter
   over is small enough to ship on first load. M2-02 lists
   ~25 treatments + a couple hundred clinics — < 50 KB gzipped.
2. **Filters are projections, not searches.** Pure client-side
   predicates over the bulk dataset reproduce the server's
   where-clause exactly (`matchClinic`, `matchTreatment` in
   `lib/discover/filters.ts`).
3. **Multi-axis combinations.** Optimistic UI resolves one axis at
   a time; rapid taps across **different** axes can still walk
   through intermediate server renders. In-memory math collapses
   that to a single synchronous compose.
4. **No write semantics on the same interaction.** Pill clicks are
   pure reads — they don't change server state.

When all four hold, replace the optimistic pattern with the
**bulk-fetch + client-island** shape:

- **Server component** fetches everything once
  (`force-dynamic` is fine — it's still one round-trip per cold
  load, not per tap). Project only the columns you need; nothing
  PII.
- **Client island** (`components/discover/categories-island.tsx`
  in M2-02) holds the filter state in `useState`, runs
  `useFilterableList` against the bulk data, and re-renders
  synchronously on each tap.
- **URL sync** via `window.history.replaceState` — NOT
  `router.push` / `router.replace`. Both of the latter trigger a
  Next.js re-render of a `force-dynamic` page, which refetches and
  reintroduces the round-trip we just deleted. Listen for
  `popstate` to handle back / forward.
- **Reducer is pure.** `applyToggle(prev, key, value)` composes
  deterministically regardless of how fast the user taps —
  functional `setState` guarantees ordering, no race possible.
- **`useFilterableList`** (`lib/discover/use-filterable-list.ts`)
  memoises `items.filter(predicate)`; declare the predicate at
  module scope so the memo doesn't invalidate on every render.

What you give up:

- A small first-load payload (acceptable when the bulk dataset is
  bounded).
- The grid skeleton no longer appears between filter taps — but
  the whole point is that the grid updates synchronously, so
  there's nothing to skeleton.

What you keep:

- Refresh + share work (URL is still authoritative).
- Back / forward work (popstate listener re-parses the URL).
- SSR-correct first paint (server parses `searchParams` and seeds
  the island's initial state).

The §Pattern above still applies to genuine **write** interactions
(M3-01 consult form steps, submit buttons that mutate server
state). Don't delete it from your toolkit — just stop reaching for
it on pure-read filters when the four criteria above hold.

## Apply to (open work)

Use **bulk-fetch + client-island** (preferred when the four
criteria in the section above hold):

- **M2-04 (Clinics list + tabs)** — verified/Korea/local tabs +
  sort. Bounded dataset, pure projection.
- **M2-06 (Reviews feed)** — filter by treatment / region /
  clinic. Bounded once the candidate clinic set is fetched.
- **M2-08 (Search results)** — submit fetches a bounded result
  page; narrow client-side from there.
- **M5-03 (Admin Leads list)** — heavy filter usage by managers.
  Likely the third caller for the island pattern; extract a
  shared hook then (per CLAUDE.md §6 "no premature abstractions").

Use **optimistic UI** (this section's three-layer pattern) when
the interaction is a write or a true server-only operation:

- **M3-01 (Consult form)** — multi-step form. Each "Next" is a
  navigation that may persist intermediate state; the form should
  feel responsive while the server commits.

## Reference implementations

**Optimistic UI (write-shaped):** no shipped reference yet — the
M2-02 prototype that lived here has been swapped out (see commit
history of `components/discover/filter-bar.tsx`). M3-01 will be
the next shipping example.

**Bulk-fetch + client-island (read-shaped):**

- `app/[locale]/categories/page.tsx` — server component, bulk
  fetch + serialise.
- `components/discover/categories-island.tsx` — state holder,
  `window.history.replaceState` URL sync, `popstate` listener.
- `components/discover/categories-grid.tsx` — `useFilterableList`
  - count aggregation.
- `components/discover/filter-bar.tsx` — stateless pill rows.
- `lib/discover/filters.ts` — `parseFilters`, `applyToggle`,
  `applyClear`, `matchClinic`, `matchTreatment`,
  `filtersToSearchParams` (pure, fully unit-tested).
- `lib/discover/use-filterable-list.ts` — memoised filter hook.
