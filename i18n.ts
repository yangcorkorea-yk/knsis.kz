import { getRequestConfig } from "next-intl/server";
import { notFound } from "next/navigation";
import { isLocale } from "@/lib/i18n/config";

/*
 * next-intl ≥ 3.22 deprecates the implicit-locale path; the
 * config must explicitly return `locale` so the runtime can
 * resolve translations without a fallback warning. M3 smoke
 * surfaced the warning in /kr/consult render — pinning here.
 */
export default getRequestConfig(async ({ locale }) => {
  if (!isLocale(locale)) notFound();

  return {
    locale,
    messages: (await import(`./messages/${locale}.json`)).default,
  };
});
