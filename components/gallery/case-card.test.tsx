/*
 * components/gallery/case-card.test.tsx — Iteration 3 layout.
 *
 * Single-depth feed card: no detail navigation, no slider.
 * What ships: 4-image swipe row + page dots + caption +
 * procedure #tag link + interview blockquote + clinic meta
 * link.
 *
 * Pin the structural contract so a future refactor can't
 * silently drop the interview / image row / link targets.
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
  images: [
    { tone: "warm", alt: { kz: "Бұрын", ru: "До", kr: "전" } },
    { tone: "ground", alt: { kz: "Бұрын", ru: "До", kr: "전" } },
    { tone: "rose-tint", alt: { kz: "Кейін", ru: "После", kr: "후" } },
    { tone: "rose-soft", alt: { kz: "Кейін", ru: "После", kr: "후" } },
  ],
  interview: {
    kz: "Тест Interview KZ",
    ru: "Тест Interview RU",
    kr: "테스트 Interview KR",
  },
  consentedAt: "2026-04-12T10:00:00Z",
};

const LABELS = { interviewLabel: "Interview" };
const TREATMENT_TITLE = { kz: "치료", ru: "Процедура", kr: "시술 KR" };
const CLINIC_NAME = { kz: "Клиника", ru: "Клиника RU", kr: "클리닉 KR" };

function render(locale: "kz" | "ru" | "kr" = "kz") {
  return renderToString(
    <CaseCard
      case_={FIXTURE}
      locale={locale}
      treatmentTitle={TREATMENT_TITLE}
      clinicName={CLINIC_NAME}
      labels={LABELS}
    />,
  );
}

describe("CaseCard (Iteration 3 single-depth feed)", () => {
  it("renders all 4 image placeholders in the swipe row", () => {
    const html = render();
    // Each gradient div appears as its tone class.
    expect(html).toMatch(/from-warm/);
    expect(html).toMatch(/from-ground/);
    expect(html).toMatch(/from-rose-tint/);
    expect(html).toMatch(/from-rose-soft/);
  });

  it("image swipe row hides the scrollbar (uses scrollbar-none utility)", () => {
    const html = render();
    expect(html).toMatch(/scrollbar-none/);
  });

  it("image swipe row uses snap-x snap-mandatory for one-image-per-swipe paging", () => {
    const html = render();
    expect(html).toMatch(/snap-x/);
    expect(html).toMatch(/snap-mandatory/);
  });

  it("page-indicator dots match the image count (4)", () => {
    const html = render();
    const dotMatches = html.match(/h-1\.5 w-1\.5 rounded-full/g) ?? [];
    expect(dotMatches.length).toBe(4);
  });

  it("does NOT render any interactive slider (Iteration 2 artefact removed)", () => {
    const html = render();
    expect(html).not.toContain('role="slider"');
    expect(html).not.toContain("aria-valuemin");
    expect(html).not.toContain("aria-valuenow");
  });

  it("does NOT navigate to a /before-after/[slug] detail (Iteration 2 path retired)", () => {
    const html = render();
    expect(html).not.toContain('href="/kz/before-after/case-test"');
  });

  it("procedure renders as a #tag link to /[locale]/treatments/[slug]", () => {
    const html = render("kz");
    expect(html).toContain('href="/kz/treatments/botox-jaw"');
    // React inserts a comment between adjacent string children ("#" + "치료"),
    // so the # and the title aren't contiguous in the rendered HTML. Assert
    // both fragments are present instead of a single regex.
    expect(html).toContain(">#");
    expect(html).toContain("치료");
  });

  it("clinic meta renders as a link to /[locale]/clinics/[slug]", () => {
    const html = render("kz");
    expect(html).toContain('href="/kz/clinics/seoul-skin-clinic"');
    expect(html).toContain("Клиника");
  });

  it("interview blockquote carries sr-only label prefix + locale-resolved body", () => {
    const html = render("kr");
    expect(html).toMatch(/<blockquote[^>]*>/);
    expect(html).toContain("Interview");
    expect(html).toContain("테스트 Interview KR");
  });

  it("renders the locale-resolved caption", () => {
    const html = render("ru");
    expect(html).toContain("Тест caption RU");
  });

  it("uses ink-mute focus ring on every interactive link (consistent with the rest of the app)", () => {
    const html = render();
    expect(html).toMatch(/focus-visible:ring-ink-mute/);
    expect(html).not.toMatch(/focus-visible:ring-rose/);
  });

  it("orphan case (no treatment / no clinic) still renders images + caption + interview", () => {
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
    expect(html).toContain("Тест Interview KZ");
    expect(html).toMatch(/from-warm/);
  });
});
