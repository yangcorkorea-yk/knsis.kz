/*
 * app/admin/[locale]/layout.tsx — top-level admin frame.
 *
 * Parallel tree to /[locale]: provides its own <html>/<body>, font
 * wiring, and next-intl provider. Lives one level above the (gated)
 * group so /admin/[locale]/sign-in renders inside the same shell but
 * skips the requireRole guard (sign-in is public — that's the whole
 * point).
 *
 * The desktop-only viewport gate is NOT here — sign-in must be
 * usable from a phone so staff can bookmark. The gate lives in
 * AdminShell, which (gated)/layout.tsx wraps gated routes in.
 */

import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { htmlLang, isLocale, LOCALES, type Locale } from "@/lib/i18n/config";
import "../../globals.css";

const pretendard = localFont({
  src: "../../../public/fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "knsis.kz — admin",
  robots: { index: false, follow: false },
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function AdminLocaleLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <html lang={htmlLang(locale as Locale)} className={pretendard.variable}>
      <body>
        <NextIntlClientProvider locale={locale} messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
