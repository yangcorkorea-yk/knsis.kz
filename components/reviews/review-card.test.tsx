/*
 * components/reviews/review-card.test.tsx
 *
 * Lock down the M2-06 ReviewCard presentation + i18n disclaimer
 * fidelity. PII contract: only the first character of the
 * customer's name appears in the rendered HTML — full name must
 * never leak into the client snapshot.
 */

import { NextIntlClientProvider } from "next-intl";
import { renderToString } from "react-dom/server";
import { describe, expect, it } from "vitest";
import krMessages from "@/messages/kr.json";
import kzMessages from "@/messages/kz.json";
import ruMessages from "@/messages/ru.json";
import { ReviewCard, type ClientReviewData } from "./review-card";

const FIXTURE: ClientReviewData = {
  id: "00000000-0000-0000-0000-000000000010",
  code: "KB-RV-T-0010",
  body: {
    kz: "Жақсы тәжірибе.",
    ru: "Хороший опыт.",
    kr: "좋은 경험이었습니다.",
  },
  rating: 5,
  customerInitial: "Ә",
  clinicSlug: "seoul-skin-clinic",
  clinicName: {
    kz: "Сеул тері клиникасы",
    ru: "Сеульская кожная клиника",
    kr: "서울 스킨 클리닉",
  },
  clinicCity: "Сеул",
  clinicCityI18n: { kz: "Сеул", ru: "Сеул", kr: "서울" },
  treatmentSlug: "pico-laser-toning",
  treatmentTitle: {
    kz: "Пико-лазерлік тонинг",
    ru: "Пико-лазерный тонинг",
    kr: "피코 레이저 토닝",
  },
};

function render(card: ClientReviewData, locale: "kz" | "ru" | "kr" = "kz") {
  return renderToString(
    <NextIntlClientProvider locale={locale} messages={kzMessages}>
      <ReviewCard review={card} locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe("ReviewCard", () => {
  it("renders the locale-resolved body text (kz)", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toContain("Жақсы тәжірибе.");
  });

  it("renders the locale-resolved body text (kr)", () => {
    const html = render(FIXTURE, "kr");
    expect(html).toContain("좋은 경험이었습니다.");
  });

  it("PII: only the first character of the customer name is rendered", () => {
    const html = render(FIXTURE, "kz");
    // Ә appears (initial) but the rest of "Әлия" must NOT be in HTML
    expect(html).toContain("Ә");
    // No customer_name property was passed in; the card has no way to
    // render anything beyond customerInitial. This test pins that
    // contract — if a future refactor leaks a full name prop, the
    // ClientReviewData interface itself would have to change.
    expect(html).not.toContain("Әлия");
    expect(html).not.toContain("Айгерім");
  });

  it("rating row has aria-label with rating count", () => {
    const html = render(FIXTURE, "kz");
    // KZ rating_label = "{rating} жұлдыз"
    expect(html).toContain('aria-label="5 жұлдыз"');
  });

  it("renders 5 filled stars for rating=5", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toContain("★★★★★");
  });

  it("clinic name + treatment title appear as a meta line", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toContain("Сеул тері клиникасы");
    expect(html).toContain("Пико-лазерлік тонинг");
  });

  it("orphan review (no clinic, no treatment) still renders body + rating", () => {
    const orphan: ClientReviewData = {
      ...FIXTURE,
      clinicSlug: null,
      clinicName: null,
      clinicCity: null,
      clinicCityI18n: null,
      treatmentSlug: null,
      treatmentTitle: null,
    };
    const html = render(orphan, "kz");
    expect(html).toContain("Жақсы тәжірибе.");
    expect(html).toContain("★★★★★");
  });
});

describe("Reviews disclaimer · catalog fidelity", () => {
  // Mirrors the treatment + clinic disclaimer fidelity tests.
  // Locks down each locale's body string against accidental
  // deletion before the M7 native-speaker pass.
  it("KZ copy steers to a licensed doctor (дәрігер)", () => {
    expect(kzMessages.reviews.disclaimer.body).toMatch(/дәрігер/);
    expect(kzMessages.reviews.disclaimer.aria_label.length).toBeGreaterThan(0);
  });

  it("RU copy steers to a licensed doctor (врач)", () => {
    expect(ruMessages.reviews.disclaimer.body).toMatch(/врач/);
    expect(ruMessages.reviews.disclaimer.aria_label.length).toBeGreaterThan(0);
  });

  it("KR copy steers to a licensed doctor (의사)", () => {
    expect(krMessages.reviews.disclaimer.body).toMatch(/의사/);
    expect(krMessages.reviews.disclaimer.aria_label.length).toBeGreaterThan(0);
  });

  it("reviews disclaimer copy reflects user-experience framing (not 'general info')", () => {
    // Reviews disclaimer should mention "personal experience" or
    // "subjective" framing — distinct from the treatment-page
    // "general information" angle. Confirms the per-page wording
    // decision (separate i18n key vs reuse).
    expect(kzMessages.reviews.disclaimer.body).toMatch(/тәжірибе/);
    expect(ruMessages.reviews.disclaimer.body).toMatch(/опыт/);
    expect(krMessages.reviews.disclaimer.body).toMatch(/경험/);
  });
});
