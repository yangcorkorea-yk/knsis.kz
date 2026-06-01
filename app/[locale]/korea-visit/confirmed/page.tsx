/*
 * /[locale]/korea-visit/confirmed — M4-01 post-submit confirmation.
 *
 * Server component. Read the lead code from the `?code=…` query
 * the plan page redirects with, render the trilingual confirmation
 * + next-steps block. Mirrors the M3 /consult/done layout pattern
 * (Option B numbered badge tiles).
 */

import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

const CODE_RE = /^KB-\d{4}-[A-Z0-9]{4,}$/;

export default async function KoreaVisitConfirmedPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string };
  searchParams: { code?: string | string[] };
}) {
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  setRequestLocale(activeLocale);
  const t = await getTranslations("korea_visit.confirmed");

  const codeRaw = Array.isArray(searchParams.code) ? searchParams.code[0] : searchParams.code;
  // Sanity-check the shape — don't render user-supplied garbage in
  // a header. If it doesn't match the pattern, render the page
  // without the code (user landed via direct link / paste).
  const code = codeRaw && CODE_RE.test(codeRaw) ? codeRaw : null;

  const steps = [
    { title: t("step_1_title"), body: t("step_1_body") },
    { title: t("step_2_title"), body: t("step_2_body") },
    { title: t("step_3_title"), body: t("step_3_body") },
  ];

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-4 pb-12 pt-8">
      <header className="flex flex-col gap-2">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="text-sm leading-relaxed text-ink-body">{t("body")}</p>
        {code && (
          <p className="mt-2 text-sm text-ink-body">
            <span className="text-ink-mute">{t("code_label")}: </span>
            <span className="rounded bg-rose-tint px-2 py-0.5 font-mono text-rose-deep">
              {code}
            </span>
          </p>
        )}
      </header>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-mute">
          {t("next_steps_title")}
        </h2>
        <ol className="flex flex-col gap-3">
          {steps.map((s, i) => (
            <li key={i} className="flex gap-3 rounded-md border border-line bg-paper p-3">
              <span
                aria-hidden
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-rose-tint text-sm font-semibold text-rose-deep"
              >
                {i + 1}
              </span>
              <div className="flex flex-col gap-0.5">
                <p className="text-sm font-medium text-ink">{s.title}</p>
                <p className="text-xs leading-relaxed text-ink-body">{s.body}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <Link
        href={`/${activeLocale}`}
        className="self-start text-sm font-medium text-rose-deep hover:underline"
      >
        ← {t("home_link")}
      </Link>
    </main>
  );
}
