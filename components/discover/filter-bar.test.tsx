/*
 * components/discover/filter-bar.test.tsx — Pill primitive lockdown.
 *
 * FilterBar itself is stateless after the client-side filtering
 * refactor — its composition with <CategoriesIsland> is covered by
 * the applyToggle / applyClear reducer tests in lib/discover/
 * filters.test.ts, which exercise the rapid multi-axis tap sequence
 * the old useTransition/optimistic UI tests were defending against.
 *
 * Here we just freeze the rendered output of the two pill states so
 * a future style refactor can't silently drop the active treatment
 * (rose tint) or break the KZ long-label whitespace-nowrap defence.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pill } from "./filter-bar";

describe("Pill", () => {
  it("idle (not highlighted) renders text without rose styling", () => {
    const html = renderToString(<Pill highlighted={false}>Seoul</Pill>);
    expect(html).toContain("Seoul");
    expect(html).not.toMatch(/bg-rose-tint/);
  });

  it("highlighted renders with rose tint + rose border", () => {
    const html = renderToString(<Pill highlighted={true}>Seoul</Pill>);
    expect(html).toMatch(/class="[^"]*bg-rose-tint/);
    expect(html).toMatch(/class="[^"]*border-rose/);
  });

  it("pill body always has whitespace-nowrap (KZ long-label defence)", () => {
    const html = renderToString(<Pill highlighted={false}>Алматыдағы клиникалар</Pill>);
    expect(html).toMatch(/class="[^"]*whitespace-nowrap/);
  });

  it("renders as a type=button element (no implicit form submit)", () => {
    const html = renderToString(<Pill highlighted={false}>Seoul</Pill>);
    expect(html).toMatch(/<button[^>]*type="button"/);
  });
});
