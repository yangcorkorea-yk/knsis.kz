/*
 * /[locale]/korea-visit/plan — M4-01 multi-step form host.
 *
 * Server component. Resolves the i18n labels server-side + hands
 * them to the client `KvPlanForm` island, mirroring the M3
 * consult-form pattern. The form itself drives step navigation
 * + the POST.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { KvPlanForm, type KvPlanFormLabels } from "@/components/korea-visit/kv-plan-form";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function KoreaVisitPlanPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  setRequestLocale(activeLocale);
  const t = await getTranslations("korea_visit.plan");
  const tf = await getTranslations("korea_visit.fields");
  const te = await getTranslations("korea_visit.errors");

  const errorKeys = [
    "date_invalid",
    "dates_swapped",
    "dates_too_far",
    "name_required",
    "phone_invalid",
    "email_invalid",
    "consent_required",
    "submit_failed",
  ] as const;
  // Compose i18n catalog → flat lookup keyed by the message string
  // each Zod issue carries (`korea_visit.errors.<key>`).
  const errors: Record<string, string> = {};
  for (const k of errorKeys) errors[`korea_visit.errors.${k}`] = te(k);

  const labels: KvPlanFormLabels = {
    step_progress: t("step_progress"),
    step_trip_title: t("step_trip_title"),
    step_service_title: t("step_service_title"),
    step_contact_title: t("step_contact_title"),
    back: t("back"),
    next: t("next"),
    submit: t("submit"),
    submitting: t("submitting"),
    fields: {
      date_from_label: tf("date_from_label"),
      date_to_label: tf("date_to_label"),
      airport_label: tf("airport_label"),
      airport_none: tf("airport_none"),
      airport_icn: tf("airport_icn"),
      airport_gmp: tf("airport_gmp"),
      airport_pus: tf("airport_pus"),
      airport_cju: tf("airport_cju"),
      hotel_pref_label: tf("hotel_pref_label"),
      hotel_pref_placeholder: tf("hotel_pref_placeholder"),
      interpreter_label: tf("interpreter_label"),
      interpreter_none: tf("interpreter_none"),
      interpreter_kz: tf("interpreter_kz"),
      interpreter_ru: tf("interpreter_ru"),
      interpreter_kr: tf("interpreter_kr"),
      interpreter_en: tf("interpreter_en"),
      aftercare_label: tf("aftercare_label"),
      aftercare_placeholder: tf("aftercare_placeholder"),
      notes_label: tf("notes_label"),
      notes_placeholder: tf("notes_placeholder"),
      name_label: tf("name_label"),
      name_placeholder: tf("name_placeholder"),
      phone_label: tf("phone_label"),
      phone_placeholder: tf("phone_placeholder"),
      email_label: tf("email_label"),
      email_placeholder: tf("email_placeholder"),
      whatsapp_label: tf("whatsapp_label"),
      telegram_label: tf("telegram_label"),
      preferred_language_label: tf("preferred_language_label"),
      preferred_language_kz: tf("preferred_language_kz"),
      preferred_language_ru: tf("preferred_language_ru"),
      preferred_language_kr: tf("preferred_language_kr"),
      consent_tos_label: tf("consent_tos_label"),
      consent_mkt_label: tf("consent_mkt_label"),
    },
    errors,
  };

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 pb-12 pt-8">
      <header className="flex flex-col gap-1">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-ink-body">{t("subtitle")}</p>
      </header>
      <KvPlanForm locale={activeLocale} defaultPreferredLanguage={activeLocale} labels={labels} />
    </main>
  );
}
