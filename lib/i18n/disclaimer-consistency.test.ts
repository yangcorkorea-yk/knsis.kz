/*
 * lib/i18n/disclaimer-consistency.test.ts — aggregate guard
 * across every M2 surface that carries a MedicalDisclaimer.
 *
 * The per-surface fidelity tests already pin that each locale
 * mentions a doctor (의사 / врач / дәрігер); they DON'T catch
 * the "면허" regression because "면허 의사" still matches /의사/.
 *
 * PR #11 sign-off surfaced exactly this gap — three KR surfaces
 * (treatments / clinics / reviews) had been refactored away from
 * "면허 의사" → "의사" in a7c26df, but the existing tests
 * couldn't have caught a re-introduction. This file is the
 * cross-surface guard.
 *
 * Adding a new surface? Push its disclaimer key onto the
 * SURFACES array. The test loops every locale × every surface.
 */

import { describe, expect, it } from "vitest";
import krMessages from "@/messages/kr.json";
import kzMessages from "@/messages/kz.json";
import ruMessages from "@/messages/ru.json";

interface Catalog {
  treatments: { disclaimer: { body: string; aria_label: string } };
  clinics: { disclaimer: { body: string; aria_label: string } };
  reviews: { disclaimer: { body: string; aria_label: string } };
  search: { disclaimer: { body: string; aria_label: string } };
  gallery: { disclaimer: { body: string; aria_label: string } };
}

const LOCALES: { name: string; messages: Catalog }[] = [
  { name: "kz", messages: kzMessages as unknown as Catalog },
  { name: "ru", messages: ruMessages as unknown as Catalog },
  { name: "kr", messages: krMessages as unknown as Catalog },
];

const SURFACES = ["treatments", "clinics", "reviews", "search", "gallery"] as const;

describe("MedicalDisclaimer · cross-surface consistency", () => {
  // M2-polish PM decision: KR disclaimer copy drops the "면허"
  // qualifier on every surface. The per-surface fidelity tests
  // only assert "의사" is present; they wouldn't catch "면허
  // 의사" silently reappearing.
  it("KR disclaimer bodies never contain '면허' (M2-polish PM decision)", () => {
    for (const surface of SURFACES) {
      const body = krMessages[surface].disclaimer.body;
      expect(body, `kr.${surface}.disclaimer.body`).not.toMatch(/면허/);
    }
  });

  it("every disclaimer body + aria_label is non-empty across every locale × surface", () => {
    for (const { name, messages } of LOCALES) {
      for (const surface of SURFACES) {
        const d = messages[surface].disclaimer;
        expect(d.body.length, `${name}.${surface}.disclaimer.body`).toBeGreaterThan(0);
        expect(d.aria_label.length, `${name}.${surface}.disclaimer.aria_label`).toBeGreaterThan(0);
      }
    }
  });

  // Defensive: every locale must mention its language's doctor noun
  // on every surface. Re-stated from the per-surface tests so an
  // operator skimming this file doesn't need to chase five other
  // suites to understand the full contract.
  it("every locale × surface mentions the locale's doctor noun", () => {
    const NOUN: Record<string, RegExp> = { kz: /дәрігер/, ru: /врач/, kr: /의사/ };
    for (const { name, messages } of LOCALES) {
      for (const surface of SURFACES) {
        expect(messages[surface].disclaimer.body, `${name}.${surface}`).toMatch(NOUN[name]!);
      }
    }
  });
});

describe("ICU placeholder catalog hygiene", () => {
  // PR #10 shipped `'{query}'` (ASCII apostrophes around an ICU
  // placeholder) and 51197ea fixed it. The fix-specific test in
  // `lib/search/icu-placeholder.test.ts` covers search.results_count
  // only. This sweeps every string in every catalog to catch the
  // same trap appearing in a future key.
  const ICU_ESCAPE_TRAP = /'\{[a-zA-Z_]+\}'/;

  it("no catalog key wraps an ICU placeholder in ASCII single quotes", () => {
    for (const { name, messages } of LOCALES) {
      walk(messages as unknown as Record<string, unknown>, name);
    }

    function walk(node: Record<string, unknown>, path: string): void {
      for (const [k, v] of Object.entries(node)) {
        const here = `${path}.${k}`;
        if (typeof v === "string") {
          expect(v.match(ICU_ESCAPE_TRAP), `${here} = ${JSON.stringify(v)}`).toBeNull();
        } else if (v && typeof v === "object" && !Array.isArray(v)) {
          walk(v as Record<string, unknown>, here);
        }
      }
    }
  });
});
