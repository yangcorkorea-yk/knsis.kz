import { describe, expect, it } from "vitest";
import {
  CITY_SLUG_MAP,
  CITY_SLUGS,
  CONCERNS,
  INTERPRETER_LANGS,
  parseFilters,
  toggleFilter,
} from "./filters";

describe("parseFilters", () => {
  it("returns empty object for empty searchParams", () => {
    expect(parseFilters({})).toEqual({});
  });

  it("accepts a fully populated valid set", () => {
    expect(parseFilters({ area: "seoul", concern: "lift", language: "kz" })).toEqual({
      area: "seoul",
      concern: "lift",
      language: "kz",
    });
  });

  it("silently drops an unknown city slug", () => {
    expect(parseFilters({ area: "paris" })).toEqual({});
  });

  it("silently drops an unknown TreatmentCategory", () => {
    expect(parseFilters({ concern: "telepathy" })).toEqual({});
  });

  it("silently drops an unknown interpreter lang", () => {
    expect(parseFilters({ language: "klingon" })).toEqual({});
  });

  it("takes the first item when a key has an array value", () => {
    expect(parseFilters({ area: ["busan", "seoul"] })).toEqual({ area: "busan" });
  });

  it("ignores undefined / non-string / empty values", () => {
    expect(parseFilters({ area: undefined, concern: "", language: [] })).toEqual({});
  });

  it("preserves valid axes when one is unknown (no all-or-nothing)", () => {
    expect(parseFilters({ area: "seoul", concern: "nope" })).toEqual({ area: "seoul" });
  });
});

describe("toggleFilter", () => {
  it("sets a fresh axis value when the URL had no value", () => {
    const next = toggleFilter(new URLSearchParams(), "area", "seoul");
    expect(next.toString()).toBe("area=seoul");
  });

  it("clears the axis when toggling the same value (off-switch)", () => {
    const next = toggleFilter(new URLSearchParams("area=seoul"), "area", "seoul");
    expect(next.toString()).toBe("");
  });

  it("replaces (not appends) a different value on the same axis", () => {
    const next = toggleFilter(new URLSearchParams("area=seoul"), "area", "busan");
    expect(next.get("area")).toBe("busan");
    expect(Array.from(next.entries())).toHaveLength(1);
  });

  it("does not touch the other axes", () => {
    const next = toggleFilter(
      new URLSearchParams("area=seoul&concern=lift&language=kz"),
      "concern",
      "skin",
    );
    expect(next.get("area")).toBe("seoul");
    expect(next.get("concern")).toBe("skin");
    expect(next.get("language")).toBe("kz");
  });
});

describe("CITY_SLUG_MAP", () => {
  it("covers every CITY_SLUGS entry", () => {
    for (const slug of CITY_SLUGS) {
      expect(CITY_SLUG_MAP[slug]).toBeTruthy();
    }
  });
});

describe("static enums", () => {
  it("CONCERNS lists exactly the 9 TreatmentCategory values used by the seed", () => {
    expect([...CONCERNS].sort()).toEqual(
      ["skin", "botox", "filler", "lift", "acne", "pigment", "hair", "cosmetic", "scalp"].sort(),
    );
  });

  it("INTERPRETER_LANGS includes the 4 codes seeded on clinics", () => {
    expect([...INTERPRETER_LANGS].sort()).toEqual(["kz", "ru", "kr", "en"].sort());
  });
});
