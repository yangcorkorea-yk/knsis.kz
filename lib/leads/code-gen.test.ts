import { describe, expect, it } from "vitest";
import { makeLeadCode } from "./code-gen";

describe("makeLeadCode", () => {
  it("formats as KB-{year}-{4-digit suffix}", () => {
    const code = makeLeadCode({
      now: () => new Date("2026-05-28T00:00:00Z"),
      random: () => 427,
    });
    expect(code).toBe("KB-2026-0427");
  });

  it("zero-pads small suffixes to 4 digits", () => {
    expect(
      makeLeadCode({
        now: () => new Date("2026-01-01Z"),
        random: () => 7,
      }),
    ).toBe("KB-2026-0007");
  });

  it("wraps suffixes that overshoot the 0000..9999 range", () => {
    expect(
      makeLeadCode({
        now: () => new Date("2026-01-01Z"),
        random: () => 12345,
      }),
    ).toBe("KB-2026-2345");
  });

  it("uses the current calendar year from the clock", () => {
    expect(makeLeadCode({ now: () => new Date("2027-12-31T23:59:59Z"), random: () => 1 })).toBe(
      "KB-2027-0001",
    );
  });
});
