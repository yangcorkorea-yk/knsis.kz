/*
 * lib/gallery/mock-cases.test.ts — pin the M2-07 Iteration 3
 * mock dataset shape: trilingual caption + trilingual interview
 * + exactly 4 image entries per case + no PII fields.
 *
 * Plus catalog fidelity for the gallery disclaimer copy.
 */

import { describe, expect, it } from "vitest";
import krMessages from "@/messages/kr.json";
import kzMessages from "@/messages/kz.json";
import ruMessages from "@/messages/ru.json";
import { MOCK_CASES } from "./mock-cases";

const TONE_SET = new Set(["warm", "ground", "rose-tint", "rose-soft", "lavender-soft"]);

describe("MOCK_CASES", () => {
  it("is non-empty (page would render the empty state otherwise)", () => {
    expect(MOCK_CASES.length).toBeGreaterThan(0);
  });

  it("every case has a populated trilingual caption (no KZ-only fallback for RU/KR)", () => {
    for (const c of MOCK_CASES) {
      expect(c.caption.kz, `${c.id} kz`).toBeTruthy();
      expect(c.caption.ru, `${c.id} ru`).toBeTruthy();
      expect(c.caption.kr, `${c.id} kr`).toBeTruthy();
    }
  });

  it("every case has a populated trilingual interview (Iteration 3 trust artefact)", () => {
    for (const c of MOCK_CASES) {
      expect(c.interview.kz, `${c.id} kz`).toBeTruthy();
      expect(c.interview.ru, `${c.id} ru`).toBeTruthy();
      expect(c.interview.kr, `${c.id} kr`).toBeTruthy();
    }
  });

  it("every case has exactly 4 images (2 before + 2 after positions)", () => {
    for (const c of MOCK_CASES) {
      expect(c.images.length, c.id).toBe(4);
    }
  });

  it("every image carries a tone within the allowed enum + a trilingual alt", () => {
    for (const c of MOCK_CASES) {
      for (let i = 0; i < c.images.length; i++) {
        const img = c.images[i]!;
        expect(TONE_SET.has(img.tone), `${c.id}[${i}] tone`).toBe(true);
        expect(img.alt.kz, `${c.id}[${i}] alt.kz`).toBeTruthy();
        expect(img.alt.ru, `${c.id}[${i}] alt.ru`).toBeTruthy();
        expect(img.alt.kr, `${c.id}[${i}] alt.kr`).toBeTruthy();
      }
    }
  });

  it("treatmentSlug + clinicSlug fields are non-empty (page-resolve relies on them)", () => {
    for (const c of MOCK_CASES) {
      expect(c.treatmentSlug.length).toBeGreaterThan(0);
      expect(c.clinicSlug.length).toBeGreaterThan(0);
    }
  });

  it("case slugs are unique (used as React keys + future DB primary key)", () => {
    const seen = new Set<string>();
    for (const c of MOCK_CASES) {
      expect(seen.has(c.slug)).toBe(false);
      seen.add(c.slug);
    }
  });

  it("PII contract: mock cases carry zero personal data (no names, no emails)", () => {
    for (const c of MOCK_CASES) {
      const joined = JSON.stringify(c);
      expect(joined).not.toMatch(/@/);
      expect(Object.keys(c)).not.toContain("userId");
      expect(Object.keys(c)).not.toContain("email");
      expect(Object.keys(c)).not.toContain("phone");
      expect(Object.keys(c)).not.toContain("name");
    }
  });
});

describe("Gallery disclaimer · catalog fidelity", () => {
  // Locale fidelity floor — pins each locale's body against
  // accidental deletion before the M7 native-speaker pass.
  it("KZ copy steers to a licensed doctor (дәрігер)", () => {
    expect(kzMessages.gallery.disclaimer.body).toMatch(/дәрігер/);
    expect(kzMessages.gallery.disclaimer.aria_label.length).toBeGreaterThan(0);
  });

  it("RU copy steers to a licensed doctor (врач)", () => {
    expect(ruMessages.gallery.disclaimer.body).toMatch(/врач/);
    expect(ruMessages.gallery.disclaimer.aria_label.length).toBeGreaterThan(0);
  });

  it("KR copy steers to a licensed doctor (의사)", () => {
    expect(krMessages.gallery.disclaimer.body).toMatch(/의사/);
    expect(krMessages.gallery.disclaimer.aria_label.length).toBeGreaterThan(0);
  });

  it("gallery disclaimer mentions individual variation (results vary framing)", () => {
    expect(kzMessages.gallery.disclaimer.body).toMatch(/жекелей/);
    expect(ruMessages.gallery.disclaimer.body).toMatch(/индивидуально/);
    expect(krMessages.gallery.disclaimer.body).toMatch(/개인에 따라/);
  });

  it("KZ + RU + KR consent banner copy is non-empty", () => {
    expect(kzMessages.gallery.consent_banner.length).toBeGreaterThan(0);
    expect(ruMessages.gallery.consent_banner.length).toBeGreaterThan(0);
    expect(krMessages.gallery.consent_banner.length).toBeGreaterThan(0);
  });
});

describe("Gallery subtitle · M2-polish dev-jargon scrub", () => {
  // The original M2-07 subtitle carried a parenthetical
  // "(mobile optimised)" in each locale — developer jargon
  // that PM stripped at sign-off. Guard against re-introduction.
  it("KZ subtitle has no parenthetical metadata", () => {
    expect(kzMessages.gallery.subtitle).not.toMatch(/\(/);
  });
  it("RU subtitle has no parenthetical metadata", () => {
    expect(ruMessages.gallery.subtitle).not.toMatch(/\(/);
  });
  it("KR subtitle has no parenthetical metadata", () => {
    expect(krMessages.gallery.subtitle).not.toMatch(/\(/);
  });
});
