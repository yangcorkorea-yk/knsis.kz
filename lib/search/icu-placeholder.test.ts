/*
 * lib/search/icu-placeholder.test.ts — regression against the
 * ICU MessageFormat escape trap that swallowed `{query}` on the
 * /search page through PR #11 sign-off.
 *
 * Background: next-intl uses ICU MessageFormat, which treats a
 * single ASCII apostrophe (U+0027) as an escape delimiter. The
 * literal string `'{query}'` becomes `{query}` (the curly braces
 * are no longer a placeholder) instead of substituting the
 * passed-in value. PR #10's KR copy used `'{query}'에 대한 …` and
 * the user saw the literal "{query}" render.
 *
 * Pin the catalog form here so a future translator can't re-
 * introduce ASCII single quotes around an ICU placeholder.
 */

import { describe, expect, it } from "vitest";
import krMessages from "@/messages/kr.json";
import kzMessages from "@/messages/kz.json";
import ruMessages from "@/messages/ru.json";

const LOCALES = {
  kz: kzMessages,
  ru: ruMessages,
  kr: krMessages,
} as const;

describe("search.results_count ICU placeholders", () => {
  for (const [locale, msgs] of Object.entries(LOCALES)) {
    it(`${locale}: contains the {query} placeholder`, () => {
      expect(msgs.search.results_count).toMatch(/\{query\}/);
    });

    it(`${locale}: contains the {count} placeholder`, () => {
      expect(msgs.search.results_count).toMatch(/\{count\}/);
    });

    it(`${locale}: does NOT wrap {query} in ASCII single quotes (ICU escape trap)`, () => {
      // The exact failing form from PR #10: `'{query}'`. ICU would
      // treat the surrounding apostrophes as escape delimiters and
      // emit the literal string `{query}` instead of substituting.
      expect(msgs.search.results_count).not.toMatch(/'\{query\}'/);
    });

    it(`${locale}: does NOT wrap {count} in ASCII single quotes`, () => {
      expect(msgs.search.results_count).not.toMatch(/'\{count\}'/);
    });
  }
});
