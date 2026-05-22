import type { Locale } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { newGuestId, signGuestCookie } from "./cookie";
import { ensureGuestUser, type EnsureDeps } from "./ensure-guest-user";

const SECRET = "test-secret-for-ensure-guest-user";

function makeDeps(overrides: Partial<EnsureDeps> = {}): {
  deps: EnsureDeps;
  setCookieSpy: ReturnType<typeof vi.fn>;
  upsertSpy: ReturnType<typeof vi.fn>;
} {
  const setCookieSpy = vi.fn();
  const upsertSpy = vi.fn(async ({ guestId }: { guestId: string; locale: Locale }) => ({
    id: `user-for-${guestId}`,
  }));
  const deps: EnsureDeps = {
    cookieValue: undefined,
    setCookie: setCookieSpy,
    userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0)",
    locale: "kz",
    secret: SECRET,
    upsertUser: upsertSpy,
    ...overrides,
  };
  return { deps, setCookieSpy, upsertSpy };
}

describe("ensureGuestUser", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("(a) no cookie + not a bot → issues a fresh cookie + creates User", async () => {
    const { deps, setCookieSpy, upsertSpy } = makeDeps({ cookieValue: undefined });

    const result = await ensureGuestUser(deps);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.cookieSet).toBe(true);
    expect(setCookieSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy.mock.calls[0]![0]).toEqual({
      guestId: result.guestId,
      locale: "kz",
    });
    // The cookie value the helper set is a valid signed envelope for
    // the same guestId it returned.
    const cookieValue = setCookieSpy.mock.calls[0]![0] as string;
    expect(cookieValue.startsWith(`${result.guestId}.`)).toBe(true);
  });

  it("(b) valid cookie + not a bot → reuses guestId, no new cookie, upsert is a no-op write", async () => {
    const existing = newGuestId();
    const signed = await signGuestCookie(existing, SECRET);
    const { deps, setCookieSpy, upsertSpy } = makeDeps({ cookieValue: signed });

    const result = await ensureGuestUser(deps);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.guestId).toBe(existing);
    expect(result.cookieSet).toBe(false);
    expect(setCookieSpy).not.toHaveBeenCalled();
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy.mock.calls[0]![0]).toEqual({ guestId: existing, locale: "kz" });
  });

  it("(c) cookie present but tampered → new guestId, new User, new cookie", async () => {
    const original = newGuestId();
    const signed = await signGuestCookie(original, SECRET);
    // Flip two chars of the signature so HMAC verify fails.
    const tampered = signed.slice(0, -2) + (signed.endsWith("AA") ? "BB" : "AA");
    const { deps, setCookieSpy, upsertSpy } = makeDeps({ cookieValue: tampered });

    const result = await ensureGuestUser(deps);

    expect(result.kind).toBe("ok");
    if (result.kind !== "ok") return;
    expect(result.guestId).not.toBe(original);
    expect(result.cookieSet).toBe(true);
    expect(setCookieSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy).toHaveBeenCalledTimes(1);
    expect(upsertSpy.mock.calls[0]![0]).toEqual({
      guestId: result.guestId,
      locale: "kz",
    });
  });

  it("(d) bot user-agent → no DB write, no cookie, returns kind=bot", async () => {
    for (const ua of [
      "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
      "Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)",
      "FacebookBot/1.0 (+https://developers.facebook.com/docs/sharing/webmasters/crawler)",
      "Mozilla/5.0 (compatible; YandexSpider/1.0)",
      "ApacheBench-Crawler/4.5",
    ]) {
      const { deps, setCookieSpy, upsertSpy } = makeDeps({ userAgent: ua });
      const result = await ensureGuestUser(deps);
      expect(result, ua).toEqual({ kind: "bot" });
      expect(setCookieSpy, ua).not.toHaveBeenCalled();
      expect(upsertSpy, ua).not.toHaveBeenCalled();
    }
  });

  it("(d') human-looking UA is not flagged as bot", async () => {
    const { deps, upsertSpy } = makeDeps({
      userAgent: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15",
    });
    const result = await ensureGuestUser(deps);
    expect(result.kind).toBe("ok");
    expect(upsertSpy).toHaveBeenCalledTimes(1);
  });

  it("(e) two concurrent calls with the same valid cookie → 1 row's worth of writes, identical userId", async () => {
    const existing = newGuestId();
    const signed = await signGuestCookie(existing, SECRET);

    // Single upsertSpy shared across both calls — mimics a real
    // Prisma upsert that resolves to the same row on contention.
    const upsertSpy = vi.fn(async ({ guestId }: { guestId: string; locale: Locale }) => ({
      id: `user-for-${guestId}`,
    }));
    const setCookieSpy = vi.fn();
    const deps: EnsureDeps = {
      cookieValue: signed,
      setCookie: setCookieSpy,
      userAgent: "Mozilla/5.0",
      locale: "kz",
      secret: SECRET,
      upsertUser: upsertSpy,
    };

    const [a, b] = await Promise.all([ensureGuestUser(deps), ensureGuestUser(deps)]);

    expect(a.kind).toBe("ok");
    expect(b.kind).toBe("ok");
    if (a.kind !== "ok" || b.kind !== "ok") return;
    expect(a.guestId).toBe(existing);
    expect(b.guestId).toBe(existing);
    expect(a.userId).toBe(b.userId);
    expect(setCookieSpy).not.toHaveBeenCalled();
    // Upsert is the write-path seam — both calls go through it, and
    // the unique constraint on User.guestId guarantees one row at the
    // database layer regardless of how many upserts are issued.
    expect(upsertSpy).toHaveBeenCalledTimes(2);
    for (const call of upsertSpy.mock.calls) {
      expect(call[0]).toEqual({ guestId: existing, locale: "kz" });
    }
  });

  it("honours the locale hint when creating a new guest", async () => {
    const { deps, upsertSpy } = makeDeps({ cookieValue: undefined, locale: "ru" });
    await ensureGuestUser(deps);
    expect(upsertSpy.mock.calls[0]![0]!.locale).toBe("ru");
  });

  it("falls back to locale=kz when no hint is provided", async () => {
    const { deps, upsertSpy } = makeDeps({ cookieValue: undefined, locale: undefined });
    await ensureGuestUser(deps);
    expect(upsertSpy.mock.calls[0]![0]!.locale).toBe("kz");
  });
});
