/*
 * lib/messaging/notify.test.ts — dispatcher branches.
 *
 * Pure DI via notifyUsing — no live Prisma, no Resend SDK. Tests
 * lock the cross-PR contract (Settings writes notifChannels; the
 * dispatcher reads it on every send).
 */

import { describe, expect, it, vi } from "vitest";
import { notifyUsing, type NotifyDeps } from "./notify";
import type { EmailSendResult } from "./email-client";

const NOTIFICATION_ID = "11111111-1111-4111-8111-111111111111";
const USER_ID = "22222222-2222-4222-8222-222222222222";

function makeDeps(opts?: { emailResult?: EmailSendResult; createThrows?: boolean }): {
  deps: NotifyDeps;
  createCalls: ReturnType<typeof vi.fn>;
  sendCalls: ReturnType<typeof vi.fn>;
} {
  const createCalls = vi.fn(async () => {
    if (opts?.createThrows) throw new Error("db boom");
    return { id: NOTIFICATION_ID };
  });
  const sendCalls = vi.fn(
    async (): Promise<EmailSendResult> => opts?.emailResult ?? { ok: true, messageId: "msg-1" },
  );
  return {
    deps: {
      createNotification: createCalls,
      sendEmail: sendCalls,
    },
    createCalls,
    sendCalls,
  };
}

const baseEvent = {
  name: "consult.status_changed" as const,
  input: { leadCode: "KB-2026-0001", newStatus: "contacted" as const },
};

describe("notifyUsing — Notification row always writes", () => {
  it("writes a row with kind=consult and trilingual title/body", async () => {
    const { deps, createCalls } = makeDeps();
    await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: "user@example.test",
        locale: "kz",
        notifChannels: { inapp: true, email: true },
      },
      event: baseEvent,
      meta: { leadId: "lead-1" },
    });
    expect(createCalls).toHaveBeenCalledTimes(1);
    const call = createCalls.mock.calls[0]?.[0] as {
      userId: string;
      kind: string;
      title: Record<string, string>;
      body: Record<string, string>;
      meta: unknown;
    };
    expect(call.userId).toBe(USER_ID);
    expect(call.kind).toBe("consult");
    // Title snapshot in all 3 locales (the cross-locale contract).
    expect(call.title.kz).toContain("KB-2026-0001");
    expect(call.title.ru).toContain("KB-2026-0001");
    expect(call.title.kr).toContain("KB-2026-0001");
    expect(call.meta).toEqual({ leadId: "lead-1" });
  });

  it("returns the new notification id", async () => {
    const { deps } = makeDeps();
    const res = await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: "u@example.test",
        locale: "ru",
        notifChannels: { inapp: true, email: true },
      },
      event: baseEvent,
    });
    expect(res.notificationId).toBe(NOTIFICATION_ID);
  });
});

describe("notifyUsing — email leg", () => {
  it("sends via the dep + reports `sent`", async () => {
    const { deps, sendCalls } = makeDeps();
    const res = await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: "u@example.test",
        locale: "kr",
        notifChannels: { inapp: true, email: true },
      },
      event: baseEvent,
    });
    expect(res.email).toBe("sent");
    expect(sendCalls).toHaveBeenCalledTimes(1);
    // Locale-correct subject (status_changed template uses 한국어
    // wording for kr).
    const [to, subject, text] = sendCalls.mock.calls[0]!;
    expect(to).toBe("u@example.test");
    expect(subject).toContain("KB-2026-0001");
    expect(subject).toContain("[knsis.kz]");
    expect(text).toBeTruthy();
  });

  it("skips with `skipped_pref` when notifChannels.email = false", async () => {
    const { deps, sendCalls } = makeDeps();
    const res = await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: "u@example.test",
        locale: "kz",
        notifChannels: { inapp: true, email: false },
      },
      event: baseEvent,
    });
    expect(res.email).toBe("skipped_pref");
    expect(sendCalls).not.toHaveBeenCalled();
  });

  it("skips with `skipped_no_address` when recipient has null email", async () => {
    const { deps, sendCalls } = makeDeps();
    const res = await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: null,
        locale: "ru",
        notifChannels: { inapp: true, email: true },
      },
      event: baseEvent,
    });
    expect(res.email).toBe("skipped_no_address");
    expect(sendCalls).not.toHaveBeenCalled();
  });

  it("returns `failed` and the detail on Resend error — does NOT roll back the row", async () => {
    const { deps, createCalls } = makeDeps({
      emailResult: { ok: false, code: "send_failed", detail: "rate limited" },
    });
    const res = await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: "u@example.test",
        locale: "kz",
        notifChannels: { inapp: true, email: true },
      },
      event: baseEvent,
    });
    expect(res.email).toBe("failed");
    expect(res.emailDetail).toEqual({
      ok: false,
      code: "send_failed",
      detail: "rate limited",
    });
    // Row still wrote — email failure is non-fatal.
    expect(createCalls).toHaveBeenCalledTimes(1);
    expect(res.notificationId).toBe(NOTIFICATION_ID);
  });

  it("treats null notifChannels as opt-in (matches migration default)", async () => {
    const { deps, sendCalls } = makeDeps();
    await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: "u@example.test",
        locale: "kz",
        notifChannels: null,
      },
      event: baseEvent,
    });
    expect(sendCalls).toHaveBeenCalledTimes(1);
  });
});

describe("notifyUsing — Notification row failure propagates", () => {
  it("rethrows when the row write throws; email not attempted", async () => {
    const { deps, sendCalls } = makeDeps({ createThrows: true });
    await expect(
      notifyUsing(deps, {
        recipient: {
          id: USER_ID,
          email: "u@example.test",
          locale: "kz",
          notifChannels: { inapp: true, email: true },
        },
        event: baseEvent,
      }),
    ).rejects.toThrow("db boom");
    expect(sendCalls).not.toHaveBeenCalled();
  });
});

describe("notify-templates — locale picks the right text", () => {
  it("status_changed → ru subject in Cyrillic", async () => {
    const { deps, sendCalls } = makeDeps();
    await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: "u@example.test",
        locale: "ru",
        notifChannels: { inapp: true, email: true },
      },
      event: baseEvent,
    });
    const subject = sendCalls.mock.calls[0]?.[1] as string;
    // Russian status word for "contacted".
    expect(subject).toContain("связи");
  });

  it("status_changed → kr subject in Hangul", async () => {
    const { deps, sendCalls } = makeDeps();
    await notifyUsing(deps, {
      recipient: {
        id: USER_ID,
        email: "u@example.test",
        locale: "kr",
        notifChannels: { inapp: true, email: true },
      },
      event: baseEvent,
    });
    const subject = sendCalls.mock.calls[0]?.[1] as string;
    expect(subject).toMatch(/[가-힣]/);
  });
});
