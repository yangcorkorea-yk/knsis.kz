import { describe, expect, it, vi } from "vitest";
import { readEmailConfig, sendEmailUsing, type ResendLike } from "./email-client";

describe("readEmailConfig", () => {
  it("returns config when both vars set", () => {
    const res = readEmailConfig({
      RESEND_API_KEY: "re_test",
      RESEND_FROM: "x@example.test",
    });
    expect(res).toEqual({ apiKey: "re_test", from: "x@example.test" });
  });

  it("returns error when API key missing", () => {
    const res = readEmailConfig({ RESEND_FROM: "x@example.test" });
    expect("error" in res).toBe(true);
  });

  it("returns error when FROM missing", () => {
    const res = readEmailConfig({ RESEND_API_KEY: "re_test" });
    expect("error" in res).toBe(true);
  });
});

function makeClient(behaviour: "ok" | "error" | "throw" = "ok"): {
  client: ResendLike;
  sendFn: ReturnType<typeof vi.fn>;
} {
  const sendFn = vi.fn(async () => {
    if (behaviour === "throw") throw new Error("network down");
    if (behaviour === "error") {
      return { data: null, error: { message: "rate limited" } };
    }
    return { data: { id: "msg-123" }, error: null };
  });
  return { client: { emails: { send: sendFn } }, sendFn };
}

describe("sendEmailUsing", () => {
  it("returns ok + messageId on success", async () => {
    const { client } = makeClient("ok");
    const res = await sendEmailUsing(client, "x@example.test", {
      to: "u@example.test",
      subject: "s",
      text: "t",
    });
    expect(res).toEqual({ ok: true, messageId: "msg-123" });
  });

  it("forwards envelope fields to the underlying client", async () => {
    const { client, sendFn } = makeClient("ok");
    await sendEmailUsing(client, "from@example.test", {
      to: "to@example.test",
      subject: "subj",
      text: "body",
    });
    expect(sendFn).toHaveBeenCalledWith({
      from: "from@example.test",
      to: "to@example.test",
      subject: "subj",
      text: "body",
    });
  });

  it("returns send_failed with detail on Resend API error", async () => {
    const { client } = makeClient("error");
    const res = await sendEmailUsing(client, "x@example.test", {
      to: "u@example.test",
      subject: "s",
      text: "t",
    });
    expect(res).toEqual({ ok: false, code: "send_failed", detail: "rate limited" });
  });

  it("returns send_failed with detail when the client throws", async () => {
    const { client } = makeClient("throw");
    const res = await sendEmailUsing(client, "x@example.test", {
      to: "u@example.test",
      subject: "s",
      text: "t",
    });
    expect(res).toEqual({ ok: false, code: "send_failed", detail: "network down" });
  });

  it("falls back to 'unknown' when the client returns no id", async () => {
    const sendFn = vi.fn(async () => ({ data: {}, error: null }));
    const client: ResendLike = { emails: { send: sendFn } };
    const res = await sendEmailUsing(client, "x@example.test", {
      to: "u@example.test",
      subject: "s",
      text: "t",
    });
    expect(res).toEqual({ ok: true, messageId: "unknown" });
  });
});
