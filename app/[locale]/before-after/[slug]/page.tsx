/*
 * /[locale]/before-after/[slug] — single B/A case detail page
 * (M2-07 → M2-polish list→detail revision).
 *
 * Server component. Resolves the case from the mock dataset by
 * slug, fetches the locale-resolved treatment + clinic display
 * names in a single Prisma round-trip, and renders the
 * interactive slider full-width inside the same mobile-only
 * container the list page uses.
 *
 * Page layout (top → bottom):
 *   1. Back link to /[locale]/before-after (list)
 *   2. Case caption as h1
 *   3. ConsentBanner (every page view shows it)
 *   4. MedicalDisclaimer (gallery copy)
 *   5. BeforeAfterSlider (interactive)
 *   6. Treatment + Clinic meta line (links to M2-03 / M2-04
 *      detail pages)
 *
 * The full M5 admin pass replaces MOCK_CASES with a Prisma query
 * and the slider's tone props with Supabase Storage signed URLs;
 * the rest of this page survives unchanged.
 *
 * Hard rules check:
 *   - All static copy from messages/{kz,ru,kr}.json (`gallery.*`)
 *   - Mock case caption via tr.ts (trilingual)
 *   - No monetary fields, no medical-claim phrasing
 *   - No PII (mock case carries zero personal data)
 *   - Consent banner + disclaimer both present
 */

import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ChevronLeft } from "lucide-react";
import { BeforeAfterSlider } from "@/components/gallery/before-after-slider";
import { ConsentBanner } from "@/components/gallery/consent-banner";
import { MedicalDisclaimer } from "@/components/treatments/medical-disclaimer";
import { prisma } from "@/lib/db/client";
import { MOCK_CASES } from "@/lib/gallery/mock-cases";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr, type TrilingualText } from "@/lib/i18n/tr";

export const dynamic = "force-dynamic";

export default async function BeforeAfterDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string };
}) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("gallery");

  const case_ = MOCK_CASES.find((c) => c.slug === slug);
  if (!case_) notFound();

  const [treatment, clinic] = await Promise.all([
    prisma.treatment.findFirst({
      where: { slug: case_.treatmentSlug, deletedAt: null },
      select: { slug: true, title: true },
    }),
    prisma.clinic.findFirst({
      where: { slug: case_.clinicSlug, deletedAt: null, verifyState: "verified" },
      select: { slug: true, name: true },
    }),
  ]);

  const captionText = tr(case_.caption, activeLocale);
  const treatmentText = treatment ? tr(treatment.title as TrilingualText, activeLocale) : "";
  const clinicText = clinic ? tr(clinic.name as TrilingualText, activeLocale) : "";

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24">
      <div className="px-4 pt-6">
        <Link
          href={`/${activeLocale}/before-after`}
          className="inline-flex items-center gap-1 rounded text-sm text-ink-body hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" strokeWidth={1.8} />
          <span>{t("title")}</span>
        </Link>
      </div>

      <header className="px-4">
        <h1 className="break-keep text-xl font-extrabold tracking-display text-ink">
          {captionText}
        </h1>
      </header>

      <ConsentBanner body={t("consent_banner")} />
      <MedicalDisclaimer body={t("disclaimer.body")} ariaLabel={t("disclaimer.aria_label")} />

      <section className="px-4">
        <BeforeAfterSlider
          beforeTone={case_.beforeTone}
          afterTone={case_.afterTone}
          beforeLabel={t("before_label")}
          afterLabel={t("after_label")}
          ariaLabel={`${t("slider_aria_label")}: ${captionText}`}
        />
      </section>

      {(treatmentText || clinicText) && (
        <section className="px-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
            {t("case_caption_label")}
          </h2>
          <p className="space-x-1 text-sm text-ink-2">
            {treatmentText && treatment && (
              <Link
                href={`/${activeLocale}/treatments/${treatment.slug}`}
                className="rounded underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
              >
                {treatmentText}
              </Link>
            )}
            {treatmentText && clinicText && <span className="text-ink-mute">·</span>}
            {clinicText && clinic && (
              <Link
                href={`/${activeLocale}/clinics/${clinic.slug}`}
                className="rounded underline-offset-2 hover:text-ink hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
              >
                {clinicText}
              </Link>
            )}
          </p>
        </section>
      )}
    </main>
  );
}
