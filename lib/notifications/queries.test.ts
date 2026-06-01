import { describe, expect, it, vi } from "vitest";
import { markNotificationReadUsing, type NotifMarkDeps } from "./queries";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function makeDeps(opts?: { owns?: boolean }): {
  deps: NotifMarkDeps;
  markFn: ReturnType<typeof vi.fn>;
} {
  const markFn = vi.fn(async () => {});
  const deps: NotifMarkDeps = {
    ownsNotification: async () => opts?.owns !== false,
    markRead: markFn,
    markAllReadForUser: async () => ({ count: 0 }),
  };
  return { deps, markFn };
}

describe("markNotificationReadUsing — ownership gate", () => {
  it("marks read when the notification belongs to the user", async () => {
    const { deps, markFn } = makeDeps({ owns: true });
    const res = await markNotificationReadUsing(deps, { id: "n-1", userId: USER_ID });
    expect(res).toEqual({ ok: true });
    expect(markFn).toHaveBeenCalledWith("n-1");
  });

  it("refuses with not_owner when ownership check fails", async () => {
    const { deps, markFn } = makeDeps({ owns: false });
    const res = await markNotificationReadUsing(deps, { id: "n-1", userId: USER_ID });
    expect(res).toEqual({ ok: false, reason: "not_owner" });
    expect(markFn).not.toHaveBeenCalled();
  });
});
