/*
 * /[locale]/treatments/[slug] — Treatment detail (M2-03).
 *
 * Route shell. Server component. Fetches a single Treatment by
 * slug + the verified clinics that offer it, renders the info /
 * expects / recovery / related-clinics layout from the prototype
 * (`docs/prototype/screens-a.jsx` ScreenTreatmentDetail).
 *
 * Status: SHELL ONLY on this commit.
 *
 * The Medical Disclaimer component is a CLAUDE.md §2 launch-hard-rule
 * requirement (no medical claims in UI copy; every treatment page
 * must carry the disclaimer). The copy needs explicit PM sign-off
 * before the component lands — placeholder copy is queued in the
 * PR description for review. The `MedicalDisclaimerSlot` marker
 * below is where the component plugs in once approved; the page
 * MUST NOT ship to main without the disclaimer rendered.
 *
 * Hard rules check (this commit):
 *   - All copy from messages/{kz,ru,kr}.json (`treatments.*`)
 *   - Treatment text fields via lib/i18n/tr.ts (kz fallback)
 *   - No monetary fields, no medical-claim phrasing
 *   - No PII rendered (treatments + verified clinics only)
 *   - Disclaimer slot marked; copy to land in follow-up commit
 */

import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import { tr, trList } from "@/lib/i18n/tr";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { locale: string; slug: string };
}

export default async function TreatmentDetailPage({ params: { locale, slug } }: PageProps) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("treatments");

  const treatment = await prisma.treatment.findFirst({
    where: { slug, deletedAt: null },
    select: {
      id: true,
      slug: true,
      category: true,
      title: true,
      summary: true,
      durationMin: true,
      recovery: true,
      expects: true,
    },
  });

  if (!treatment) notFound();

  const relatedClinics = await prisma.clinic.findMany({
    where: {
      deletedAt: null,
      verifyState: "verified",
      treatmentIds: { has: treatment.id },
    },
    select: {
      id: true,
      slug: true,
      name: true,
      kind: true,
      location: true,
      interpreters: true,
    },
    take: 12,
  });

  const expects = trList(treatment.expects, activeLocale);

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-6 bg-warm pb-24 md:max-w-3xl">
      <header className="px-4 pt-8">
        <Badge tone="lav" size="sm">
          {t(`category.${treatment.category}`)}
        </Badge>
        <h1 className="mt-2 break-keep text-2xl font-extrabold tracking-display text-ink">
          {tr(treatment.title, activeLocale)}
        </h1>
        <p className="mt-2 text-sm text-ink-body">{tr(treatment.summary, activeLocale)}</p>
        <p className="mt-3 text-xs text-ink-mute">
          {t("duration_min", { minutes: treatment.durationMin })}
        </p>
      </header>

      {expects.length > 0 && (
        <section className="px-4">
          <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
            {t("expects_label")}
          </h2>
          <ul className="space-y-2">
            {expects.map((line, i) => (
              <li key={i} className="flex gap-2 text-sm text-ink-2">
                <span aria-hidden="true" className="mt-1.5 h-1.5 w-1.5 rounded-full bg-rose-deep" />
                <span className="flex-1">{line}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="px-4">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
          {t("recovery_label")}
        </h2>
        <p className="text-sm text-ink-2">{tr(treatment.recovery, activeLocale)}</p>
      </section>

      {/*
       * MedicalDisclaimerSlot — CLAUDE.md §2 hard rule.
       * Component + finalised copy land in a follow-up commit on
       * this PR, after PM signs off on the placeholder copy queued
       * in the PR description.
       */}

      <section className="px-4">
        <h2 className="mb-2 text-[11px] font-semibold uppercase tracking-widest text-ink-mute">
          {t("related_clinics_label")}
        </h2>
        {relatedClinics.length === 0 ? (
          <p className="text-sm text-ink-mute">{t("related_clinics_empty")}</p>
        ) : (
          <ul className="space-y-2">
            {relatedClinics.map((clinic) => {
              const city = (clinic.location as { city?: unknown } | null)?.city ?? "";
              return (
                <li key={clinic.id}>
                  <Card>
                    <CardContent className="space-y-1 pt-4">
                      <p className="text-sm font-semibold text-ink">
                        {tr(clinic.name, activeLocale)}
                      </p>
                      {typeof city === "string" && city.length > 0 && (
                        <p className="text-xs text-ink-mute">{city}</p>
                      )}
                      {clinic.interpreters.length > 0 && (
                        <p className="text-[11px] text-ink-mute">
                          {t("interpreters_prefix")} {clinic.interpreters.join(" · ")}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </main>
  );
}
