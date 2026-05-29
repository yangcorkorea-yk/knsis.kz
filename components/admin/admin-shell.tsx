/*
 * components/admin/admin-shell.tsx — M5-01 admin frame.
 *
 * Server component. Three concerns:
 *
 *   1. **Desktop-only viewport gate.** Admin is for the PM running
 *      the workbench — phone-sized UX would compress the leads
 *      drawer + activity log into a useless column. <lg (Tailwind
 *      breakpoint < 1024 px) shows the "open on desktop" fallback;
 *      ≥lg shows the actual shell. Server-rendered both ways so
 *      no flash; client never decides.
 *
 *   2. **Sidebar.** 7 items per spec §06 M5-01: Dashboard / Leads /
 *      Customers / Clinics / Reviews / Managers / B-A. Only `Leads`
 *      is live in M5-01+03 batch; the rest render with a "coming
 *      soon" badge. Active item gets the rose-tint background.
 *
 *   3. **Topbar.** Currently just sign-out + signed-in identity.
 *      Search, notifications, etc. land later.
 *
 * Drawer mount lives in the gated layout, not here — the drawer is
 * a slot the leads route fills (M5-03), and other routes don't need
 * the slot exposed.
 */

import Link from "next/link";
import {
  CalendarDays,
  FileText,
  Image,
  MessageSquare,
  Settings,
  Stethoscope,
  Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarLabels {
  dashboard: string;
  leads: string;
  customers: string;
  clinics: string;
  reviews: string;
  managers: string;
  beforeAfter: string;
}

interface ShellLabels {
  signOut: string;
  comingSoon: string;
  desktopOnlyTitle: string;
  desktopOnlyBody: string;
  sidebar: SidebarLabels;
}

interface Props {
  locale: string;
  labels: ShellLabels;
  /** The signed-in staff user's email (rendered in the top-right). */
  userEmail: string;
  /**
   * Currently-active sidebar slug. Determines which sidebar item
   * gets the active-state styling. Pages pass their own slug.
   */
  active: "dashboard" | "leads" | "customers" | "clinics" | "reviews" | "managers" | "before_after";
  children: React.ReactNode;
}

const SIDEBAR_ITEMS = [
  { slug: "dashboard", labelKey: "dashboard", Icon: CalendarDays, live: false },
  { slug: "leads", labelKey: "leads", Icon: FileText, live: true },
  { slug: "customers", labelKey: "customers", Icon: Users, live: false },
  { slug: "clinics", labelKey: "clinics", Icon: Stethoscope, live: false },
  { slug: "reviews", labelKey: "reviews", Icon: MessageSquare, live: false },
  { slug: "managers", labelKey: "managers", Icon: Settings, live: false },
  { slug: "before_after", labelKey: "beforeAfter", Icon: Image, live: false },
] as const;

export function AdminShell({ locale, labels, userEmail, active, children }: Props) {
  return (
    <>
      {/* Below-lg fallback. */}
      <main className="flex min-h-dvh flex-col items-center justify-center gap-3 bg-warm px-6 py-16 text-center lg:hidden">
        <h1 className="break-keep text-xl font-extrabold tracking-display text-ink">
          {labels.desktopOnlyTitle}
        </h1>
        <p className="max-w-sm text-sm leading-relaxed text-ink-body">{labels.desktopOnlyBody}</p>
      </main>

      {/* ≥lg desktop shell. */}
      <div className="hidden min-h-dvh bg-warm lg:flex">
        <aside className="flex w-64 shrink-0 flex-col gap-1 border-r border-line bg-paper p-4">
          <div className="px-2 pb-4">
            <Link
              href={`/admin/${locale}`}
              className="block text-base font-extrabold tracking-display text-ink"
            >
              knsis.kz
            </Link>
            <p className="text-[11px] text-ink-mute">admin</p>
          </div>
          <nav className="flex flex-col gap-0.5">
            {SIDEBAR_ITEMS.map(({ slug, labelKey, Icon, live }) => {
              const label = labels.sidebar[labelKey];
              const isActive = active === slug;
              if (!live) {
                return (
                  <span
                    key={slug}
                    className="flex items-center justify-between rounded-md px-3 py-2 text-sm text-ink-mute"
                  >
                    <span className="flex items-center gap-2">
                      <Icon aria-hidden="true" className="h-4 w-4" />
                      <span>{label}</span>
                    </span>
                    <span className="rounded bg-ground px-1.5 py-0.5 text-[10px] font-medium uppercase">
                      {labels.comingSoon}
                    </span>
                  </span>
                );
              }
              return (
                <Link
                  key={slug}
                  href={`/admin/${locale}/${slug}`}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                    isActive ? "bg-rose-tint text-rose-deep" : "text-ink hover:bg-ground",
                  )}
                >
                  <Icon aria-hidden="true" className="h-4 w-4" />
                  <span>{label}</span>
                </Link>
              );
            })}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="flex h-14 items-center justify-end gap-4 border-b border-line bg-paper px-6">
            <span className="text-xs text-ink-mute">{userEmail}</span>
            <form action="/api/auth/signout" method="post">
              <button
                type="submit"
                className="rounded-md px-2 py-1 text-xs font-medium text-ink-body hover:bg-ground hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink-mute focus-visible:ring-offset-2"
              >
                {labels.signOut}
              </button>
            </form>
          </header>
          <div className="min-w-0 flex-1 overflow-auto bg-warm p-6">{children}</div>
        </div>
      </div>
    </>
  );
}
