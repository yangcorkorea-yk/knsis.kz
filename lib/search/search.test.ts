import { describe, expect, it } from "vitest";
import {
  search,
  type SearchableClinic,
  type SearchableReview,
  type SearchableTreatment,
} from "./search";

const TX_1: SearchableTreatment = {
  id: "t1",
  slug: "pico-laser-toning",
  title: { kz: "Пико-лазерлік тонинг", ru: "Пико-лазерный тонинг", kr: "피코 레이저 토닝" },
  summary: {
    kz: "Меланин дақтары",
    ru: "Меланиновые пятна",
    kr: "멜라닌 색소",
  },
  category: "pigment",
};

const TX_2: SearchableTreatment = {
  id: "t2",
  slug: "botox-jaw",
  title: { kz: "Жақ ботоксы", ru: "Ботокс жевательных мышц", kr: "턱 보톡스" },
  summary: { kz: "V-форма", ru: "V-форма", kr: "V라인" },
  category: "botox",
};

const CL_1: SearchableClinic = {
  id: "c1",
  slug: "seoul-skin-clinic",
  name: { kz: "Сеул тері", ru: "Сеульская кожная", kr: "서울 스킨" },
  kind: "korea",
  city: { kz: "Сеул", ru: "Сеул", kr: "서울" },
};

const RV_1: SearchableReview = {
  id: "r1",
  code: "KB-RV-0001",
  body: { kz: "Жақсы тәжірибе", ru: "Хороший опыт", kr: "좋은 경험" },
  rating: 5,
  customerInitial: "Ә",
  clinicSlug: "seoul-skin-clinic",
  clinicName: { kz: "Сеул тері", ru: "Сеульская кожная", kr: "서울 스킨" },
  treatmentSlug: "pico-laser-toning",
  treatmentTitle: {
    kz: "Пико-лазерлік тонинг",
    ru: "Пико-лазерный тонинг",
    kr: "피코 레이저 토닝",
  },
};

const INPUT = { treatments: [TX_1, TX_2], clinics: [CL_1], reviews: [RV_1] };

describe("search", () => {
  it("returns empty result + totalCount=0 for an empty query", () => {
    expect(search("", INPUT)).toEqual({
      treatments: [],
      clinics: [],
      reviews: [],
      totalCount: 0,
    });
  });

  it("returns empty result for a whitespace-only query (no false-positive on every row)", () => {
    expect(search("   ", INPUT).totalCount).toBe(0);
  });

  it("matches a treatment title in the user's own locale (kr)", () => {
    const out = search("피코", INPUT);
    expect(out.treatments.map((t) => t.slug)).toEqual(["pico-laser-toning"]);
    // No clinic has 피코; review carries it via denormalised treatmentTitle.
    expect(out.totalCount).toBe(2);
    expect(out.reviews).toHaveLength(1);
  });

  it("matches a treatment summary in a different locale than the user's preference", () => {
    // KZ user searching "Меланин" hits TX_1.summary.ru (cross-locale match
    // is intentional — the user might be hunting for a known foreign term).
    expect(search("Меланин", INPUT).treatments.map((t) => t.slug)).toEqual(["pico-laser-toning"]);
  });

  it("matches a clinic city (cross-locale)", () => {
    // "Сеул" appears on clinic.city.kz/ru + treatment via review.clinicName etc.
    const out = search("Сеул", INPUT);
    expect(out.clinics.map((c) => c.slug)).toContain("seoul-skin-clinic");
  });

  it("matches a clinic name in Korean", () => {
    expect(search("서울", INPUT).clinics.map((c) => c.slug)).toEqual(["seoul-skin-clinic"]);
  });

  it("matches a review body in Russian", () => {
    expect(search("опыт", INPUT).reviews.map((r) => r.code)).toEqual(["KB-RV-0001"]);
  });

  it("matches a review via its denormalised clinic name", () => {
    // The clinic name 'Сеульская' lives both on the standalone Clinic
    // entry and as r.clinicName — both hit.
    const out = search("Сеульская", INPUT);
    expect(out.clinics).toHaveLength(1);
    expect(out.reviews).toHaveLength(1);
  });

  it("matches are case-insensitive on Cyrillic + Latin", () => {
    expect(search("СЕУЛ", INPUT).clinics).toHaveLength(1);
    expect(search("seoul-SKIN", INPUT).clinics).toHaveLength(0); // slug isn't indexed
  });

  it("non-matching query returns totalCount 0", () => {
    expect(search("xyz123", INPUT)).toEqual({
      treatments: [],
      clinics: [],
      reviews: [],
      totalCount: 0,
    });
  });

  it("totalCount sums across all three sections", () => {
    const out = search("Сеул", INPUT);
    expect(out.totalCount).toBe(out.treatments.length + out.clinics.length + out.reviews.length);
  });
});
