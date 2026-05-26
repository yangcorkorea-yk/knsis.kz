/*
 * /[locale]/clinics/[slug] — Clinic detail (M2-04-04).
 *
 * Server component. Fetches one Clinic by slug + the Treatments
 * it offers, renders the prototype clinic detail layout
 * (`docs/prototype/screens-a.jsx` ScreenClinicDetail-equivalent):
 * header → hours → interpreters → treatments offered → disclaimer.
 *
 * The Medical Disclaimer component lives at
 * components/treatments/medical-disclaimer.tsx and is reused here
 * (CLAUDE.md §2 hard rule: clinic detail pages also surface the
 * disclaimer — its copy and visual treatment are identical to the
 * treatment detail page). i18n key: `clinics.disclaimer.*`
 * (intentionally separate from `treatments.disclaimer.*` so each
 * page can later diverge without a refactor).
 *
 * Hard rules check:
 *   - All static copy from messages/{kz,ru,kr}.json (`clinics.*`)
 *   - Clinic text fields via lib/i18n/tr.ts (M2-09 trilingual seed)
 *   - No monetary fields, no medical-claim phrasing
 *   - No PII (verified clinics only)
 *   - Disclaimer rendered (PM-approved copy, M7 native review pass)
 */

import { notFound } from "next/navigation";
import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { MedicalDisclaimer } from "@/components/treatments/medical-disclaimer";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr } from "@/lib/i18n/tr";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { locale: string; slug: string };
}

export default async function ClinicDetailPage({ params: { locale, slug } }: PageProps) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("clinics");

  const clinic = await prisma.clinic.findFirst({
    where: { slug, deletedAt: null, verifyState: "verified" },
    select: {
      id: true,
      slug: true,
      kind: true,
      name: true,
      location: true,
      interpreters: true,
      treatmentIds: true,
      hours: true,
    },
  });
  if (!clinic) notFound();

  const treatments = await prisma.treatment.findMany({
    where: { deletedAt: null, id: { in: clinic.treatmentIds } },
    select: { id: true, slug: true, title: true, category: true },
    orderBy: { createdAt: "desc" },
  });

  const loc = clinic.location as { city?: unknown; cityI18n?: unknown } | null;
  const flatCity = typeof loc?.city === "string" ? loc.city : "";
  const cityDisplay = loc?.cityI18n ? tr(loc.cityI18n, activeLocale) : flatCity;

  const hours = clinic.hours as Record<string, string> | null;
  const hoursEntries = hours ? Object.entries(hours).filter(([, v]) => typeof v === "string") : [];

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-warm pb-24 md:max-w-3xl">
      <header className="px-4 pt-8">
        <div className="flex flex-wrap items-center gap-1.5">
          {clinic.kind === "korea" ? (
            <Badge tone="korea" size="sm">
              {t("kind.korea")}
            </Badge>
          ) : (
            <Badge tone="lav" size="sm">
              {t("kind.local")}
            </Badge>
          )}
          <Badge tone="success" size="sm">
            {t("verified")}
          </Badge>
        </div>
        <h1 className="mt-2 break-keep text-2xl font-extrabold tracking-display text-ink">
          {tr(clinic.name, activeLocale)}
        </h1>
        {cityDisplay.length > 0 && <p className="mt-1 text-sm text-ink-body">{cityDisplay}</p>}
      </header>

      {hoursEntries.length > 0 && (
        <section className="px-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
            {t("detail.hours_label")}
          </h2>
          <ul className="space-y-1">
            {hoursEntries.map(([day, range]) => (
              <li key={day} className="flex justify-between gap-3 text-sm text-ink-2">
                <span className="min-w-0 text-ink-mute">{day}</span>
                <span className="min-w-0">{range}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {clinic.interpreters.length > 0 && (
        <section className="px-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
            {t("detail.interpreters_label")}
          </h2>
          <div className="flex flex-wrap gap-1">
            {clinic.interpreters.map((lang) => (
              <Badge key={lang} tone="beige" size="sm">
                {t(`filter.language.${lang}`)}
              </Badge>
            ))}
          </div>
        </section>
      )}

      <MedicalDisclaimer body={t("disclaimer.body")} ariaLabel={t("disclaimer.aria_label")} />

      {treatments.length > 0 && (
        <section className="px-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
            {t("detail.treatments_label")}
          </h2>
          <ul className="flex flex-col gap-2">
            {treatments.map((tx) => (
              <li key={tx.id}>
                <Link
                  href={`/${activeLocale}/treatments/${tx.slug}`}
                  className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
                >
                  <Card>
                    <CardContent className="space-y-1 pt-4">
                      <p className="text-sm font-semibold text-ink">{tr(tx.title, activeLocale)}</p>
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
