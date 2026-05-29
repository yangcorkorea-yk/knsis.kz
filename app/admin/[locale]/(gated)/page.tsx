/*
 * /admin/[locale] (gated) — landing redirect.
 *
 * The gated root has no UI of its own; M5-01 ships only the Leads
 * surface, so signed-in staff land on /admin/{locale}/leads. When
 * Dashboard goes live (post-M6), this page becomes the dashboard.
 */

import { redirect } from "next/navigation";
import { isLocale, type Locale } from "@/lib/i18n/config";

export default function AdminGatedLanding({ params: { locale } }: { params: { locale: string } }) {
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";
  redirect(`/admin/${activeLocale}/leads`);
}
