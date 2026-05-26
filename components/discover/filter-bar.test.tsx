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

  // Regression for the off-switch focus-residue defect: after a pill
  // is tapped to clear an axis, :focus-visible stays on the button
  // until the user clicks elsewhere. A rose-tinted focus ring there
  // looks like a lingering "still active" state. Neutral ink-mute
  // keeps the indicator visible (WCAG 1.4.11 — 3.28:1 vs white,
  // passes AA) but un-confusable with the active rose treatment.
  it("focus ring uses neutral ink-mute (no rose tone in focus state)", () => {
    const html = renderToString(<Pill highlighted={false}>Seoul</Pill>);
    expect(html).toMatch(/focus-visible:ring-ink-mute/);
    expect(html).not.toMatch(/focus-visible:ring-rose/);
  });

  // Regression for the first-pill-flush defect on scrolling rows.
  // Container padding on overflow:auto rows isn't reliable across
  // browsers, and the prior arbitrary-variant fix
  // ([&>*:first-child]:ml-4) was not emitted by Tailwind's content
  // scanner. The plumbing now lives on the Pill itself via core
  // first: / last: variants, which always emit.
  it("first-child Pill carries first:ml-4 (scroll row left gutter)", () => {
    const html = renderToString(<Pill highlighted={false}>Seoul</Pill>);
    expect(html).toMatch(/first:ml-4/);
  });

  it("last-child Pill carries last:mr-4 (scroll row right gutter)", () => {
    const html = renderToString(<Pill highlighted={false}>Seoul</Pill>);
    expect(html).toMatch(/last:mr-4/);
  });
});
