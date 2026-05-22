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

## Apply to (open work)

- **M2-04 (Clinics list + tabs)** — verified/Korea/local tabs +
  sort. Same pattern; tabs are pills.
- **M2-06 (Reviews feed)** — filter by treatment / region /
  clinic.
- **M2-08 (Search results)** — query input + result page. The
  `<input>` already feels instant; the **submit** button + result
  fetch needs this pattern.
- **M3-01 (Consult form)** — multi-step form with photo upload.
  Each step's "Next" is a navigation; same shape.
- **M5-03 (Admin Leads list)** — heavy filter usage by managers.
  Same shape; consider extracting the pattern into a
  `useOptimisticFilter()` hook when the third caller lands (per
  CLAUDE.md §6 "no premature abstractions").

## Reference implementation

`components/discover/filter-bar.tsx` — three pill rows (Area /
Concern / Language) wired to URL state with this pattern.
`components/discover/filter-bar.test.tsx` covers the four Pill
visual states. Both files arrived in M2-02 fix commit `3af5db7`.
