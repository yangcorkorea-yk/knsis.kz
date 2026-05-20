import type { Metadata } from "next";
import localFont from "next/font/local";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, setRequestLocale } from "next-intl/server";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { htmlLang, isLocale, LOCALES, type Locale } from "@/lib/i18n/config";
import "../globals.css";

// Pretendard Variable — self-hosted (decision B7 of the M0 PR).
// Full variable axis (100–900) in a single woff2.
// Licence: SIL OFL 1.1, https://github.com/orioncactus/pretendard.
const pretendard = localFont({
  src: "../../public/fonts/PretendardVariable.woff2",
  variable: "--font-sans",
  weight: "100 900",
  display: "swap",
  preload: true,
});

export const metadata: Metadata = {
  title: "knsis.kz",
  description: "K-Beauty consultation platform for Kazakhstan customers.",
};

export function generateStaticParams() {
  return LOCALES.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
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
