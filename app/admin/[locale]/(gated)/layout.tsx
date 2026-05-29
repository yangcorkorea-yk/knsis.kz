/*
 * app/admin/[locale]/(gated)/layout.tsx — M5-01 gated admin frame.
 *
 * Server-side requireRole guard. All four staff roles
 * (support / manager / head / admin) pass; everything else (guest,
 * customer, no cookie, expired session) redirects to
 * /admin/{locale}/sign-in.
 *
 * The 403 case (authenticated staff member but role outside the
 * allow-list) can't happen here — every staff role is on the list.
 * Per-route 403s land later when individual screens restrict
 * sub-roles (e.g. M5-04 Managers admin-only).
 *
 * The (gated) route group keeps /admin/[locale]/sign-in outside this
 * guard; sign-in must be reachable without a session.
 */

import { Role } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { AdminShell } from "@/components/admin/admin-shell";
import { requireRole } from "@/lib/auth/require-role";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";

export const dynamic = "force-dynamic";

export default async function AdminGatedLayout({
  children,
  params: { locale },
}: {
  children: ReactNode;
  params: { locale: string };
}) {
  const activeLocale: Locale = isLocale(locale) ? locale : "kz";

  const gate = await requireRole([Role.support, Role.manager, Role.head, Role.admin]);
  if (!gate.ok) {
    redirect(`/admin/${activeLocale}/sign-in`);
  }

  const user = await prisma.user.findUnique({
    where: { id: gate.session.userId },
    select: { email: true },
  });

  const t = await getTranslations("admin.shell");
  // Active slug is derived per-page; the layout doesn't know the
  // current route, so we leave a sensible default and let pages pass
  // their own via a slot wrapper later. For M5-01 only `leads` is
  // live, so defaulting to "leads" is fine — gated landing redirects
  // to /leads anyway.
  return (
    <AdminShell
      locale={activeLocale}
      userEmail={user?.email ?? ""}
      active="leads"
      labels={{
        signOut: t("sign_out"),
        comingSoon: t("coming_soon"),
        desktopOnlyTitle: t("desktop_only.title"),
        desktopOnlyBody: t("desktop_only.body"),
        sidebar: {
          dashboard: t("sidebar.dashboard"),
          leads: t("sidebar.leads"),
          customers: t("sidebar.customers"),
          clinics: t("sidebar.clinics"),
          reviews: t("sidebar.reviews"),
          managers: t("sidebar.managers"),
          beforeAfter: t("sidebar.before_after"),
        },
      }}
    >
      {children}
    </AdminShell>
  );
}
