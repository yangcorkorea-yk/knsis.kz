/*
 * lib/leads/create.test.ts — pin the lead-create orchestration
 * via injected deps (no Prisma in the test path).
 */

import { describe, expect, it, vi } from "vitest";
import { createLead, type CreateLeadDeps } from "./create";
import type { LeadSubmit } from "./schema";

function makePayload(overrides: Partial<LeadSubmit> = {}): LeadSubmit {
  return {
    phone: "+77012345678",
    name: "Aigerim",
    whatsappId: undefined,
    telegramId: undefined,
    preferredLanguage: "kr",
    treatmentSlugs: ["botox-jaw"],
    regions: ["seoul"],
    kind: ["korea"],
    photos: [],
    message: "test",
    consentTos: true,
    consentMkt: false,
    ...overrides,
  } as LeadSubmit;
}

function makeDeps(overrides: Partial<CreateLeadDeps> = {}): CreateLeadDeps {
  return {
    userId: "u1",
    idempotencyKey: undefined,
    findExistingByKey: vi.fn(async () => null),
    resolveTreatmentSlugs: vi.fn(async (slugs: string[]) =>
      slugs.map((s) => ({ slug: s, id: `id-${s}` })),
    ),
    makeCode: vi.fn(() => "KB-2026-0001"),
    updateUserConsent: vi.fn(async () => {}),
    insertLead: vi.fn(async (p) => ({ code: p.code })),
    isCodeUniqueViolation: () => false,
    ...overrides,
  };
}

describe("createLead", () => {
  it("happy path returns the generated code + reused=false", async () => {
    const result = await createLead(makePayload(), makeDeps());
    expect(result).toEqual({ ok: true, code: "KB-2026-0001", reused: false });
  });

  it("short-circuits on a matching idempotency key (returns existing code, reused=true)", async () => {
    const insertLead = vi.fn(async () => ({ code: "FRESH" }));
    const result = await createLead(
      makePayload(),
      makeDeps({
        idempotencyKey: "abc",
        findExistingByKey: vi.fn(async () => ({ code: "KB-2026-9999" })),
        insertLead,
      }),
    );
    expect(result).toEqual({ ok: true, code: "KB-2026-9999", reused: true });
    expect(insertLead).not.toHaveBeenCalled();
  });

  it("does NOT check idempotency when the header is absent", async () => {
    const findExistingByKey = vi.fn(async () => ({ code: "leaked" }));
    const result = await createLead(
      makePayload(),
      makeDeps({ idempotencyKey: undefined, findExistingByKey }),
    );
    expect(result.ok).toBe(true);
    expect(findExistingByKey).not.toHaveBeenCalled();
  });

  it("rejects with invalid_treatment when a slug doesn't resolve", async () => {
    const result = await createLead(
      makePayload({ treatmentSlugs: ["botox-jaw", "made-up"] }),
      makeDeps({
        resolveTreatmentSlugs: vi.fn(async () => [{ slug: "botox-jaw", id: "id-botox-jaw" }]),
      }),
    );
    expect(result).toEqual({ ok: false, code: "invalid_treatment" });
  });

  it("writes consent + phone + name to the user before inserting the lead", async () => {
    let captured: Parameters<CreateLeadDeps["updateUserConsent"]>[0] | undefined;
    const updateUserConsent: CreateLeadDeps["updateUserConsent"] = async (arg) => {
      captured = arg;
    };
    await createLead(
      makePayload({ name: "Asem", consentMkt: true }),
      makeDeps({ updateUserConsent }),
    );
    expect(captured).toBeDefined();
    expect(captured!.phone).toBe("+77012345678");
    expect(captured!.name).toBe("Asem");
    expect(captured!.consentTos).toBe(true);
    expect(captured!.consentMkt).toBe(true);
    expect(captured!.consentedAt).toBeInstanceOf(Date);
  });

  it("passes name=null when the form omitted it", async () => {
    let captured: Parameters<CreateLeadDeps["updateUserConsent"]>[0] | undefined;
    const updateUserConsent: CreateLeadDeps["updateUserConsent"] = async (arg) => {
      captured = arg;
    };
    await createLead(makePayload({ name: undefined }), makeDeps({ updateUserConsent }));
    expect(captured?.name).toBeNull();
  });

  it("trims and persists the message; null when blank", async () => {
    let captured: Parameters<CreateLeadDeps["insertLead"]>[0] | undefined;
    const insertLead: CreateLeadDeps["insertLead"] = async (p) => {
      captured = p;
      return { code: p.code };
    };
    await createLead(makePayload({ message: "  hello  " }), makeDeps({ insertLead }));
    expect(captured?.message).toBe("hello");

    await createLead(makePayload({ message: "   " }), makeDeps({ insertLead }));
    expect(captured?.message).toBeNull();
  });

  it("maps photo refs to path strings (drops mime)", async () => {
    let captured: Parameters<CreateLeadDeps["insertLead"]>[0] | undefined;
    const insertLead: CreateLeadDeps["insertLead"] = async (p) => {
      captured = p;
      return { code: p.code };
    };
    await createLead(
      makePayload({
        photos: [
          { path: "leads/u/a.jpg", mime: "image/jpeg" },
          { path: "leads/u/b.png", mime: "image/png" },
        ],
      }),
      makeDeps({ insertLead }),
    );
    expect(captured?.photos).toEqual(["leads/u/a.jpg", "leads/u/b.png"]);
  });

  it("retries up to MAX_CODE_RETRIES on a unique-code collision, succeeds on attempt N", async () => {
    let n = 0;
    const insertLead = vi.fn(async (p) => {
      n++;
      if (n < 3) throw new Error("dup");
      return { code: p.code };
    });
    const makeCode = vi.fn(() => `KB-${n}`);
    const result = await createLead(
      makePayload(),
      makeDeps({
        insertLead,
        makeCode,
        isCodeUniqueViolation: () => true,
      }),
    );
    expect(result.ok).toBe(true);
    expect(insertLead).toHaveBeenCalledTimes(3);
    expect(makeCode).toHaveBeenCalledTimes(3);
  });

  it("returns code_collision_exhausted after 5 consecutive unique-code collisions", async () => {
    const insertLead = vi.fn(async () => {
      throw new Error("dup");
    });
    const result = await createLead(
      makePayload(),
      makeDeps({ insertLead, isCodeUniqueViolation: () => true }),
    );
    expect(result).toEqual({ ok: false, code: "code_collision_exhausted" });
    expect(insertLead).toHaveBeenCalledTimes(5);
  });

  it("rethrows a non-collision insert error", async () => {
    const insertLead = vi.fn(async () => {
      throw new Error("db down");
    });
    await expect(
      createLead(makePayload(), makeDeps({ insertLead, isCodeUniqueViolation: () => false })),
    ).rejects.toThrow("db down");
  });

  it("locks channelPref to inapp (hard rule §8)", async () => {
    let captured: Parameters<CreateLeadDeps["insertLead"]>[0] | undefined;
    const insertLead: CreateLeadDeps["insertLead"] = async (p) => {
      captured = p;
      return { code: p.code };
    };
    await createLead(makePayload(), makeDeps({ insertLead }));
    expect(captured?.channelPref).toBe("inapp");
  });

  it("forwards whatsappId / telegramId / preferredLanguage to insertLead", async () => {
    let captured: Parameters<CreateLeadDeps["insertLead"]>[0] | undefined;
    const insertLead: CreateLeadDeps["insertLead"] = async (p) => {
      captured = p;
      return { code: p.code };
    };
    await createLead(
      makePayload({
        whatsappId: "+7 701 ...",
        telegramId: "@aigerim",
        preferredLanguage: "ru",
      }),
      makeDeps({ insertLead }),
    );
    expect(captured?.whatsappId).toBe("+7 701 ...");
    expect(captured?.telegramId).toBe("@aigerim");
    expect(captured?.preferredLanguage).toBe("ru");
  });

  it("passes nulls when WA / TG are omitted (form left empty)", async () => {
    let captured: Parameters<CreateLeadDeps["insertLead"]>[0] | undefined;
    const insertLead: CreateLeadDeps["insertLead"] = async (p) => {
      captured = p;
      return { code: p.code };
    };
    await createLead(makePayload(), makeDeps({ insertLead }));
    expect(captured?.whatsappId).toBeNull();
    expect(captured?.telegramId).toBeNull();
  });
});
