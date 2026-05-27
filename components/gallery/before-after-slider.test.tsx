/*
 * components/gallery/before-after-slider.test.tsx
 *
 * Lock down the slider's ARIA + visual contract via
 * renderToString. The drag / keyboard interactivity is React
 * state — we exercise it through component logic where possible
 * and pin the static markup the rest of the way.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { BeforeAfterSlider } from "./before-after-slider";

const PROPS = {
  beforeTone: "warm" as const,
  afterTone: "rose-tint" as const,
  beforeLabel: "BEFORE",
  afterLabel: "AFTER",
  ariaLabel: "Compare before and after",
};

describe("BeforeAfterSlider", () => {
  it("rendered root is a slider with min/max and default 50% value", () => {
    const html = renderToString(<BeforeAfterSlider {...PROPS} />);
    expect(html).toContain('role="slider"');
    expect(html).toContain('aria-valuemin="0"');
    expect(html).toContain('aria-valuemax="100"');
    expect(html).toContain('aria-valuenow="50"');
  });

  it("uses the provided aria-label", () => {
    const html = renderToString(<BeforeAfterSlider {...PROPS} />);
    expect(html).toContain('aria-label="Compare before and after"');
  });

  it("is keyboard-focusable (tabIndex=0)", () => {
    const html = renderToString(<BeforeAfterSlider {...PROPS} />);
    expect(html).toMatch(/tabindex="0"/i);
  });

  it("focus ring uses neutral ink-mute (a11y consistent with the rest of the app)", () => {
    const html = renderToString(<BeforeAfterSlider {...PROPS} />);
    expect(html).toMatch(/focus-visible:ring-ink-mute/);
    expect(html).not.toMatch(/focus-visible:ring-rose/);
  });

  it("renders both before and after labels in the placeholder layers", () => {
    const html = renderToString(<BeforeAfterSlider {...PROPS} />);
    expect(html).toContain("BEFORE");
    expect(html).toContain("AFTER");
  });

  it("after layer carries a clip-path at the initial 50% reveal", () => {
    const html = renderToString(<BeforeAfterSlider {...PROPS} />);
    expect(html).toMatch(/clip-path:\s?inset\(0 0 0 50%\)/);
  });

  it("handle bar is positioned at the initial 50% reveal", () => {
    const html = renderToString(<BeforeAfterSlider {...PROPS} />);
    expect(html).toMatch(/left:\s?50%/);
  });

  it("touch-action: none stops mobile browsers from intercepting the drag as a scroll", () => {
    const html = renderToString(<BeforeAfterSlider {...PROPS} />);
    expect(html).toMatch(/touch-none/);
  });
});
