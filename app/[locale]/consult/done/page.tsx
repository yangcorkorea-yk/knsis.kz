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

import { CalendarCheck, ClipboardCheck, MessageCircle } from "lucide-react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ensureGuestUserFromRequest } from "@/lib/auth/ensure-guest-user";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";

/*
 * M3-hotfix polish: the "next steps" section originally rendered
 * as a plain <ol> with a rose-soft left gutter — readable but
 * the three steps blended into a flat list rather than a journey.
 * PM sign-off (Option B) replaced the gutter with numbered
 * rose-deep badge tiles + per-step lucide icons. ~1 KB bundle
 * impact via tree-shaken lucide imports already used elsewhere
 * (Shield in MedicalDisclaimer).
 */
const NEXT_STEPS = [
  { id: 1, Icon: ClipboardCheck },
  { id: 2, Icon: MessageCircle },
  { id: 3, Icon: CalendarCheck },
] as const;

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
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-5 bg-warm px-4 pb-24 pt-10 md:max-w-3xl">
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
        <ol className="flex flex-col gap-4">
          {NEXT_STEPS.map(({ id, Icon }) => (
            <li key={id} className="flex items-start gap-3">
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-rose-deep text-sm font-bold text-white"
              >
                {id}
              </span>
              <div className="flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="font-semibold text-ink">{t(`step_${id}_title`)}</p>
                  <Icon aria-hidden="true" className="h-3.5 w-3.5 shrink-0 text-ink-mute" />
                </div>
                <p className="mt-1 text-xs text-ink-mute">{t(`step_${id}_body`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="flex flex-col gap-2 rounded-md bg-rose-tint/50 p-3 text-xs text-ink-body">
        <p className="font-semibold text-ink">{t("contact_title")}</p>
        <p>{t("contact_body")}</p>
      </section>
    </main>
  );
}
