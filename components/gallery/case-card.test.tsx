/*
 * components/gallery/case-card.test.tsx
 *
 * M2-polish revision: list card no longer embeds an interactive
 * slider. The card wraps in a <Link> to the detail page
 * (/[locale]/before-after/[slug]) and renders a static split
 * preview (two tone halves + a thin centre divider) plus
 * caption + meta. This test pins the new shape so a future
 * refactor can't silently re-introduce per-card sliders.
 */

import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import type { GalleryCase } from "@/lib/gallery/mock-cases";
import { CaseCard } from "./case-card";

const FIXTURE: GalleryCase = {
  id: "ba-test-0001",
  slug: "case-test",
  treatmentSlug: "botox-jaw",
  clinicSlug: "seoul-skin-clinic",
  caption: {
    kz: "Тест caption KZ",
    ru: "Тест caption RU",
    kr: "테스트 caption KR",
  },
  beforeTone: "warm",
  afterTone: "rose-tint",
  consentedAt: "2026-04-12T10:00:00Z",
};

const LABELS = {
  before: "BEFORE",
  after: "AFTER",
  captionLabel: "Caption",
};

const TREATMENT_TITLE = { kz: "치료", ru: "Процедура", kr: "시술" };
const CLINIC_NAME = { kz: "Клиника", ru: "Клиника RU", kr: "클리닉" };

describe("CaseCard (list shape — M2-polish revision)", () => {
  it("wraps in a Link to /[locale]/before-after/[slug]", () => {
    const html = renderToString(
      <CaseCard
        case_={FIXTURE}
        locale="kz"
        treatmentTitle={TREATMENT_TITLE}
        clinicName={CLINIC_NAME}
        labels={LABELS}
      />,
    );
    expect(html).toContain('href="/kz/before-after/case-test"');
  });

  it("does NOT render any interactive slider markup", () => {
    const html = renderToString(
      <CaseCard
        case_={FIXTURE}
        locale="kz"
        treatmentTitle={TREATMENT_TITLE}
        clinicName={CLINIC_NAME}
        labels={LABELS}
      />,
    );
    // The slider's distinguishing markers — never on a list card.
    expect(html).not.toContain('role="slider"');
    expect(html).not.toContain("aria-valuemin");
    expect(html).not.toContain("aria-valuenow");
  });

  it("renders the static split preview with both BEFORE and AFTER labels", () => {
    const html = renderToString(
      <CaseCard
        case_={FIXTURE}
        locale="kz"
        treatmentTitle={TREATMENT_TITLE}
        clinicName={CLINIC_NAME}
        labels={LABELS}
      />,
    );
    expect(html).toContain("BEFORE");
    expect(html).toContain("AFTER");
  });

  it("renders the locale-resolved caption", () => {
    const html = renderToString(
      <CaseCard
        case_={FIXTURE}
        locale="kr"
        treatmentTitle={TREATMENT_TITLE}
        clinicName={CLINIC_NAME}
        labels={LABELS}
      />,
    );
    expect(html).toContain("테스트 caption KR");
  });

  it("uses ink-mute focus ring (consistent with the rest of the app)", () => {
    const html = renderToString(
      <CaseCard
        case_={FIXTURE}
        locale="kz"
        treatmentTitle={TREATMENT_TITLE}
        clinicName={CLINIC_NAME}
        labels={LABELS}
      />,
    );
    expect(html).toMatch(/focus-visible:ring-ink-mute/);
    expect(html).not.toMatch(/focus-visible:ring-rose/);
  });

  it("orphan case (no treatment / no clinic) still renders preview + caption", () => {
    const html = renderToString(
      <CaseCard
        case_={FIXTURE}
        locale="kz"
        treatmentTitle={null}
        clinicName={null}
        labels={LABELS}
      />,
    );
    expect(html).toContain("Тест caption KZ");
    expect(html).toContain("BEFORE");
    expect(html).toContain("AFTER");
  });
});
