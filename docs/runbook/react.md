# React traps

Component-level bugs that bit us once. Add new entries as they're
discovered.

## `React.Children.only` from a Radix `<Slot>` (error #143)

`<Slot>` accepts **exactly one** child. JSX like

```tsx
<Slot {...props}>
  {icon} // ← undefined when not provided
  {children}
</Slot>
```

compiles to `React.createElement(Slot, props, icon, children)` — two
positional children. Even when `icon` is `undefined`, React keeps the
array `[undefined, <Link>]` (it does **not** auto-filter the array).
Slot's `React.Children.only(...)` throws with the minified message:

```
Error: Minified React error #143
React.Children.only expected to receive a single React element child.
```

The Vercel function log shows recursive `eh / e / ek` frames inside
`next-server/app-page.runtime.prod.js` — that's the React renderer
unwinding through the failing Slot.

**Fix pattern.** Branch the render so Slot only ever sees one child:

```tsx
if (asChild) {
  return <Slot ...props>{children}</Slot>;
}
return (
  <button ...props>
    {icon}
    {children}
  </button>
);
```

`<button>` accepts multiple children — only `<Slot>` is strict. The
loss is that `asChild` + `icon` no longer compose; the wrapped element
(usually a `<Link>`) owns its own content.

**Regression test recipe** (no JSDOM needed):

```tsx
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CTA } from "./cta";

it("asChild + single child doesn't trip Children.only", () => {
  expect(() =>
    renderToString(
      <CTA asChild>
        <a href="/x">click</a>
      </CTA>,
    ),
  ).not.toThrow();
});
```

If `<CTA asChild>` ever regrows multi-child output, this fails first.

Encountered after the M2-01 push to production. Latent in M1-05 too
(`/me`) but only surfaced once the Home page brought a new asChild
caller in front of the first reviewer.
