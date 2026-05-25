/*
 * lib/discover/use-filterable-list.test.tsx — smoke test for the
 * memoised in-memory filter hook.
 *
 * Vitest runs in node mode (no jsdom). We exercise the hook through
 * a render-to-string probe component: enough to prove the hook
 * returns the right items and that the predicate / filter are
 * threaded through correctly. The memoisation behaviour itself is a
 * useMemo guarantee — not worth testing.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { useFilterableList } from "./use-filterable-list";

interface Item {
  id: string;
  tag: string;
}

const ITEMS: readonly Item[] = [
  { id: "a", tag: "x" },
  { id: "b", tag: "y" },
  { id: "c", tag: "x" },
];

function byTag(item: Item, filter: { tag?: string }) {
  return !filter.tag || item.tag === filter.tag;
}

function Probe({ filter }: { filter: { tag?: string } }) {
  const filtered = useFilterableList(ITEMS, filter, byTag);
  return (
    <ul>
      {filtered.map((i) => (
        <li key={i.id}>{i.id}</li>
      ))}
    </ul>
  );
}

describe("useFilterableList", () => {
  it("returns every item when the filter is empty", () => {
    const html = renderToString(<Probe filter={{}} />);
    expect(html).toContain("<li>a</li>");
    expect(html).toContain("<li>b</li>");
    expect(html).toContain("<li>c</li>");
  });

  it("returns only matching items when the filter constrains", () => {
    const html = renderToString(<Probe filter={{ tag: "x" }} />);
    expect(html).toContain("<li>a</li>");
    expect(html).not.toContain("<li>b</li>");
    expect(html).toContain("<li>c</li>");
  });

  it("returns the empty set when nothing matches", () => {
    const html = renderToString(<Probe filter={{ tag: "z" }} />);
    expect(html).not.toContain("<li>a</li>");
    expect(html).not.toContain("<li>b</li>");
    expect(html).not.toContain("<li>c</li>");
  });
});
