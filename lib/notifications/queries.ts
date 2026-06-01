/*
 * lib/notifications/queries.ts — server-side reads for the M4-03
 * `/me/notifications` inbox.
 *
 * Each user sees their own Notification rows (Notification.userId =
 * resolved-from-cookie-userId). Rows render newest first, grouped
 * into "today" (createdAt ≥ start of local day) vs "earlier".
 *
 * Three tabs (PM-ratified scope): consult / review / promo. Schema
 * column `kind` is a free-form String — events ship with one of
 * those values; anything else (forward-compat) renders only in the
 * "All" tab if/when we add one.
 */

import type { Locale, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";

export const NOTIF_TAB_KINDS = ["consult", "review", "promo"] as const;
export type NotifTab = (typeof NOTIF_TAB_KINDS)[number];

export interface NotifRow {
  id: string;
  kind: string;
  /** Picked from the trilingual `title` Json snapshot. */
  title: string;
  body: string;
  meta: Prisma.JsonValue | null;
  read: boolean;
  createdAt: Date;
}

export interface InboxPayload {
  /** Per-tab counts. `unread` is the cross-tab total. */
  counts: Record<NotifTab, { total: number; unread: number }>;
  unreadTotal: number;
  /** Rows for the active tab, newest first. */
  today: NotifRow[];
  earlier: NotifRow[];
}

function pickTrilingual(field: Prisma.JsonValue | null, locale: Locale): string {
  if (!field || typeof field !== "object" || Array.isArray(field)) return "";
  const obj = field as Record<string, unknown>;
  return (
    (typeof obj[locale] === "string" ? (obj[locale] as string) : null) ??
    (typeof obj.kz === "string" ? (obj.kz as string) : null) ??
    (typeof obj.ru === "string" ? (obj.ru as string) : null) ??
    (typeof obj.kr === "string" ? (obj.kr as string) : null) ??
    ""
  );
}

/** Returns the start of "today" in UTC. The inbox groups by UTC day
 *  for predictability — locale-aware grouping is a polish defer. */
function startOfToday(now: Date = new Date()): Date {
  const d = new Date(now);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export async function fetchInbox(
  userId: string,
  tab: NotifTab,
  locale: Locale,
): Promise<InboxPayload> {
  const [byKind, rows] = await Promise.all([
    prisma.notification.groupBy({
      by: ["kind", "read"],
      where: { userId },
      _count: true,
    }),
    prisma.notification.findMany({
      where: { userId, kind: tab },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        kind: true,
        title: true,
        body: true,
        meta: true,
        read: true,
        createdAt: true,
      },
    }),
  ]);

  const counts: Record<NotifTab, { total: number; unread: number }> = {
    consult: { total: 0, unread: 0 },
    review: { total: 0, unread: 0 },
    promo: { total: 0, unread: 0 },
  };
  let unreadTotal = 0;
  for (const row of byKind) {
    if ((NOTIF_TAB_KINDS as readonly string[]).includes(row.kind)) {
      const t = row.kind as NotifTab;
      counts[t].total += row._count;
      if (!row.read) {
        counts[t].unread += row._count;
        unreadTotal += row._count;
      }
    }
  }

  const todayStart = startOfToday();
  const mapped: NotifRow[] = rows.map((r) => ({
    id: r.id,
    kind: r.kind,
    title: pickTrilingual(r.title, locale),
    body: pickTrilingual(r.body, locale),
    meta: r.meta,
    read: r.read,
    createdAt: r.createdAt,
  }));

  return {
    counts,
    unreadTotal,
    today: mapped.filter((r) => r.createdAt >= todayStart),
    earlier: mapped.filter((r) => r.createdAt < todayStart),
  };
}

export interface NotifMarkDeps {
  ownsNotification: (params: { id: string; userId: string }) => Promise<boolean>;
  markRead: (id: string) => Promise<void>;
  markAllReadForUser: (userId: string) => Promise<{ count: number }>;
}

const productionMarkDeps: NotifMarkDeps = {
  ownsNotification: async ({ id, userId }) => {
    const row = await prisma.notification.findUnique({
      where: { id },
      select: { userId: true },
    });
    return !!row && row.userId === userId;
  },
  markRead: async (id) => {
    await prisma.notification.update({ where: { id }, data: { read: true } });
  },
  markAllReadForUser: async (userId) => {
    const res = await prisma.notification.updateMany({
      where: { userId, read: false },
      data: { read: true },
    });
    return { count: res.count };
  },
};

export async function markNotificationReadUsing(
  deps: NotifMarkDeps,
  params: { id: string; userId: string },
): Promise<{ ok: true } | { ok: false; reason: "not_owner" }> {
  const owned = await deps.ownsNotification(params);
  if (!owned) return { ok: false, reason: "not_owner" };
  await deps.markRead(params.id);
  return { ok: true };
}

export function markNotificationRead(params: { id: string; userId: string }) {
  return markNotificationReadUsing(productionMarkDeps, params);
}

export async function markAllNotificationsRead(userId: string): Promise<{ count: number }> {
  return productionMarkDeps.markAllReadForUser(userId);
}
