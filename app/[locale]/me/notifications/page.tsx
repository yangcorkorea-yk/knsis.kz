/*
 * /[locale]/me/notifications — M4-03 customer-facing inbox.
 *
 * Server component, force-dynamic (cookie-aware). Resolves the
 * guest cookie → User.id, fetches notifications via
 * lib/notifications/queries.ts, renders 3 tabs (consult / review /
 * promo) with today/earlier groups.
 *
 * If the user hasn't created any session yet (cookie missing or
 * tampered), renders an empty-state CTA pointing at /consult so
 * the inbox is reachable but doesn't 500 on first-visit.
 *
 * Mark-read flow: each row is a small `<form method=post action=…>`
 * pointing at /api/notifications/[id]/read, which marks the row +
 * redirects to the linked surface (meta.code → consult drawer).
 * No client JS needed for the basic interaction; "mark all read"
 * is a second form posting to /api/notifications/mark-all-read.
 */

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CTA } from "@/components/ui/cta";
import { readGuestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";
import { isLocale, type Locale } from "@/lib/i18n/config";
import {
  fetchInbox,
  NOTIF_TAB_KINDS,
  type NotifRow,
  type NotifTab,
} from "@/lib/notifications/queries";

export const dynamic = "force-dynamic";

const LOCALE_TO_BCP47: Record<Locale, string> = {
  kz: "kk-KZ",
  ru: "ru-RU",
  kr: "ko-KR",
};

interface PageProps {
  params: { locale: string };
  searchParams: { tab?: string | string[] };
}

function pickTab(raw: string | string[] | undefined): NotifTab {
  const v = Array.isArray(raw) ? raw[0] : raw;
  if (v && (NOTIF_TAB_KINDS as readonly string[]).includes(v)) {
    return v as NotifTab;
  }
  return "consult";
}

async function resolveUserIdFromGuest(): Promise<string | null> {
  const guestId = await readGuestSession();
  if (!guestId) return null;
  const user = await prisma.user.findUnique({
    where: { guestId },
    select: { id: true },
  });
  return user?.id ?? null;
}

export default async function NotificationsPage({ params, searchParams }: PageProps) {
  const activeLocale: Locale = isLocale(params.locale) ? params.locale : "kz";
  setRequestLocale(activeLocale);
  const t = await getTranslations("me.notifications");
  const userId = await resolveUserIdFromGuest();

  if (!userId) {
    return (
      <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-6 px-4 pb-12 pt-8">
        <header className="flex flex-col gap-1">
          <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
            {t("title")}
          </h1>
          <p className="text-sm text-ink-body">{t("subtitle")}</p>
        </header>
        <p className="rounded-md border border-dashed border-line bg-paper p-6 text-center text-sm text-ink-mute">
          {t("empty")}
        </p>
        <CTA asChild size="lg">
          <Link href={`/${activeLocale}/consult`}>{t("open_link")}</Link>
        </CTA>
      </main>
    );
  }

  const tab = pickTab(searchParams.tab);
  const payload = await fetchInbox(userId, tab, activeLocale);
  const fmt = new Intl.DateTimeFormat(LOCALE_TO_BCP47[activeLocale], {
    hour: "2-digit",
    minute: "2-digit",
    month: "short",
    day: "numeric",
  });

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-5 px-4 pb-12 pt-8">
      <header className="flex flex-col gap-1">
        <h1 className="break-keep text-2xl font-extrabold tracking-display text-ink">
          {t("title")}
        </h1>
        <p className="text-sm text-ink-body">{t("subtitle")}</p>
      </header>

      <nav
        aria-label={t("title")}
        className="flex items-center gap-1 overflow-x-auto border-b border-line"
      >
        {NOTIF_TAB_KINDS.map((k) => {
          const isActive = k === tab;
          const unread = payload.counts[k].unread;
          return (
            <Link
              key={k}
              href={`/${activeLocale}/me/notifications?tab=${k}`}
              aria-current={isActive ? "page" : undefined}
              className={
                isActive
                  ? "flex items-center gap-1.5 border-b-2 border-rose-deep px-3 py-2 text-sm font-medium text-rose-deep"
                  : "flex items-center gap-1.5 border-b-2 border-transparent px-3 py-2 text-sm text-ink-body hover:bg-ground"
              }
            >
              <span>{t(`tabs.${k}`)}</span>
              {unread > 0 && (
                <span className="rounded-full bg-rose-tint px-1.5 text-[10px] font-semibold text-rose-deep">
                  {unread}
                </span>
              )}
            </Link>
          );
        })}
        <span className="flex-1" />
        {payload.unreadTotal > 0 && (
          <form action="/api/notifications/mark-all-read" method="post" className="px-2">
            <input
              type="hidden"
              name="returnTo"
              value={`/${activeLocale}/me/notifications?tab=${tab}`}
            />
            <button
              type="submit"
              className="rounded-md px-2 py-1 text-xs font-medium text-ink-body hover:bg-ground"
            >
              {t("mark_all_read")}
            </button>
          </form>
        )}
      </nav>

      {payload.today.length === 0 && payload.earlier.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-paper p-6 text-center text-sm text-ink-mute">
          {t("empty")}
        </p>
      ) : (
        <div className="flex flex-col gap-5">
          {payload.today.length > 0 && (
            <Group
              title={t("groups.today")}
              rows={payload.today}
              fmt={fmt}
              locale={activeLocale}
              tab={tab}
              labels={{ unread: t("unread_badge") }}
            />
          )}
          {payload.earlier.length > 0 && (
            <Group
              title={t("groups.earlier")}
              rows={payload.earlier}
              fmt={fmt}
              locale={activeLocale}
              tab={tab}
              labels={{ unread: t("unread_badge") }}
            />
          )}
        </div>
      )}
    </main>
  );
}

function metaCode(meta: NotifRow["meta"]): string | null {
  if (!meta || typeof meta !== "object" || Array.isArray(meta)) return null;
  const v = (meta as Record<string, unknown>).code;
  return typeof v === "string" ? v : null;
}

function Group({
  title,
  rows,
  fmt,
  locale,
  tab,
  labels,
}: {
  title: string;
  rows: NotifRow[];
  fmt: Intl.DateTimeFormat;
  locale: Locale;
  tab: NotifTab;
  labels: { unread: string };
}) {
  return (
    <section className="flex flex-col gap-2">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-ink-mute">{title}</h2>
      <ul className="flex flex-col gap-2">
        {rows.map((r) => {
          const code = metaCode(r.meta);
          const returnTo = `/${locale}/me/notifications?tab=${tab}`;
          return (
            <li
              key={r.id}
              className={
                r.read
                  ? "rounded-md border border-line bg-paper p-3"
                  : "rounded-md border border-rose-tint bg-paper p-3"
              }
            >
              <form action={`/api/notifications/${r.id}/read`} method="post">
                <input type="hidden" name="returnTo" value={returnTo} />
                {code && <input type="hidden" name="leadCode" value={code} />}
                <button type="submit" className="flex w-full flex-col gap-1 text-left">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="text-sm font-medium text-ink">{r.title}</span>
                    <span className="shrink-0 text-[11px] text-ink-mute">
                      {fmt.format(r.createdAt)}
                    </span>
                  </div>
                  {r.body && <p className="text-xs leading-relaxed text-ink-body">{r.body}</p>}
                  {!r.read && (
                    <span className="self-start rounded-full bg-rose-tint px-1.5 py-0.5 text-[10px] font-semibold text-rose-deep">
                      {labels.unread}
                    </span>
                  )}
                </button>
              </form>
            </li>
          );
        })}
      </ul>
    </section>
  );
  // suppress lint for the redirect helper alias
  void redirect;
}
