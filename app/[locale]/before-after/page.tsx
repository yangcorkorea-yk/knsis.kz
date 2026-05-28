/*
 * /[locale]/before-after — patient consent gallery (M2-07).
 *
 * Server component. Mobile-only per spec §05 — the layout
 * caps at max-w-md even on desktop (no md:max-w-3xl widening).
 * Desktop viewers see the same narrow column; the slider still
 * works with mouse + keyboard.
 *
 * MVP shell: cases come from `lib/gallery/mock-cases.ts`. M5
 * admin moderation swaps this to a Prisma query against a real
 * BeforeAfterCase model (or a strict Review.photos convention)
 * backed by Supabase Storage signed URLs.
 *
 * Page layout (top → bottom):
 *   1. Header (title + subtitle — copy stripped of dev-jargon
 *      "(mobile optimised)" parenthetical per M2-polish PM)
 *   2. ConsentBanner — every page view shows it (no dismiss)
 *   3. MedicalDisclaimer (gallery-specific copy — "results vary
 *      by individual")
 *   4. Case grid: stacked Iteration-3b CaseCards (4-thumbnail row
 *      → click opens ImageModal lightbox + caption + procedure #tag
 *      + interview blockquote + clinic meta). Single depth — no
 *      /[slug] detail.
 *   5. Empty state if the case array is empty
 *
 * Hard rules check:
 *   - All static copy from messages/{kz,ru,kr}.json (`gallery.*`)
 *   - Mock case captions via tr.ts (trilingual at first-write)
 *   - No monetary fields, no medical-claim phrasing in copy
 *   - No PII rendered (mock cases carry zero personal data)
 *   - Consent banner present at top of page
 *   - Disclaimer present before the gallery
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { CaseCard } from "@/components/gallery/case-card";
import { ConsentBanner } from "@/components/gallery/consent-banner";
import { MedicalDisclaimer } from "@/components/treatments/medical-disclaimer";
import { prisma } from "@/lib/db/client";
import { MOCK_CASES } from "@/lib/gallery/mock-cases";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { TrilingualText } from "@/lib/i18n/tr";

export const dynamic = "force-dynamic";

export default async function BeforeAfterPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("gallery");

  // Resolve treatment + clinic display names in one shot for the
  // case meta lines. The mock cases only reference seeded slugs;
  // a missing row falls through to a null label (the card hides
  // that half of the meta line).
  const treatmentSlugs = Array.from(new Set(MOCK_CASES.map((c) => c.treatmentSlug)));
  const clinicSlugs = Array.from(new Set(MOCK_CASES.map((c) => c.clinicSlug)));

  const [treatments, clinics] = await Promise.all([
    prisma.treatment.findMany({
      where: { slug: { in: treatmentSlugs }, deletedAt: null },
      select: { slug: true, title: true },
    }),
    prisma.clinic.findMany({
      where: { slug: { in: clinicSlugs }, deletedAt: null, verifyState: "verified" },
      select: { slug: true, name: true },
    }),
  ]);

  const treatmentTitleBySlug = new Map<string, TrilingualText>(
    treatments.map((t) => [t.slug, t.title as TrilingualText]),
  );
  const clinicNameBySlug = new Map<string, TrilingualText>(
    clinics.map((c) => [c.slug, c.name as TrilingualText]),
  );

  const labels = {
    interviewLabel: t("interview_label"),
    modal: {
      modalLabel: t("image_modal_label"),
      closeLabel: t("image_modal_close"),
      prevLabel: t("image_modal_prev"),
      nextLabel: t("image_modal_next"),
    },
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24">
      <header className="px-4 pt-8">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-ink-body">{t("subtitle")}</p>
      </header>

      <ConsentBanner body={t("consent_banner")} />
      <MedicalDisclaimer body={t("disclaimer.body")} ariaLabel={t("disclaimer.aria_label")} />

      {MOCK_CASES.length === 0 ? (
        <p className="px-4 text-sm text-ink-mute">{t("empty")}</p>
      ) : (
        <ul className="flex flex-col gap-4 px-4">
          {MOCK_CASES.map((case_) => (
            <li key={case_.id}>
              <CaseCard
                case_={case_}
                locale={activeLocale}
                treatmentTitle={treatmentTitleBySlug.get(case_.treatmentSlug) ?? null}
                clinicName={clinicNameBySlug.get(case_.clinicSlug) ?? null}
                labels={labels}
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
