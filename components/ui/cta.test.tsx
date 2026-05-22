/*
 * components/ui/cta.test.tsx — regression test for the bug that
 * caused production /kz to 500 with React error #143
 * ("React.Children.only").
 *
 * Root cause:
 *   <Slot>
 *     {icon}      // undefined when not provided
 *     {children}  // <Link>...</Link>
 *   </Slot>
 * compiles to React.createElement(Slot, props, undefined, <Link>).
 * Slot calls React.Children.only on that 2-element array and
 * throws. The fix in cta.tsx now passes only `children` to Slot
 * and drops the icon prop on the asChild path.
 *
 * Lives in renderToString rather than a full JSDOM render so the
 * test stays fast and dep-free.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { CTA } from "./cta";

describe("CTA renders without React.Children.only crash", () => {
  it("asChild + single anchor child (the production bug shape)", () => {
    expect(() =>
      renderToString(
        <CTA asChild>
          <a href="/consult/new">Click</a>
        </CTA>,
      ),
    ).not.toThrow();
  });

  it("asChild renders the wrapped element (not a <button>) with merged classes", () => {
    const html = renderToString(
      <CTA asChild variant="soft" size="md">
        <a href="/x" data-testid="link">
          Click
        </a>
      </CTA>,
    );
    // The output is an <a>, not a <button>; the asChild slot
    // forwarded the CTA's className onto the anchor.
    expect(html).toContain("<a");
    expect(html).not.toContain("<button");
    expect(html).toContain("Click");
    expect(html).toMatch(/class="[^"]*bg-rose-tint/);
  });

  it("plain CTA (no asChild, no icon) — single text child", () => {
    expect(() => renderToString(<CTA>Submit</CTA>)).not.toThrow();
  });

  it("plain CTA with icon — multiple children allowed under <button>", () => {
    expect(() => renderToString(<CTA icon={<span data-icon>★</span>}>Save</CTA>)).not.toThrow();
  });

  it("plain CTA without asChild ignores icon position when not provided", () => {
    const html = renderToString(<CTA>OK</CTA>);
    expect(html).toContain("<button");
    expect(html).toContain("OK");
  });

  it("always emits whitespace-nowrap so button labels never wrap", () => {
    // Production /kr regressed when the KR locale's '검색' label
    // wrapped to two lines under the default whitespace handling.
    // The fix lives in the cva base classes — pin it here so a
    // future refactor doesn't drop it silently.
    const plain = renderToString(<CTA>x</CTA>);
    const asChildHtml = renderToString(
      <CTA asChild>
        <a href="/x">x</a>
      </CTA>,
    );
    expect(plain).toMatch(/class="[^"]*\bwhitespace-nowrap\b/);
    expect(asChildHtml).toMatch(/class="[^"]*\bwhitespace-nowrap\b/);
  });
});
