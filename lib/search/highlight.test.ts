import { describe, expect, it } from "vitest";
import { splitForHighlight } from "./highlight";

describe("splitForHighlight", () => {
  it("returns a single text segment when the query is empty", () => {
    expect(splitForHighlight("hello world", "")).toEqual([{ kind: "text", value: "hello world" }]);
  });

  it("returns [] for an empty source", () => {
    expect(splitForHighlight("", "x")).toEqual([]);
  });

  it("trims the query before matching", () => {
    expect(splitForHighlight("hello", "  hello  ")).toEqual([{ kind: "mark", value: "hello" }]);
  });

  it("highlights a single mid-string match", () => {
    expect(splitForHighlight("the cat sat on the mat", "cat")).toEqual([
      { kind: "text", value: "the " },
      { kind: "mark", value: "cat" },
      { kind: "text", value: " sat on the mat" },
    ]);
  });

  it("highlights multiple non-overlapping matches", () => {
    expect(splitForHighlight("ab cd ab ef ab", "ab")).toEqual([
      { kind: "mark", value: "ab" },
      { kind: "text", value: " cd " },
      { kind: "mark", value: "ab" },
      { kind: "text", value: " ef " },
      { kind: "mark", value: "ab" },
    ]);
  });

  it("is case-insensitive but preserves the source's original casing in the mark", () => {
    expect(splitForHighlight("Pico-LASER toning", "laser")).toEqual([
      { kind: "text", value: "Pico-" },
      { kind: "mark", value: "LASER" },
      { kind: "text", value: " toning" },
    ]);
  });

  it("works on Cyrillic source + Latin source uniformly (case-folded toLowerCase)", () => {
    expect(splitForHighlight("Сеульская кожная клиника", "сеуль")).toEqual([
      { kind: "mark", value: "Сеуль" },
      { kind: "text", value: "ская кожная клиника" },
    ]);
  });

  it("works on Hangul source (case-insensitive is a no-op for Hangul, but indexOf is)", () => {
    expect(splitForHighlight("서울 스킨 클리닉", "스킨")).toEqual([
      { kind: "text", value: "서울 " },
      { kind: "mark", value: "스킨" },
      { kind: "text", value: " 클리닉" },
    ]);
  });

  it("returns the full source as text when no match exists", () => {
    expect(splitForHighlight("hello world", "xyz")).toEqual([
      { kind: "text", value: "hello world" },
    ]);
  });

  it("matches consecutive occurrences without dropping characters", () => {
    expect(splitForHighlight("xxxx", "xx")).toEqual([
      { kind: "mark", value: "xx" },
      { kind: "mark", value: "xx" },
    ]);
  });

  // XSS guard — the output is data, not HTML. If a caller renders
  // it correctly (React text nodes / <mark> elements), there's no
  // way for a query containing `<script>` to escape. We assert the
  // output stays as plain strings here so a future implementer
  // can't accidentally inject HTML into a `value`.
  it("returned segments are plain strings — no HTML escaping was attempted", () => {
    const segs = splitForHighlight("hello <script>x</script>", "script");
    for (const s of segs) {
      expect(typeof s.value).toBe("string");
      // The angle brackets stay as-is — escaping is the renderer's job.
      // Confirms we don't HTML-escape behind the caller's back.
    }
    expect(segs.map((s) => s.value).join("")).toBe("hello <script>x</script>");
  });
});
