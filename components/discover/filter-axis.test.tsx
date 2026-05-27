/*
 * components/discover/filter-axis.test.tsx — pin the threshold
 * behaviour of the shared FilterAxis primitive: ≤ 7 options →
 * pill markup, > 7 options → native <select> markup.
 *
 * Plus the scrollbar-none class on the pill row (M2-polish runbook
 * `docs/runbook/horizontal-scroll-pills.md`).
 */

import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { FilterAxis, PILL_THRESHOLD } from "./filter-axis";

function makeOptions(n: number): { value: string; label: string }[] {
  return Array.from({ length: n }, (_, i) => ({
    value: `opt-${i}`,
    label: `Option ${i}`,
  }));
}

function render(node: React.ReactNode) {
  return renderToString(
    <NextIntlClientProvider locale="kz" messages={{}}>
      {node}
    </NextIntlClientProvider>,
  );
}

describe("FilterAxis", () => {
  it(`renders pill markup when options.length === PILL_THRESHOLD (${PILL_THRESHOLD})`, () => {
    const html = render(
      <FilterAxis
        axisId="t-pill"
        groupLabel="Group"
        allLabel="All"
        active={null}
        options={makeOptions(PILL_THRESHOLD)}
        onSelect={() => {}}
        onClear={() => {}}
      />,
    );
    expect(html).toContain('type="button"');
    expect(html).not.toContain("<select");
  });

  it("renders <select> markup when options.length > PILL_THRESHOLD", () => {
    const html = render(
      <FilterAxis
        axisId="t-dropdown"
        groupLabel="Group"
        allLabel="All"
        active={null}
        options={makeOptions(PILL_THRESHOLD + 1)}
        onSelect={() => {}}
        onClear={() => {}}
      />,
    );
    expect(html).toContain("<select");
    expect(html).not.toContain('type="button"');
  });

  it("pill row carries scrollbar-none (chrome bar hidden by M2-polish runbook)", () => {
    const html = render(
      <FilterAxis
        axisId="t-pill"
        groupLabel="Group"
        allLabel="All"
        active={null}
        options={makeOptions(3)}
        onSelect={() => {}}
        onClear={() => {}}
      />,
    );
    expect(html).toMatch(/scrollbar-none/);
  });

  it("dropdown contains the 'All' default option + every passed option", () => {
    const opts = makeOptions(10);
    const html = render(
      <FilterAxis
        axisId="t"
        groupLabel="Group"
        allLabel="EVERYTHING"
        active={null}
        options={opts}
        onSelect={() => {}}
        onClear={() => {}}
      />,
    );
    expect(html).toContain("EVERYTHING");
    for (const o of opts) {
      expect(html).toContain(o.label);
    }
  });

  it("pill row renders the locale-scoped group label as an h3", () => {
    const html = render(
      <FilterAxis
        axisId="t"
        groupLabel="My Group Label"
        allLabel="All"
        active={null}
        options={makeOptions(3)}
        onSelect={() => {}}
        onClear={() => {}}
      />,
    );
    expect(html).toMatch(/<h3[^>]*>My Group Label<\/h3>/);
  });

  it("focus ring on dropdown uses ink-mute (consistent with the rest of the app)", () => {
    const html = render(
      <FilterAxis
        axisId="t"
        groupLabel="Group"
        allLabel="All"
        active={null}
        options={makeOptions(10)}
        onSelect={() => {}}
        onClear={() => {}}
      />,
    );
    expect(html).toMatch(/focus-visible:ring-ink-mute/);
    expect(html).not.toMatch(/focus-visible:ring-rose/);
  });
});
