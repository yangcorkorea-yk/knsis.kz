/*
 * /[locale]/consult — M3-01 consult form entry route.
 *
 * Server component. Loads the active Treatment list (slug + title)
 * so the goal step can offer real options instead of free-text.
 * Hands the catalog labels + tr-resolved options to the client
 * ConsultForm island.
 *
 * Hard rules:
 *   - All copy from `consult.*` in messages/{kz,ru,kr}.json
 *   - Medical disclaimer rendered above the form (consistent
 *     with every M2 medical-adjacent surface — treatments,
 *     clinics, reviews, search, gallery)
 *   - No PII captured until the POST hits /api/leads (form
 *     state is client-only via sessionStorage until submit)
 *   - Monetary fields absent from copy + schema — quotes are
 *     1-on-1 manager work (CLAUDE.md §2 rule 1)
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ConsultForm, type TreatmentOption } from "@/components/consult/consult-form";
import { prisma } from "@/lib/db/client";
import { CITY_SLUGS } from "@/lib/discover/filters";
import { isLocale, type Locale } from "@/lib/i18n/config";
import type { TrilingualText } from "@/lib/i18n/tr";

export const dynamic = "force-dynamic";

export default async function ConsultPage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("consult");
  const tArea = await getTranslations("clinics.filter.area");

  const treatmentRows = await prisma.treatment.findMany({
    where: { deletedAt: null },
    select: { slug: true, title: true },
    orderBy: { slug: "asc" },
  });

  const treatments: TreatmentOption[] = treatmentRows.map((row) => ({
    slug: row.slug,
    title: row.title as TrilingualText,
  }));

  const areaLabels: Record<string, string> = {};
  for (const slug of CITY_SLUGS) {
    areaLabels[slug] = tArea(slug);
  }

  const errors: Record<string, string> = {};
  for (const key of [
    "phone_required",
    "phone_format",
    "name_too_long",
    "treatment_required",
    "region_required",
    "kind_required",
    "photo_count",
    "photo_size",
    "photo_mime",
    "photo_upload_failed",
    "message_too_long",
    "consent_tos_required",
    "submit_failed",
    "submit_rate_limited",
  ] as const) {
    errors[`consult.errors.${key}`] = t(`errors.${key}`);
    errors[key] = t(`errors.${key}`);
  }

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm pb-24">
      <header className="px-4 pt-8">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-ink-body">{t("subtitle")}</p>
      </header>

      <div className="px-4">
        <ConsultForm
          locale={activeLocale}
          treatments={treatments}
          labels={{
            disclaimerBody: t("disclaimer.body"),
            disclaimerAriaLabel: t("disclaimer.aria_label"),
            stepProgress: (current, total) => t("step_progress", { current, total }),

            stepContactTitle: t("steps.contact.title"),
            stepGoalTitle: t("steps.goal.title"),
            stepPhotosTitle: t("steps.photos.title"),

            phoneLabel: t("steps.contact.phone_label"),
            phoneHelp: t("steps.contact.phone_help"),
            phonePlaceholder: t("steps.contact.phone_placeholder"),
            nameLabel: t("steps.contact.name_label"),
            nameHelp: t("steps.contact.name_help"),
            namePlaceholder: t("steps.contact.name_placeholder"),

            treatmentLabel: t("steps.goal.treatment_label"),
            treatmentEmpty: t("steps.goal.treatment_empty"),
            regionLabel: t("steps.goal.region_label"),
            kindLabel: t("steps.goal.kind_label"),
            kindKorea: t("steps.goal.kind.korea"),
            kindLocal: t("steps.goal.kind.local"),
            areaLabels,

            photoLabel: t("steps.photos.photo_label"),
            photoHelp: t("steps.photos.photo_help"),
            photoAddButton: t("steps.photos.photo_add_button"),
            photoRemoveButton: t("steps.photos.photo_remove_button"),
            photoUploading: t("steps.photos.photo_uploading"),
            messageLabel: t("steps.photos.message_label"),
            messageHelp: t("steps.photos.message_help"),
            messagePlaceholder: t("steps.photos.message_placeholder"),
            consentTosLabel: t("steps.photos.consent_tos_label"),
            consentMktLabel: t("steps.photos.consent_mkt_label"),
            consentRequiredNote: t("steps.photos.consent_required_note"),

            back: t("button.back"),
            next: t("button.next"),
            submit: t("button.submit"),
            submitting: t("button.submitting"),

            errors,
          }}
        />
      </div>
    </main>
  );
}
