/*
 * /[locale]/consult — M3 single-page consult form entry route.
 *
 * Server component. Loads the active Treatment list, resolves
 * area labels for the region pill row + language-dropdown
 * options + the full label bag, then renders the ConsultForm
 * island. The form owns its own h1/header now (single-page
 * redesign) so the page is just the data shell.
 *
 * Hard rules:
 *   - All copy from `consult.*` in messages/{kz,ru,kr}.json
 *   - Medical disclaimer rendered above the form sections
 *     (consistent with every M2 medical-adjacent surface)
 *   - No PII captured until the POST hits /api/leads
 *   - No monetary fields on schema or in copy
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
    "name_required",
    "name_too_long",
    "phone_required",
    "phone_format",
    "contact_id_too_long",
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
      <div className="px-4 pt-8">
        <ConsultForm
          locale={activeLocale}
          treatments={treatments}
          turnstileSiteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ?? ""}
          labels={{
            title: t("title"),
            subtitle: t("subtitle"),
            inputLocaleHint: t("input_locale_hint"),
            disclaimerBody: t("disclaimer.body"),
            disclaimerAriaLabel: t("disclaimer.aria_label"),
            footerNote: t("footer"),

            sectionContact: t("section.contact"),
            sectionGoal: t("section.goal"),
            sectionExtras: t("section.extras"),

            nameLabel: t("fields.name_label"),
            namePlaceholder: t("fields.name_placeholder"),
            phoneLabel: t("fields.phone_label"),
            phoneHelp: t("fields.phone_help"),
            phonePlaceholder: t("fields.phone_placeholder"),
            whatsappLabel: t("fields.whatsapp_label"),
            whatsappHelp: t("fields.whatsapp_help"),
            whatsappPlaceholder: t("fields.whatsapp_placeholder"),
            whatsappBadge: t("fields.whatsapp_badge"),
            telegramLabel: t("fields.telegram_label"),
            telegramHelp: t("fields.telegram_help"),
            telegramPlaceholder: t("fields.telegram_placeholder"),
            telegramBadge: t("fields.telegram_badge"),
            contactChannelsNote: t("fields.contact_channels_note"),
            languageLabel: t("fields.language_label"),
            languageHelp: t("fields.language_help"),
            languageOptions: {
              kz: t("fields.language_option.kz"),
              ru: t("fields.language_option.ru"),
              kr: t("fields.language_option.kr"),
            },

            treatmentLabel: t("fields.treatment_label"),
            treatmentEmpty: t("fields.treatment_empty"),
            regionLabel: t("fields.region_label"),
            kindLabel: t("fields.kind_label"),
            kindKorea: t("fields.kind.korea"),
            kindLocal: t("fields.kind.local"),
            areaLabels,

            photoLabel: t("fields.photo_label"),
            photoHelp: t("fields.photo_help"),
            photoAddButton: t("fields.photo_add_button"),
            photoRemoveButton: t("fields.photo_remove_button"),
            photoUploading: t("fields.photo_uploading"),
            messageLabel: t("fields.message_label"),
            messageHelp: t("fields.message_help"),
            messagePlaceholder: t("fields.message_placeholder"),
            consentTosLabel: t("fields.consent_tos_label"),
            consentMktLabel: t("fields.consent_mkt_label"),
            consentRequiredNote: t("fields.consent_required_note"),

            submit: t("button.submit"),
            submitting: t("button.submitting"),
            errors,
          }}
        />
      </div>
    </main>
  );
}
