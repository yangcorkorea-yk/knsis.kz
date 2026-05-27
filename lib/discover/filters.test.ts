import { describe, expect, it } from "vitest";
import {
  applyClear,
  applyToggle,
  CITY_SLUG_MAP,
  CITY_SLUGS,
  CONCERNS,
  type DiscoveryFilters,
  filtersToSearchParams,
  INTERPRETER_LANGS,
  matchClinic,
  matchReview,
  matchTreatment,
  parseFilters,
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

  it("accepts slug-shaped treatment / clinic axes (data-driven, no enum check)", () => {
    expect(parseFilters({ treatment: "pico-laser-toning", clinic: "seoul-skin-clinic" })).toEqual({
      treatment: "pico-laser-toning",
      clinic: "seoul-skin-clinic",
    });
  });

  it("rejects treatment / clinic values that aren't slug-shaped", () => {
    // Defensive — keeps URL injection out of the in-memory matcher.
    expect(parseFilters({ treatment: "../../etc/passwd" })).toEqual({});
    expect(parseFilters({ clinic: "SHOUTING" })).toEqual({});
    expect(parseFilters({ treatment: "spaces are bad" })).toEqual({});
  });
});

describe("filtersToSearchParams", () => {
  it("produces an empty string for an empty filter set", () => {
    expect(filtersToSearchParams({}).toString()).toBe("");
  });

  it("emits keys in canonical order (area, concern, language)", () => {
    expect(
      filtersToSearchParams({ language: "kz", area: "seoul", concern: "skin" }).toString(),
    ).toBe("area=seoul&concern=skin&language=kz");
  });
});

describe("applyToggle", () => {
  it("sets a fresh axis value when nothing was active", () => {
    expect(applyToggle({}, "area", "seoul")).toEqual({ area: "seoul" });
  });

  it("clears the axis when re-toggling the same value (off-switch)", () => {
    expect(applyToggle({ area: "seoul" }, "area", "seoul")).toEqual({});
  });

  it("replaces a different value on the same axis without touching others", () => {
    expect(
      applyToggle({ area: "seoul", concern: "skin", language: "kz" }, "area", "busan"),
    ).toEqual({ area: "busan", concern: "skin", language: "kz" });
  });

  it("drops an unknown incoming value (defends against stale URL state)", () => {
    expect(applyToggle({ area: "seoul" }, "concern", "telepathy")).toEqual({ area: "seoul" });
  });

  // Regression for the race condition that motivated the M2-02
  // client-side filtering refactor (follow-up commit). Under the old
  // server-side path, three taps inside a 1–2 s window could each
  // see a stale searchParams snapshot and write each other over.
  // With this pure reducer + functional setState, the only thing
  // that matters is that successive calls compose deterministically.
  it("composes deterministically across rapid multi-axis taps", () => {
    let state: DiscoveryFilters = {};
    state = applyToggle(state, "area", "seoul");
    state = applyToggle(state, "concern", "skin");
    state = applyToggle(state, "language", "kz");
    expect(state).toEqual({ area: "seoul", concern: "skin", language: "kz" });
    state = applyToggle(state, "area", "seoul");
    expect(state).toEqual({ concern: "skin", language: "kz" });
    state = applyToggle(state, "concern", "lift");
    expect(state).toEqual({ concern: "lift", language: "kz" });
    state = applyToggle(state, "language", "kz");
    expect(state).toEqual({ concern: "lift" });
  });
});

describe("applyClear", () => {
  it("drops the named axis", () => {
    expect(applyClear({ area: "seoul", concern: "skin" }, "area")).toEqual({ concern: "skin" });
  });

  it("returns the same reference when the axis was already absent", () => {
    const prev: DiscoveryFilters = { concern: "skin" };
    expect(applyClear(prev, "area")).toBe(prev);
  });
});

describe("matchClinic", () => {
  const clinic = {
    city: CITY_SLUG_MAP.seoul,
    interpreters: ["kz", "ru"] as const,
    kind: "korea" as const,
  };

  it("matches when no filters constrain the clinic axes", () => {
    expect(matchClinic(clinic, { concern: "skin" })).toBe(true);
  });

  it("matches when area + language both align", () => {
    expect(matchClinic(clinic, { area: "seoul", language: "kz" })).toBe(true);
  });

  it("rejects on area mismatch", () => {
    expect(matchClinic(clinic, { area: "busan" })).toBe(false);
  });

  it("rejects on language mismatch", () => {
    expect(matchClinic(clinic, { language: "kr" })).toBe(false);
  });

  it("rejects when one of two area/language filters fails", () => {
    expect(matchClinic(clinic, { area: "seoul", language: "kr" })).toBe(false);
  });

  it("matches when kind aligns (korea)", () => {
    expect(matchClinic(clinic, { kind: "korea" })).toBe(true);
  });

  it("rejects on kind mismatch (korea clinic, local filter)", () => {
    expect(matchClinic(clinic, { kind: "local" })).toBe(false);
  });

  it("rejects when kind passes but language fails (compound)", () => {
    expect(matchClinic(clinic, { kind: "korea", language: "kr" })).toBe(false);
  });
});

describe("matchTreatment", () => {
  it("matches when no concern filter is set", () => {
    expect(matchTreatment({ category: "skin" }, {})).toBe(true);
  });

  it("matches when concern aligns", () => {
    expect(matchTreatment({ category: "skin" }, { concern: "skin" })).toBe(true);
  });

  it("rejects on concern mismatch", () => {
    expect(matchTreatment({ category: "skin" }, { concern: "lift" })).toBe(false);
  });

  it("ignores area / language filters (those only constrain clinics)", () => {
    expect(matchTreatment({ category: "skin" }, { area: "seoul", language: "kz" })).toBe(true);
  });
});

describe("matchReview", () => {
  const review = {
    treatmentSlug: "pico-laser-toning",
    clinicSlug: "seoul-skin-clinic",
    clinicCity: CITY_SLUG_MAP.seoul,
  };

  it("matches when no filters apply", () => {
    expect(matchReview(review, {})).toBe(true);
  });

  it("matches when area aligns with clinic city", () => {
    expect(matchReview(review, { area: "seoul" })).toBe(true);
  });

  it("rejects on area mismatch", () => {
    expect(matchReview(review, { area: "busan" })).toBe(false);
  });

  it("rejects when filters.area is set but the review's clinicCity is null", () => {
    expect(matchReview({ ...review, clinicCity: null }, { area: "seoul" })).toBe(false);
  });

  it("matches on treatment slug exact", () => {
    expect(matchReview(review, { treatment: "pico-laser-toning" })).toBe(true);
  });

  it("rejects on treatment slug mismatch", () => {
    expect(matchReview(review, { treatment: "botox-jaw" })).toBe(false);
  });

  it("matches on clinic slug exact", () => {
    expect(matchReview(review, { clinic: "seoul-skin-clinic" })).toBe(true);
  });

  it("rejects on clinic slug mismatch", () => {
    expect(matchReview(review, { clinic: "almaty-derma-center" })).toBe(false);
  });

  it("compound: passes only when every set axis aligns", () => {
    expect(
      matchReview(review, {
        area: "seoul",
        treatment: "pico-laser-toning",
        clinic: "seoul-skin-clinic",
      }),
    ).toBe(true);
    expect(
      matchReview(review, {
        area: "seoul",
        treatment: "pico-laser-toning",
        clinic: "almaty-derma-center",
      }),
    ).toBe(false);
  });

  it("ignores clinic / area filters when review's slugs are null (orphan review)", () => {
    // matchReview is strict — null + a set filter = no match
    expect(matchReview({ treatmentSlug: null, clinicSlug: null, clinicCity: null }, {})).toBe(true);
    expect(
      matchReview(
        { treatmentSlug: null, clinicSlug: null, clinicCity: null },
        { treatment: "anything" },
      ),
    ).toBe(false);
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
