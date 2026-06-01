import { describe, expect, it, vi } from "vitest";
import { createKoreaVisitUsing, leadShapeForKv, type KvCreateDeps } from "./create";
import { kvSubmitSchema, type KvSubmit } from "./schema";

const USER_ID = "11111111-1111-4111-8111-111111111111";

function validPayload(overrides: Partial<KvSubmit> = {}): KvSubmit {
  // Build then parse so superRefine ordering matches production.
  const today = new Date();
  const from = today.toISOString().slice(0, 10);
  const to = new Date(today.getTime() + 14 * 86400000).toISOString().slice(0, 10);
  return kvSubmitSchema.parse({
    dateFrom: from,
    dateTo: to,
    airport: "ICN",
    hotelPref: "Myeongdong area",
    interpreter: "ru",
    aftercareDays: 7,
    notes: "",
    name: "Aigerim Bekova",
    phone: "+7 701 234 5678",
    email: "",
    whatsappId: "",
    telegramId: "",
    preferredLanguage: "ru",
    consentTos: true,
    consentMkt: false,
    ...overrides,
  });
}

function makeDeps(opts?: { codes?: string[]; failures?: ("collision" | "fatal")[] }): {
  deps: KvCreateDeps;
  consentCalls: ReturnType<typeof vi.fn>;
  insertCalls: ReturnType<typeof vi.fn>;
} {
  const codes = opts?.codes ?? ["KB-2026-AAAA"];
  const failures = opts?.failures ?? [];
  let attempt = 0;
  const consentCalls = vi.fn(async () => {});
  const insertCalls = vi.fn(async (input: { code: string }) => {
    const failureMode = failures[attempt];
    attempt += 1;
    if (failureMode === "fatal") throw new Error("db boom");
    if (failureMode === "collision") {
      const err = new Error("Unique constraint failed");
      (err as Error & { code: string }).code = "P2002";
      throw err;
    }
    return { code: input.code };
  });
  const deps: KvCreateDeps = {
    userId: USER_ID,
    makeCode: () => codes[Math.min(attempt, codes.length - 1)] ?? "FALLBACK",
    updateUserConsent: consentCalls,
    insertLeadAndVisit: insertCalls,
    isCodeUniqueViolation: (e) => (e as Error & { code?: string })?.code === "P2002",
  };
  return { deps, consentCalls, insertCalls };
}

describe("createKoreaVisitUsing — happy path", () => {
  it("records consent then inserts; returns the inserted code", async () => {
    const { deps, consentCalls, insertCalls } = makeDeps();
    const res = await createKoreaVisitUsing(validPayload(), deps);
    expect(res).toEqual({ ok: true, code: "KB-2026-AAAA" });
    expect(consentCalls).toHaveBeenCalledTimes(1);
    expect(insertCalls).toHaveBeenCalledTimes(1);
    expect(consentCalls.mock.calls[0]?.[0]).toMatchObject({
      userId: USER_ID,
      phone: "+7 701 234 5678",
      name: "Aigerim Bekova",
      consentTos: true,
    });
  });

  it("coerces date strings into Date objects on the visit payload", async () => {
    const { deps, insertCalls } = makeDeps();
    const payload = validPayload({ dateFrom: "2026-09-01", dateTo: "2026-09-10" });
    await createKoreaVisitUsing(payload, deps);
    const args = insertCalls.mock.calls[0]?.[0] as {
      visit: { dateFrom: Date; dateTo: Date };
    };
    expect(args.visit.dateFrom).toBeInstanceOf(Date);
    expect(args.visit.dateTo).toBeInstanceOf(Date);
    expect(args.visit.dateFrom.toISOString().slice(0, 10)).toBe("2026-09-01");
    expect(args.visit.dateTo.toISOString().slice(0, 10)).toBe("2026-09-10");
  });

  it("nulls out empty-string optionals (hotelPref, notes, email, WA, TG)", async () => {
    const { deps, insertCalls, consentCalls } = makeDeps();
    await createKoreaVisitUsing(
      validPayload({
        hotelPref: "",
        notes: "",
        email: "",
        whatsappId: "",
        telegramId: "",
      }),
      deps,
    );
    const insertArgs = insertCalls.mock.calls[0]?.[0] as {
      whatsappId: string | null;
      telegramId: string | null;
      visit: { hotelPref: string | null; notes: string | null };
    };
    expect(insertArgs.whatsappId).toBeNull();
    expect(insertArgs.telegramId).toBeNull();
    expect(insertArgs.visit.hotelPref).toBeNull();
    expect(insertArgs.visit.notes).toBeNull();
    expect((consentCalls.mock.calls[0]?.[0] as { email: string | null }).email).toBeNull();
  });
});

describe("createKoreaVisitUsing — code collision retry", () => {
  it("retries on unique-violation up to 5 times then succeeds", async () => {
    const { deps, insertCalls } = makeDeps({
      codes: ["A", "B", "C", "D", "E"],
      failures: ["collision", "collision", "collision"],
    });
    const res = await createKoreaVisitUsing(validPayload(), deps);
    expect(res).toEqual({ ok: true, code: "D" });
    expect(insertCalls).toHaveBeenCalledTimes(4);
  });

  it("returns code_collision_exhausted after 5 collisions", async () => {
    const { deps, insertCalls } = makeDeps({
      codes: ["A", "B", "C", "D", "E"],
      failures: ["collision", "collision", "collision", "collision", "collision"],
    });
    const res = await createKoreaVisitUsing(validPayload(), deps);
    expect(res).toEqual({ ok: false, code: "code_collision_exhausted" });
    expect(insertCalls).toHaveBeenCalledTimes(5);
  });

  it("propagates non-collision errors immediately", async () => {
    const { deps, insertCalls } = makeDeps({
      codes: ["A"],
      failures: ["fatal"],
    });
    await expect(createKoreaVisitUsing(validPayload(), deps)).rejects.toThrow("db boom");
    expect(insertCalls).toHaveBeenCalledTimes(1);
  });
});

describe("kvSubmitSchema validation", () => {
  it("rejects when dateTo is before dateFrom", () => {
    expect(() =>
      kvSubmitSchema.parse({
        dateFrom: "2026-09-10",
        dateTo: "2026-09-01",
        airport: "ICN",
        hotelPref: "",
        interpreter: null,
        aftercareDays: null,
        notes: "",
        name: "X",
        phone: "+7 701 234 5678",
        email: "",
        whatsappId: "",
        telegramId: "",
        preferredLanguage: "ru",
        consentTos: true,
        consentMkt: false,
      }),
    ).toThrow(/dates_swapped/);
  });

  it("rejects when dateTo is more than 18 months past dateFrom", () => {
    expect(() =>
      kvSubmitSchema.parse({
        dateFrom: "2026-01-01",
        dateTo: "2028-01-01",
        airport: null,
        hotelPref: "",
        interpreter: null,
        aftercareDays: null,
        notes: "",
        name: "X",
        phone: "+7 701 234 5678",
        email: "",
        whatsappId: "",
        telegramId: "",
        preferredLanguage: "kz",
        consentTos: true,
        consentMkt: false,
      }),
    ).toThrow(/dates_too_far/);
  });

  it("rejects when consentTos is false", () => {
    expect(() =>
      kvSubmitSchema.parse({
        dateFrom: "2026-09-01",
        dateTo: "2026-09-05",
        airport: null,
        hotelPref: "",
        interpreter: null,
        aftercareDays: null,
        notes: "",
        name: "X",
        phone: "+7 701 234 5678",
        email: "",
        whatsappId: "",
        telegramId: "",
        preferredLanguage: "kz",
        consentTos: false,
        consentMkt: false,
      }),
    ).toThrow();
  });

  it("rejects malformed phone", () => {
    expect(() =>
      kvSubmitSchema.parse({
        dateFrom: "2026-09-01",
        dateTo: "2026-09-05",
        airport: null,
        hotelPref: "",
        interpreter: null,
        aftercareDays: null,
        notes: "",
        name: "X",
        phone: "abc",
        email: "",
        whatsappId: "",
        telegramId: "",
        preferredLanguage: "kz",
        consentTos: true,
        consentMkt: false,
      }),
    ).toThrow(/phone_invalid/);
  });
});

describe("leadShapeForKv", () => {
  it("returns the hard-rule-safe Lead shape", () => {
    const shape = leadShapeForKv();
    expect(shape.kind).toEqual(["korea"]);
    expect(shape.regions).toEqual([]);
    expect(shape.treatmentIds).toEqual([]);
    expect(shape.channelPref).toBe("inapp");
    expect(shape.photos).toEqual([]);
  });
});
