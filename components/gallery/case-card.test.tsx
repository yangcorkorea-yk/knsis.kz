/*
 * components/gallery/case-card.test.tsx — Iteration 3b layout.
 *
 * Single-depth feed card with 4 small thumbnails in a row at
 * the top edge (강남언니 캡처 4 pattern). Each thumbnail is a
 * <button> that opens an <ImageModal> lightbox. No swipe-row,
 * no dot indicators, no detail navigation, no Iteration-2 slider.
 *
 * Pin the structural contract so a future refactor can't
 * silently drop the thumbnail row / link targets / interview
 * blockquote / modal trigger affordance.
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
    { tone: "warm", alt: { kz: "Бұрын 1", ru: "До 1", kr: "전 1" } },
    { tone: "ground", alt: { kz: "Бұрын 2", ru: "До 2", kr: "전 2" } },
    { tone: "rose-tint", alt: { kz: "Кейін 1", ru: "После 1", kr: "후 1" } },
    { tone: "rose-soft", alt: { kz: "Кейін 2", ru: "После 2", kr: "후 2" } },
  ],
  interview: {
    kz: "Тест Interview KZ",
    ru: "Тест Interview RU",
    kr: "테스트 Interview KR",
  },
  consentedAt: "2026-04-12T10:00:00Z",
};

const LABELS = {
  interviewLabel: "Interview",
  modal: {
    modalLabel: "Photo viewer",
    closeLabel: "Close",
    prevLabel: "Previous photo",
    nextLabel: "Next photo",
  },
};
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

describe("CaseCard (Iteration 3b — 4-thumbnail row + modal)", () => {
  it("renders all 4 thumbnails as buttons (one per case image)", () => {
    const html = render();
    const buttons = html.match(/<button\b/g) ?? [];
    expect(buttons.length).toBe(4);
  });

  it("each thumbnail button carries the locale-resolved per-image alt as aria-label", () => {
    const html = render("kr");
    expect(html).toContain('aria-label="전 1"');
    expect(html).toContain('aria-label="전 2"');
    expect(html).toContain('aria-label="후 1"');
    expect(html).toContain('aria-label="후 2"');
  });

  it("thumbnail row uses a 4-column grid (not a horizontal swipe scroller)", () => {
    const html = render();
    expect(html).toMatch(/grid-cols-4/);
    expect(html).not.toMatch(/snap-x/);
    expect(html).not.toMatch(/snap-mandatory/);
    expect(html).not.toMatch(/overflow-x-auto/);
  });

  it("renders all 4 tone gradient placeholders", () => {
    const html = render();
    expect(html).toMatch(/from-warm/);
    expect(html).toMatch(/from-ground/);
    expect(html).toMatch(/from-rose-tint/);
    expect(html).toMatch(/from-rose-soft/);
  });

  it("does NOT render the Iteration 3a page-indicator dots", () => {
    const html = render();
    // Iteration 3a's dot signature was `h-1.5 w-1.5 rounded-full`.
    expect(html).not.toMatch(/h-1\.5 w-1\.5 rounded-full/);
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

  it("uses ink-mute focus ring on every interactive element (consistent with the rest of the app)", () => {
    const html = render();
    expect(html).toMatch(/focus-visible:ring-ink-mute/);
    expect(html).not.toMatch(/focus-visible:ring-rose/);
  });

  it("does NOT render the modal on first paint (state is closed until a thumbnail is tapped)", () => {
    const html = render();
    expect(html).not.toContain('role="dialog"');
    expect(html).not.toContain('aria-modal="true"');
  });

  it("orphan case (no treatment / no clinic) still renders thumbnails + caption + interview", () => {
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
    const buttons = html.match(/<button\b/g) ?? [];
    expect(buttons.length).toBe(4);
  });
});
