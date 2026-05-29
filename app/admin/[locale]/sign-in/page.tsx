/*
 * /admin/[locale]/sign-in — M5-01 admin sign-in.
 *
 * Server page. Public surface (no requireRole gate — that's the
 * whole point of sign-in). Renders the form island + locale-resolved
 * labels.
 *
 * Desktop-only fallback lives on the gated layout, not here — the
 * sign-in form is intentionally usable from any viewport so a
 * staff member on the phone can sign in and bookmark; they'll see
 * the desktop-only screen on the gated views.
 */

import { getTranslations, setRequestLocale } from "next-intl/server";
import { AdminSignInForm } from "@/components/admin/admin-sign-in-form";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminSignInPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  setRequestLocale(locale);
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  const t = await getTranslations("admin.sign_in");

  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col justify-center bg-warm px-4 py-12">
      <header className="mb-6 flex flex-col gap-1">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-ink-body">{t("subtitle")}</p>
      </header>
      <AdminSignInForm
        locale={activeLocale}
        labels={{
          emailLabel: t("email_label"),
          emailPlaceholder: t("email_placeholder"),
          passwordLabel: t("password_label"),
          submit: t("submit"),
          submitting: t("submitting"),
          errorInvalid: t("error.invalid_credentials"),
          errorUnknown: t("error.unknown"),
        }}
      />
    </main>
  );
}
