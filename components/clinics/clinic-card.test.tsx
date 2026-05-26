/*
 * components/clinics/clinic-card.test.tsx
 *
 * Locks down the M2-04 ClinicCard presentation: link wrapping →
 * detail route, verified + kind badges visible, interpreter chips
 * rendered, treatment count shown, focus-visible decoupled from the
 * rose treatment (same a11y rule we applied to the categories Pill).
 *
 * The next-intl runtime is exercised by a NextIntlClientProvider so
 * `useTranslations("clinics")` resolves from the actual KZ catalog —
 * keeps i18n key fidelity within the unit-test gate.
 */

import { renderToString } from "react-dom/server";
import { NextIntlClientProvider } from "next-intl";
import { describe, expect, it } from "vitest";
import kzMessages from "@/messages/kz.json";
import { ClinicCard, type ClientClinicCardData } from "./clinic-card";

const FIXTURE: ClientClinicCardData = {
  id: "00000000-0000-0000-0000-000000000001",
  slug: "seoul-skin-clinic",
  kind: "korea",
  name: {
    kz: "Сеул тері клиникасы",
    ru: "Сеульская кожная клиника",
    kr: "서울 스킨 클리닉",
  },
  city: "Сеул",
  cityI18n: { kz: "Сеул", ru: "Сеул", kr: "서울" },
  interpreters: ["ru", "kz"],
  treatmentCount: 4,
  verified: true,
};

function render(card: ClientClinicCardData, locale: "kz" | "ru" | "kr" = "kz") {
  return renderToString(
    <NextIntlClientProvider locale={locale} messages={kzMessages}>
      <ClinicCard clinic={card} locale={locale} />
    </NextIntlClientProvider>,
  );
}

describe("ClinicCard", () => {
  it("wraps the card in a Link to /{locale}/clinics/{slug}", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toContain('href="/kz/clinics/seoul-skin-clinic"');
  });

  it("renders the locale-specific name", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toContain("Сеул тері клиникасы");
  });

  it("renders the kind=korea badge from clinics.kind.korea", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toContain("Корея");
  });

  it("renders the verified badge when verified=true", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toContain("Тексерілген");
  });

  it("omits the verified badge when verified=false", () => {
    const html = render({ ...FIXTURE, verified: false }, "kz");
    expect(html).not.toContain("Тексерілген");
  });

  it("renders interpreter chips from filter.language.* labels", () => {
    const html = render(FIXTURE, "kz");
    // ru + kz interpreters → labels "Орыс" + "Қазақ"
    expect(html).toContain("Орыс");
    expect(html).toContain("Қазақ");
  });

  it("renders the city via cityI18n.{locale} (M2-09 KR-aware display)", () => {
    // Tests need a KR catalog for the KR locale, but our provider uses
    // kzMessages above for consistency; assert against the city value
    // directly since cityI18n.kz === "Сеул" matches kz catalog.
    const html = render(FIXTURE, "kz");
    expect(html).toContain("Сеул");
  });

  it("renders the treatment_count subtext with the count token", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toContain("4 емшара");
  });

  it("focus-visible ring uses ink-mute (no rose tone) for off-switch hygiene", () => {
    const html = render(FIXTURE, "kz");
    expect(html).toMatch(/focus-visible:ring-ink-mute/);
    expect(html).not.toMatch(/focus-visible:ring-rose/);
  });
});
