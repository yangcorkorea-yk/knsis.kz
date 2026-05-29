/*
 * /admin/[locale]/leads — M5-01 placeholder.
 *
 * Real list + drawer + assignment + status mutations + photo gallery
 * ship in the M5-03 batch. This page exists so the M5-01 shell has a
 * destination — gated landing redirects here, and the sidebar "Leads"
 * item highlights against this route.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale } from "@/lib/i18n/config";

export default async function AdminLeadsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(isLocale(locale) ? locale : "kz");
  const t = await getTranslations("admin.leads");

  return (
    <section className="flex flex-col gap-3">
      <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
        {t("placeholder_title")}
      </h1>
      <p className="max-w-xl text-sm leading-relaxed text-ink-body">{t("placeholder_body")}</p>
    </section>
  );
}
