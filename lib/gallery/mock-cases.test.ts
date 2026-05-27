/*
 * lib/gallery/mock-cases.test.ts — pin the M2-07 mock dataset
 * shape so a future implementer can't accidentally land a case
 * without a trilingual caption, drop a referenced slug, or
 * smuggle PII through.
 *
 * Plus catalog fidelity for the gallery disclaimer copy — same
 * shape as the treatment / clinic / review fidelity tests.
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

  it("treatmentSlug + clinicSlug fields are non-empty (page-resolve relies on them)", () => {
    for (const c of MOCK_CASES) {
      expect(c.treatmentSlug.length).toBeGreaterThan(0);
      expect(c.clinicSlug.length).toBeGreaterThan(0);
    }
  });

  it("beforeTone + afterTone are within the allowed enum (slider colour table)", () => {
    for (const c of MOCK_CASES) {
      expect(TONE_SET.has(c.beforeTone), `${c.id} before`).toBe(true);
      expect(TONE_SET.has(c.afterTone), `${c.id} after`).toBe(true);
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
    // Walk every string in every case looking for @ (emails) or
    // any field that would smuggle a real name through the type.
    for (const c of MOCK_CASES) {
      const joined = JSON.stringify(c);
      expect(joined).not.toMatch(/@/);
      // No `userId`, `email`, `phone`, or `name` keys at the case level.
      expect(Object.keys(c)).not.toContain("userId");
      expect(Object.keys(c)).not.toContain("email");
      expect(Object.keys(c)).not.toContain("phone");
      expect(Object.keys(c)).not.toContain("name");
    }
  });
});

describe("Gallery disclaimer · catalog fidelity", () => {
  // Same shape as the treatment / clinic / review disclaimer
  // fidelity tests. Locks each locale against accidental
  // deletion before the M7 native-speaker pass.
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
    // The gallery disclaimer's distinguishing wording vs the
    // treatment / clinic / search versions is the "results vary
    // by individual" framing. Pin per locale.
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
