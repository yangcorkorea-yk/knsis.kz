/*
 * /[locale]/me/settings — M4-05 user-facing settings.
 *
 * Server component, force-dynamic (cookie-aware). Reads the
 * resolved User row from the guest cookie and renders 5 sections:
 *
 *   1. Language        — three navigation links (KZ/RU/KR).
 *      Selecting one navigates AND posts the locale change.
 *   2. Notif channels  — checkbox toggles for inapp + email,
 *      gated by lib/messaging/notif-channels.ts MVP_CHANNELS.
 *   3. Email address   — single text input so email transactional
 *      mail has a target. RFC-ish validated server-side.
 *   4. Data export     — anchor link to /api/me/export (browser
 *      handles the JSON download).
 *   5. Account delete  — soft-delete form requiring typed
 *      `DELETE` confirm token + double-tap browser confirm via
 *      `inputmode=text` (no JS).
 *
 * If the cookie is missing or User row absent, renders an empty-
 * state pointing at /consult so the page is reachable as a marketing
 * surface but doesn't crash.
 */

import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CTA } from "@/components/ui/cta";
import { readGuestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { isLocale, LOCALES, type Locale } from "@/lib/i18n/config";
import { parseNotifChannels } from "@/lib/messaging/notif-channels";

export const dynamic = "force-dynamic";

interface PageProps {
  params: { locale: string };
  searchParams: { ok?: string; err?: string };
}

export default async function SettingsPage({ params, searchParams }: PageProps) {
  const activeLocale: Locale = isLocale(params.locale) ? params.locale : "kz";
  setRequestLocale(activeLocale);
  const t = await getTranslations("me.settings");
  const tl = await getTranslations("me.languages");

  const guestId = await readGuestSession();
  const me = guestId
    ? await prisma.user.findUnique({
        where: { guestId },
        select: { id: true, locale: true, email: true, notifChannels: true },
      })
    : null;

  if (!me) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 pb-12 pt-8">
        <header className="flex flex-col gap-1">
          <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
            {t("title")}
          </h1>
          <p className="text-sm text-ink-body">{t("subtitle")}</p>
        </header>
        <p className="rounded-md border border-dashed border-line bg-paper p-6 text-center text-sm text-ink-mute">
          {await getTranslations("me.profile").then((tp) => tp("no_session"))}
        </p>
        <CTA asChild size="lg">
          <Link href={`/${activeLocale}/consult`}>
            {await getTranslations("me.consults").then((tc) => tc("cta_new"))}
          </Link>
        </CTA>
      </main>
    );
  }

  const prefs = parseNotifChannels(me.notifChannels);
  const returnTo = `/${activeLocale}/me/settings`;
  const showSaved = searchParams.ok === "1";
  const showEmailErr = searchParams.err === "email_invalid";
  const showEmailTaken = searchParams.err === "email_taken";

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 pb-12 pt-8">
      <header className="flex flex-col gap-1">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-ink-body">{t("subtitle")}</p>
      </header>

      {showSaved && (
        <p
          role="status"
          className="rounded-md border border-line bg-paper px-3 py-2 text-xs text-ink-body"
        >
          {t("channels.saved")}
        </p>
      )}

      {/* Language */}
      <Section title={t("language.section")} help={t("language.help")}>
        <div className="flex flex-wrap gap-2">
          {LOCALES.map((loc) => {
            const active = loc === activeLocale;
            return (
              <Link
                key={loc}
                href={`/${loc}/me/settings`}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "rounded-md bg-rose-tint px-3 py-1.5 text-xs font-medium text-rose-deep"
                    : "rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-body hover:bg-ground"
                }
              >
                {tl(loc)}
              </Link>
            );
          })}
        </div>
      </Section>

      {/* Notif channels */}
      <Section title={t("channels.section")} help={t("channels.help")}>
        <form action="/api/me/settings" method="post" className="flex flex-col gap-3">
          <input type="hidden" name="_channels_form" value="1" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <label className="flex items-center gap-2 text-sm text-ink-body">
            <input
              type="checkbox"
              name="notif_inapp"
              defaultChecked={prefs.inapp}
              className="h-4 w-4 rounded border-line text-rose-deep focus:ring-rose-tint"
            />
            <span>{t("channels.inapp_label")}</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-ink-body">
            <input
              type="checkbox"
              name="notif_email"
              defaultChecked={prefs.email}
              className="h-4 w-4 rounded border-line text-rose-deep focus:ring-rose-tint"
            />
            <span>{t("channels.email_label")}</span>
          </label>
          <div>
            <button
              type="submit"
              className="rounded-md bg-rose-deep px-3 py-1.5 text-xs font-medium text-paper hover:opacity-90"
            >
              {t("channels.save")}
            </button>
          </div>
        </form>
      </Section>

      {/* Email */}
      <Section title={t("email.section")} help={t("email.help")}>
        <form action="/api/me/settings" method="post" className="flex flex-col gap-2">
          <input type="hidden" name="_email_form" value="1" />
          <input type="hidden" name="returnTo" value={returnTo} />
          <input
            type="email"
            name="email"
            defaultValue={me.email ?? ""}
            placeholder={t("email.placeholder")}
            autoComplete="email"
            className="h-10 rounded-md border border-line bg-paper px-3 text-sm text-ink"
          />
          {showEmailErr && (
            <p className="text-xs text-rose-deep" role="alert">
              {t("email.invalid")}
            </p>
          )}
          {showEmailTaken && (
            <p className="text-xs text-rose-deep" role="alert">
              {t("email.invalid")}
            </p>
          )}
          <div>
            <button
              type="submit"
              className="rounded-md bg-rose-deep px-3 py-1.5 text-xs font-medium text-paper hover:opacity-90"
            >
              {t("email.save")}
            </button>
          </div>
        </form>
      </Section>

      {/* Data export */}
      <Section title={t("data_export.section")} help={t("data_export.help")}>
        <a
          href="/api/me/export"
          download
          className="inline-block rounded-md border border-line px-3 py-1.5 text-xs font-medium text-ink-body hover:bg-ground"
        >
          {t("data_export.cta")}
        </a>
      </Section>

      {/* Account delete */}
      <Section title={t("account_delete.section")} help={t("account_delete.help")}>
        <form
          action="/api/me/delete"
          method="post"
          className="flex flex-col gap-2 rounded-md border border-rose-tint bg-paper p-3"
        >
          <input type="hidden" name="returnTo" value={`/${activeLocale}`} />
          <label className="text-xs text-ink-body">{t("account_delete.confirm_token")}</label>
          <input
            type="text"
            name="confirm"
            required
            placeholder={t("account_delete.confirm_token_required")}
            autoComplete="off"
            className="h-9 rounded-md border border-line bg-paper px-2 font-mono text-sm text-ink"
          />
          <p className="text-xs text-ink-mute">{t("account_delete.confirm_prompt")}</p>
          <div>
            <button
              type="submit"
              className="rounded-md border border-rose-deep bg-rose-deep px-3 py-1.5 text-xs font-medium text-paper hover:opacity-90"
            >
              {t("account_delete.cta")}
            </button>
          </div>
        </form>
      </Section>
    </main>
  );
}

function Section({
  title,
  help,
  children,
}: {
  title: string;
  help: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-2 rounded-lg border border-line bg-paper p-4">
      <h2 className="text-sm font-semibold text-ink">{title}</h2>
      <p className="text-xs leading-relaxed text-ink-mute">{help}</p>
      <div className="pt-1">{children}</div>
    </section>
  );
}
