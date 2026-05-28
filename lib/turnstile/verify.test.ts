import { describe, expect, it, vi } from "vitest";
import { verifyTurnstileToken } from "./verify";

function jsonResponse(body: unknown, init: Partial<ResponseInit> = {}): Response {
  return new Response(JSON.stringify(body), {
    status: 200,
    headers: { "Content-Type": "application/json" },
    ...init,
  });
}

describe("verifyTurnstileToken", () => {
  it("skips when no secret is configured (dev mock)", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ success: true }));
    const r = await verifyTurnstileToken("anything", { secret: "", fetcher });
    expect(r).toEqual({ ok: true, skipped: true });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("rejects when secret is set but token is missing", async () => {
    const fetcher = vi.fn();
    const r = await verifyTurnstileToken(null, { secret: "S", fetcher });
    expect(r).toEqual({ ok: false, code: "turnstile_invalid" });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("happy path posts secret + response + (optional) remoteip", async () => {
    let capturedBody: string | undefined;
    const fetcher = vi.fn(async (_url, init?: RequestInit) => {
      const body = init?.body;
      capturedBody = body instanceof URLSearchParams ? body.toString() : String(body);
      return jsonResponse({ success: true });
    });
    const r = await verifyTurnstileToken("TOK", {
      secret: "S",
      fetcher,
      remoteIp: "1.2.3.4",
    });
    expect(r).toEqual({ ok: true, skipped: false });
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(capturedBody).toContain("secret=S");
    expect(capturedBody).toContain("response=TOK");
    expect(capturedBody).toContain("remoteip=1.2.3.4");
  });

  it("rejects when siteverify returns success=false", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ success: false }));
    const r = await verifyTurnstileToken("TOK", { secret: "S", fetcher });
    expect(r).toEqual({ ok: false, code: "turnstile_invalid" });
  });

  it("returns turnstile_unreachable on non-2xx HTTP", async () => {
    const fetcher = vi.fn(async () => jsonResponse({ success: true }, { status: 502 }));
    const r = await verifyTurnstileToken("TOK", { secret: "S", fetcher });
    expect(r).toEqual({ ok: false, code: "turnstile_unreachable" });
  });

  it("returns turnstile_unreachable on a network throw", async () => {
    const fetcher = vi.fn(async () => {
      throw new Error("ECONNREFUSED");
    });
    const r = await verifyTurnstileToken("TOK", { secret: "S", fetcher });
    expect(r).toEqual({ ok: false, code: "turnstile_unreachable" });
  });

  it("returns turnstile_unreachable on a non-JSON body", async () => {
    const fetcher = vi.fn(
      async () =>
        new Response("not json", { status: 200, headers: { "Content-Type": "text/plain" } }),
    );
    const r = await verifyTurnstileToken("TOK", { secret: "S", fetcher });
    expect(r).toEqual({ ok: false, code: "turnstile_unreachable" });
  });
});
