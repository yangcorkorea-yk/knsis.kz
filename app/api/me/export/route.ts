/*
 * GET /api/me/export — JSON dump of all data the current user owns.
 *
 * Includes: User row (excluding passwordHash + session ids), Lead
 * rows (with KoreaVisit nested), Notification rows, and the M3
 * consent timestamps. Excludes Note + AuditLog rows that DON'T
 * belong to the user (those are manager-private — leaking them
 * would betray operational state).
 *
 * Response is `Content-Disposition: attachment; filename=...` so
 * the browser triggers a download instead of inline-rendering.
 *
 * Hard-rule check: this endpoint EXPORTS PII (phone, email, WA, TG,
 * photos paths). The 5-min signed-URL discipline still applies to
 * photo bytes — paths come out, but signed URLs are NOT pre-minted
 * here (the user can re-mint via the standard flow). Auth scope is
 * the same cookie that grants every other /me read.
 */

import { NextResponse } from "next/server";
import { readGuestSession } from "@/lib/auth/session";
import { prisma } from "@/lib/db/client";

export const dynamic = "force-dynamic";

export async function GET() {
  const guestId = await readGuestSession();
  if (!guestId) {
    return NextResponse.json({ ok: false, error: "no_session" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { guestId },
    select: {
      id: true,
      guestId: true,
      phone: true,
      email: true,
      name: true,
      locale: true,
      role: true,
      consentTos: true,
      consentMkt: true,
      consentedAt: true,
      notifChannels: true,
      createdAt: true,
      updatedAt: true,
      leads: {
        select: {
          id: true,
          code: true,
          kind: true,
          regions: true,
          treatmentIds: true,
          channelPref: true,
          status: true,
          photos: true,
          message: true,
          whatsappId: true,
          telegramId: true,
          preferredLanguage: true,
          createdAt: true,
          updatedAt: true,
          koreaVisit: {
            select: {
              dateFrom: true,
              dateTo: true,
              airport: true,
              hotelPref: true,
              interpreter: true,
              aftercareDays: true,
              notes: true,
              createdAt: true,
              updatedAt: true,
            },
          },
        },
      },
      notifications: {
        select: {
          id: true,
          kind: true,
          title: true,
          body: true,
          meta: true,
          read: true,
          createdAt: true,
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!user) {
    return NextResponse.json({ ok: false, error: "no_user" }, { status: 401 });
  }

  const filename = `knsis-export-${user.id.slice(0, 8)}-${new Date()
    .toISOString()
    .slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify({ exportedAt: new Date().toISOString(), user }, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store",
    },
  });
}
