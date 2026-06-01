import { describe, expect, it, vi } from "vitest";
import { dispatchLeadEventUsing, type LeadEventDeps } from "./lead-events";

const LEAD_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

function makeDeps(opts?: { leadFound?: boolean }): {
  deps: LeadEventDeps;
  notifyFn: ReturnType<typeof vi.fn>;
} {
  const notifyFn = vi.fn(async () => ({
    notificationId: "n-1",
    email: "sent" as const,
    emailDetail: { ok: true as const, messageId: "m-1" },
  }));
  const deps: LeadEventDeps = {
    findLeadOwnerUser: async () =>
      opts?.leadFound === false
        ? null
        : {
            leadId: LEAD_ID,
            user: {
              id: USER_ID,
              email: "u@example.test",
              locale: "ru",
              notifChannels: { inapp: true, email: true },
            },
          },
    notify: notifyFn,
  };
  return { deps, notifyFn };
}

describe("dispatchLeadEventUsing", () => {
  it("resolves the lead's user + fires notify with the event", async () => {
    const { deps, notifyFn } = makeDeps();
    const res = await dispatchLeadEventUsing(deps, "KB-2026-0001", {
      name: "consult.status_changed",
      input: { leadCode: "KB-2026-0001", newStatus: "contacted" },
    });
    expect(res).toMatchObject({ ok: true });
    expect(notifyFn).toHaveBeenCalledTimes(1);
    const call = notifyFn.mock.calls[0]?.[0];
    expect(call.recipient.id).toBe(USER_ID);
    expect(call.recipient.locale).toBe("ru");
    expect(call.event.name).toBe("consult.status_changed");
    // Meta carries both id forms so the inbox can render either a
    // deep link by id (admin) or by code (customer URL).
    expect(call.meta).toEqual({ leadId: LEAD_ID, code: "KB-2026-0001" });
  });

  it("returns lead_not_found when the code does not resolve", async () => {
    const { deps, notifyFn } = makeDeps({ leadFound: false });
    const res = await dispatchLeadEventUsing(deps, "KB-XXXX-XXXX", {
      name: "consult.status_changed",
      input: { leadCode: "KB-XXXX-XXXX", newStatus: "contacted" },
    });
    expect(res).toEqual({ ok: false, reason: "lead_not_found" });
    expect(notifyFn).not.toHaveBeenCalled();
  });
});
