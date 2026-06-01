/*
 * lib/admin/lead-events.ts — fan-out from a Lead mutation to the
 * user-facing notification surface.
 *
 * The M5-03 mutation surface (lib/admin/lead-mutations.ts) writes
 * AuditLog rows for the manager-facing activity feed. M4-03 adds a
 * second consumer: the customer-facing inbox + email mirror. This
 * helper is the seam — each API route calls
 *
 *   await dispatchLeadEvent(code, eventBuilder);
 *
 * AFTER the withAudit transaction commits. Inside the route handler
 * the dispatcher is wrapped in `waitUntil(...)` so the customer
 * notification doesn't block the manager's PATCH response — the
 * AuditLog write is the durable record either way.
 *
 * If the lead's user has no email or has opted out of email
 * (`notifChannels.email = false`), the Notification row still writes
 * (the inbox view is the authoritative event surface) — only the
 * email leg is skipped.
 *
 * `dispatchLeadEventUsing(deps, ...)` is the DI variant for tests;
 * `dispatchLeadEvent(...)` is the prisma+notify-backed wrapper.
 */

import type { Locale, Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/client";
import { notify, type NotifyEvent, type NotifyResult } from "@/lib/messaging/notify";

export interface LeadEventDeps {
  findLeadOwnerUser: (code: string) => Promise<{
    leadId: string;
    user: {
      id: string;
      email: string | null;
      locale: Locale;
      notifChannels: Prisma.JsonValue | null;
    };
  } | null>;
  notify: (params: {
    recipient: {
      id: string;
      email: string | null;
      locale: "kz" | "ru" | "kr";
      notifChannels: Prisma.JsonValue | null | undefined;
    };
    event: NotifyEvent;
    meta?: Prisma.InputJsonValue;
  }) => Promise<NotifyResult>;
}

const productionDeps: LeadEventDeps = {
  findLeadOwnerUser: async (code) => {
    const lead = await prisma.lead.findUnique({
      where: { code },
      select: {
        id: true,
        user: {
          select: {
            id: true,
            email: true,
            locale: true,
            notifChannels: true,
          },
        },
      },
    });
    if (!lead) return null;
    return { leadId: lead.id, user: lead.user };
  },
  notify: (params) => notify(params),
};

export type DispatchResult =
  | { ok: true; result: NotifyResult }
  | { ok: false; reason: "lead_not_found" };

export async function dispatchLeadEventUsing(
  deps: LeadEventDeps,
  code: string,
  event: NotifyEvent,
): Promise<DispatchResult> {
  const lead = await deps.findLeadOwnerUser(code);
  if (!lead) return { ok: false, reason: "lead_not_found" };
  const result = await deps.notify({
    recipient: {
      id: lead.user.id,
      email: lead.user.email,
      locale: lead.user.locale,
      notifChannels: lead.user.notifChannels,
    },
    event,
    meta: { leadId: lead.leadId, code },
  });
  return { ok: true, result };
}

export function dispatchLeadEvent(code: string, event: NotifyEvent): Promise<DispatchResult> {
  return dispatchLeadEventUsing(productionDeps, code, event);
}
