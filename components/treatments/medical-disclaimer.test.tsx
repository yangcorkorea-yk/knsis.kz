/*
 * components/treatments/medical-disclaimer.test.tsx
 *
 * Lock down the presentation contract for the launch-blocking
 * disclaimer panel + i18n copy fidelity. The visual contract pins
 * the prototype's inset-card pattern (CLAUDE.md §2 hard rule must
 * be visible on every treatment page). The fidelity tests pin
 * each locale's body string against a regex of medically-meaningful
 * tokens so a future copy edit can't accidentally drop the
 * "consult a licensed doctor" steer.
 *
 * KZ + RU placeholders are pending native-speaker review during
 * the M7 i18n QA pass; until then these regex checks guarantee
 * the disclaimer mentions a licensed doctor in each locale.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import krMessages from "@/messages/kr.json";
import kzMessages from "@/messages/kz.json";
import ruMessages from "@/messages/ru.json";
import { MedicalDisclaimer } from "./medical-disclaimer";

describe("MedicalDisclaimer", () => {
  it("renders the body copy verbatim", () => {
    const html = renderToString(
      <MedicalDisclaimer body="General information; consult a licensed doctor." ariaLabel="x" />,
    );
    expect(html).toContain("General information; consult a licensed doctor.");
  });

  it("is a note landmark with the provided aria-label", () => {
    const html = renderToString(<MedicalDisclaimer body="x" ariaLabel="Medical notice" />);
    expect(html).toContain('role="note"');
    expect(html).toContain('aria-label="Medical notice"');
  });

  it("decorative shield icon carries aria-hidden", () => {
    const html = renderToString(<MedicalDisclaimer body="x" ariaLabel="y" />);
    // The Shield SVG must be present and explicitly hidden from a11y
    expect(html).toMatch(/<svg[^>]*aria-hidden="true"/);
  });

  it("uses the inset-card visual treatment (bg-ground + border-line-soft + rounded-md)", () => {
    const html = renderToString(<MedicalDisclaimer body="x" ariaLabel="y" />);
    expect(html).toMatch(/bg-ground/);
    expect(html).toMatch(/border-line-soft/);
    expect(html).toMatch(/rounded-md/);
  });
});

describe("MedicalDisclaimer · catalog fidelity", () => {
  // The placeholder copy must reference a licensed medical
  // professional in each locale. Native-speaker sign-off lands in
  // M7 i18n QA; these regexes are the floor.
  it("KZ copy mentions a licensed doctor (дәрігер)", () => {
    expect(kzMessages.treatments.disclaimer.body).toMatch(/дәрігер/);
    expect(kzMessages.treatments.disclaimer.aria_label.length).toBeGreaterThan(0);
  });

  it("RU copy mentions a licensed doctor (врач)", () => {
    expect(ruMessages.treatments.disclaimer.body).toMatch(/врач/);
    expect(ruMessages.treatments.disclaimer.aria_label.length).toBeGreaterThan(0);
  });

  it("KR copy mentions a licensed doctor (의사)", () => {
    expect(krMessages.treatments.disclaimer.body).toMatch(/의사/);
    expect(krMessages.treatments.disclaimer.aria_label.length).toBeGreaterThan(0);
  });
});
