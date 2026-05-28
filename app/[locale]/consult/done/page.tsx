/*
 * /[locale]/consult/done — M3-04 confirmation screen.
 *
 * Server component. Reads the freshly-submitted lead's code
 * from the `?code=` query param (the M3-01 form passes it via
 * window.location.assign), looks the Lead up to confirm it
 * belongs to the cookie-bearing user, then renders:
 *
 *   - Headline: thanks + code
 *   - Status (Lead.status — first value: `new`)
 *   - Timeline of expected next steps
 *   - Contact methods (phone callback / in-app chat link in M4-02)
 *
 * Robustness:
 *   - Missing code OR unowned code → render the generic
 *     "submitted, manager will reach out" copy without the
 *     code chip. Don't 404 — the lead is real even if the
 *     URL got stripped (some email clients strip query strings).
 *   - The page is always reachable; no auth gate.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { ensureGuestUserFromRequest } from "@/lib/auth/ensure-guest-user";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { locale: string };
  searchParams: { code?: string };
}

export default async function ConsultDonePage({ params: { locale }, searchParams }: PageProps) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("consult_done");

  const code = typeof searchParams.code === "string" ? searchParams.code : null;

  const ensured = await ensureGuestUserFromRequest({ locale: activeLocale });
  const lead =
    code && ensured.kind === "ok"
      ? await prisma.lead.findFirst({
          where: { code, userId: ensured.userId },
          select: { code: true, status: true, createdAt: true },
        })
      : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm px-4 pb-24 pt-10">
      <header className="flex flex-col gap-2">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-ink-body">{t("body")}</p>
      </header>

      {lead && (
        <div className="rounded-md border border-line bg-paper p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-ink-mute">
            {t("code_label")}
          </p>
          <p className="mt-1 font-mono text-lg font-bold text-ink">{lead.code}</p>
          <p className="mt-2 text-xs text-ink-mute">
            {t("submitted_at", {
              dt: lead.createdAt.toISOString().slice(0, 16).replace("T", " "),
            })}
          </p>
        </div>
      )}

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-bold text-ink">{t("next_steps_title")}</h2>
        <ol className="flex flex-col gap-3 border-l-2 border-rose-soft pl-4 text-sm text-ink-body">
          <li>
            <p className="font-semibold text-ink">{t("step_1_title")}</p>
            <p className="text-xs text-ink-mute">{t("step_1_body")}</p>
          </li>
          <li>
            <p className="font-semibold text-ink">{t("step_2_title")}</p>
            <p className="text-xs text-ink-mute">{t("step_2_body")}</p>
          </li>
          <li>
            <p className="font-semibold text-ink">{t("step_3_title")}</p>
            <p className="text-xs text-ink-mute">{t("step_3_body")}</p>
          </li>
        </ol>
      </section>

      <section className="flex flex-col gap-2 rounded-md bg-rose-tint/50 p-3 text-xs text-ink-body">
        <p className="font-semibold text-ink">{t("contact_title")}</p>
        <p>{t("contact_body")}</p>
      </section>
    </main>
  );
}
