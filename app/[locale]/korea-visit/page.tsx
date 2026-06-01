/*
 * /[locale]/korea-visit — M4-01 landing page.
 *
 * Server component. Pure marketing surface: explains what KV
 * covers (pickup / hotel / interpreter / aftercare) and drops a
 * single CTA into the plan form. No persistence happens here — the
 * page is static and translates via the admin.* / korea_visit.*
 * i18n catalogs.
 */

import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CTA } from "@/components/ui/cta";
import { isLocale, type Locale } from "@/lib/i18n/config";

export default async function KoreaVisitLandingPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  setRequestLocale(activeLocale);
  const t = await getTranslations("korea_visit.landing");

  return (
    <main className="mx-auto flex min-h-dvh max-w-3xl flex-col gap-8 px-4 pb-12 pt-8 md:pt-16">
      <header className="flex flex-col gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-rose-deep">
          {t("kicker")}
        </p>
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink md:text-3xl">
          {t("title")}
        </h1>
        <p className="text-sm leading-relaxed text-ink-body md:text-base">{t("subtitle")}</p>
      </header>

      <section className="rounded-lg border border-line bg-paper p-5">
        <ul className="flex flex-col gap-2 text-sm text-ink-body">
          {(["bullet_1", "bullet_2", "bullet_3", "bullet_4"] as const).map((k) => (
            <li key={k} className="flex items-start gap-2">
              <span aria-hidden className="mt-0.5 text-rose-deep">
                ✦
              </span>
              <span>{t(k)}</span>
            </li>
          ))}
        </ul>
      </section>

      <div>
        <CTA asChild size="lg">
          <Link href={`/${activeLocale}/korea-visit/plan`}>{t("cta_plan")}</Link>
        </CTA>
      </div>

      <aside
        aria-label={t("disclaimer_title")}
        className="rounded-md border border-dashed border-line bg-ground/40 p-4 text-xs leading-relaxed text-ink-mute"
      >
        <p className="font-semibold text-ink-body">{t("disclaimer_title")}</p>
        <p className="mt-1">{t("disclaimer_body")}</p>
      </aside>
    </main>
  );
}
