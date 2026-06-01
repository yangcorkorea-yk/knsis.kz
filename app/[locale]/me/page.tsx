/*
 * /[locale]/me — read-only "My page" skeleton.
 *
 * Per the M1 spec this is intentionally a placeholder:
 *   - reads the signed guest cookie (M1-01) so the page can
 *     distinguish "anonymous visitor" from "has a session";
 *   - renders a stub profile card (locale + truncated guest id);
 *   - shows an empty consult-request list. The actual list is
 *     populated by M3 once /api/leads writes Lead rows keyed on
 *     User.guestId. M1-05 deliberately does NOT hit Prisma — there
 *     is nothing to find yet, and an empty query at this stage
 *     would just be dead I/O.
 *   - exposes a 3-way language switcher (KZ / RU / KR).
 *
 * Server component. Reads next-intl translations server-side. No
 * client JS unless a child needs it.
 */

import Link from "next/link";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { readGuestSession } from "@/lib/auth/session";
import { isLocale, LOCALES, type Locale } from "@/lib/i18n/config";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CTA } from "@/components/ui/cta";

export const dynamic = "force-dynamic"; // cookie-aware, never static

export default async function MePage({ params: { locale } }: { params: { locale: string } }) {
  setRequestLocale(locale);
  const t = await getTranslations("me");

  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const guestId = await readGuestSession();
  // Show only the first segment of the uuid — enough for an operator
  // looking over a customer's shoulder to read the same session id
  // out of the admin inbox, without exposing the full token.
  const guestIdShort = guestId ? guestId.split("-")[0] : null;

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-4 bg-warm p-4 pb-24">
      <header className="pt-2">
        <h1 className="text-2xl font-extrabold tracking-display text-ink">{t("title")}</h1>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>{t("profile.section")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          {guestIdShort ? (
            <div className="flex items-center justify-between">
              <span className="text-sm text-ink-mute">{t("profile.guest_id_label")}</span>
              <div className="flex items-center gap-2">
                <Badge tone="ink">{guestIdShort}</Badge>
                <Badge tone="rose">{t("profile.guest_badge")}</Badge>
              </div>
            </div>
          ) : (
            <p className="text-sm text-ink-body">{t("profile.no_session")}</p>
          )}
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-mute">{t("profile.locale_label")}</span>
            <Badge tone="lav">{activeLocale.toUpperCase()}</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("consults.section")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 pt-3">
          <p className="text-sm text-ink-mute">{t("consults.empty")}</p>
          <CTA asChild variant="soft" size="md">
            <Link href={`/${activeLocale}/consult`}>{t("consults.cta_new")}</Link>
          </CTA>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("languages.section")}</CardTitle>
        </CardHeader>
        <CardContent className="flex gap-2 pt-3">
          {LOCALES.map((loc) => {
            const active = loc === activeLocale;
            return (
              <Link
                key={loc}
                href={`/${loc}/me`}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "flex-1 rounded-md border border-rose bg-rose-tint px-3 py-2 text-center text-sm font-semibold text-rose-deep"
                    : "flex-1 rounded-md border border-line bg-paper px-3 py-2 text-center text-sm font-medium text-ink hover:bg-ground"
                }
              >
                {t(`languages.${loc}`)}
              </Link>
            );
          })}
        </CardContent>
      </Card>
    </main>
  );
}
