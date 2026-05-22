import { describe, expect, it } from "vitest";
import { parseCsv } from "./csv";

describe("parseCsv", () => {
  it("parses a basic header + rows", () => {
    const rows = parseCsv("a,b,c\n1,2,3\n4,5,6\n");
    expect(rows).toEqual([
      { a: "1", b: "2", c: "3" },
      { a: "4", b: "5", c: "6" },
    ]);
  });

  it("handles missing trailing newline", () => {
    const rows = parseCsv("a,b\n1,2");
    expect(rows).toEqual([{ a: "1", b: "2" }]);
  });

  it("returns [] for empty input", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("returns [] for header-only input", () => {
    expect(parseCsv("a,b,c\n")).toEqual([]);
  });

  it("preserves quoted commas inside fields", () => {
    const rows = parseCsv(`name,note\nAlice,"hi, there"\n`);
    expect(rows).toEqual([{ name: "Alice", note: "hi, there" }]);
  });

  it("preserves quoted JSON-looking fields (the clinics.csv hours pattern)", () => {
    const rows = parseCsv(`slug,hours\nx,"{""mon"":""10:00-19:00""}"\n`);
    expect(rows).toEqual([{ slug: "x", hours: '{"mon":"10:00-19:00"}' }]);
  });

  it("escapes doubled quotes inside a quoted field", () => {
    const rows = parseCsv(`s\n"he said ""hi"""\n`);
    expect(rows).toEqual([{ s: 'he said "hi"' }]);
  });

  it("supports newlines inside quoted fields", () => {
    const rows = parseCsv(`label,body\na,"line1\nline2"\n`);
    expect(rows).toEqual([{ label: "a", body: "line1\nline2" }]);
  });

  it("skips trailing blank lines (common from text editors)", () => {
    const rows = parseCsv("a\n1\n\n\n");
    expect(rows).toEqual([{ a: "1" }]);
  });

  it("treats missing trailing columns as empty strings", () => {
    const rows = parseCsv("a,b,c\n1,2\n");
    expect(rows).toEqual([{ a: "1", b: "2", c: "" }]);
  });
});
