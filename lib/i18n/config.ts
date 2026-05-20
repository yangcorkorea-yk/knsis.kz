/*
 * i18n configuration — single source of truth for locales.
 *
 * Path codes (`kz`, `ru`, `kr`) follow the spec; `htmlLang` returns the
 * proper BCP-47 tag so screen readers and translation tools see the
 * correct language (Kazakh = kk, Korean = ko).
 *
 * Keep in sync with messages/{kz,ru,kr}.json and the Locale Prisma enum.
 */

export const LOCALES = ["kz", "ru", "kr"] as const;
export type Locale = (typeof LOCALES)[number];
export const DEFAULT_LOCALE: Locale = "kz";

const HTML_LANG: Record<Locale, string> = {
  kz: "kk",
  ru: "ru",
  kr: "ko",
};

export function htmlLang(locale: Locale): string {
  return HTML_LANG[locale];
}

export function isLocale(value: string): value is Locale {
  return (LOCALES as readonly string[]).includes(value);
}
