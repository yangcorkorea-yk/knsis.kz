/*
 * components/discover/filter-bar.test.tsx — focused unit tests for
 * the Pill primitive. The FilterBar composition (useTransition +
 * useOptimistic-shim + next/navigation) is verified manually on the
 * preview; here we lock in the rendered output of the four pill
 * states so a future style refactor doesn't drop the pending
 * indicator silently.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { Pill } from "./filter-bar";

describe("Pill", () => {
  it("idle (not highlighted, not pending) renders without dot", () => {
    const html = renderToString(
      <Pill highlighted={false} pending={false}>
        Seoul
      </Pill>,
    );
    expect(html).toContain("Seoul");
    expect(html).not.toContain("animate-pulse");
    expect(html).not.toContain('data-pending="true"');
  });

  it("highlighted but not pending → rose styling, no dot", () => {
    const html = renderToString(
      <Pill highlighted={true} pending={false}>
        Seoul
      </Pill>,
    );
    expect(html).toMatch(/class="[^"]*bg-rose-tint/);
    expect(html).not.toContain("animate-pulse");
  });

  it("highlighted + pending → rose styling AND pulsing dot", () => {
    const html = renderToString(
      <Pill highlighted={true} pending={true}>
        Seoul
      </Pill>,
    );
    expect(html).toMatch(/class="[^"]*bg-rose-tint/);
    expect(html).toContain("animate-pulse");
    expect(html).toContain('data-pending="true"');
  });

  it("pending dot is aria-hidden (decorative)", () => {
    const html = renderToString(
      <Pill highlighted={true} pending={true}>
        Seoul
      </Pill>,
    );
    expect(html).toMatch(/aria-hidden="true"/);
  });

  it("pill body always has whitespace-nowrap (KZ long-label defence)", () => {
    const html = renderToString(
      <Pill highlighted={false} pending={false}>
        Алматыдағы клиникалар
      </Pill>,
    );
    expect(html).toMatch(/class="[^"]*whitespace-nowrap/);
  });
});
