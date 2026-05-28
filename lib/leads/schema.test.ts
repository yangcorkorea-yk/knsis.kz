/*
 * lib/leads/schema.test.ts — Zod boundary contract for the M3
 * single-page consult form + POST /api/leads.
 *
 * Pin the parse output so the FE form + the API handler stay in
 * lockstep — and so the consent + phone-normalisation +
 * Kazakhstan-contact-channel rules can't regress silently.
 */

import { describe, expect, it } from "vitest";
import {
  contactSchema,
  extrasSchema,
  goalSchema,
  leadSubmitSchema,
  photoRefSchema,
} from "./schema";

describe("contactSchema", () => {
  const base = {
    name: "Aigerim",
    phone: "+77012345678",
    preferredLanguage: "kr" as const,
  };

  it("happy path", () => {
    const parsed = contactSchema.parse(base);
    expect(parsed.phone).toBe("+77012345678");
    expect(parsed.name).toBe("Aigerim");
    expect(parsed.preferredLanguage).toBe("kr");
    expect(parsed.whatsappId).toBeUndefined();
    expect(parsed.telegramId).toBeUndefined();
  });

  it("strips whitespace + dashes + parens on phone and prepends + when missing", () => {
    const parsed = contactSchema.parse({ ...base, phone: "7 (701) 234-56-78" });
    expect(parsed.phone).toBe("+77012345678");
  });

  it("trims the name", () => {
    expect(contactSchema.parse({ ...base, name: " Aigerim " }).name).toBe("Aigerim");
  });

  it("rejects an empty name (now required per M3-polish PM decision)", () => {
    expect(() => contactSchema.parse({ ...base, name: "" })).toThrow();
    expect(() => contactSchema.parse({ ...base, name: "   " })).toThrow();
  });

  it("rejects an empty phone", () => {
    expect(() => contactSchema.parse({ ...base, phone: "" })).toThrow();
  });

  it("rejects a phone with too few digits", () => {
    expect(() => contactSchema.parse({ ...base, phone: "+7701" })).toThrow();
  });

  it("rejects a phone with non-digit characters after normalisation", () => {
    expect(() => contactSchema.parse({ ...base, phone: "+7770abcde123" })).toThrow();
  });

  it("rejects a name longer than 80 characters", () => {
    expect(() => contactSchema.parse({ ...base, name: "x".repeat(81) })).toThrow();
  });

  it("accepts whatsappId as a phone-format string", () => {
    const p = contactSchema.parse({ ...base, whatsappId: "+7 701 234 5678" });
    expect(p.whatsappId).toBe("+7 701 234 5678");
  });

  it("accepts telegramId as @username", () => {
    const p = contactSchema.parse({ ...base, telegramId: "@aigerim_bekova" });
    expect(p.telegramId).toBe("@aigerim_bekova");
  });

  it("treats empty-string whatsappId / telegramId as undefined", () => {
    const p = contactSchema.parse({ ...base, whatsappId: "", telegramId: "   " });
    expect(p.whatsappId).toBeUndefined();
    expect(p.telegramId).toBeUndefined();
  });

  it("rejects whatsappId / telegramId longer than 80 chars", () => {
    expect(() => contactSchema.parse({ ...base, whatsappId: "x".repeat(81) })).toThrow();
    expect(() => contactSchema.parse({ ...base, telegramId: "@" + "x".repeat(81) })).toThrow();
  });

  it("rejects an unknown preferredLanguage", () => {
    expect(() => contactSchema.parse({ ...base, preferredLanguage: "en" as never })).toThrow();
  });

  it("requires preferredLanguage", () => {
    expect(() => contactSchema.parse({ name: "A", phone: "+77012345678" } as never)).toThrow();
  });
});

describe("goalSchema", () => {
  it("requires at least one treatment slug", () => {
    expect(() =>
      goalSchema.parse({ treatmentSlugs: [], regions: ["seoul"], kind: ["korea"] }),
    ).toThrow();
  });

  it("requires at least one region from the CITY_SLUGS whitelist", () => {
    expect(() =>
      goalSchema.parse({ treatmentSlugs: ["botox-jaw"], regions: [], kind: ["korea"] }),
    ).toThrow();
  });

  it("rejects an unknown region slug", () => {
    expect(() =>
      goalSchema.parse({
        treatmentSlugs: ["botox-jaw"],
        regions: ["new-york"],
        kind: ["korea"],
      }),
    ).toThrow();
  });

  it("requires at least one kind, only accepts korea|local", () => {
    expect(() =>
      goalSchema.parse({ treatmentSlugs: ["botox-jaw"], regions: ["seoul"], kind: [] }),
    ).toThrow();
    expect(() =>
      goalSchema.parse({
        treatmentSlugs: ["botox-jaw"],
        regions: ["seoul"],
        kind: ["foreign"],
      }),
    ).toThrow();
  });

  it("accepts both kinds simultaneously", () => {
    const parsed = goalSchema.parse({
      treatmentSlugs: ["botox-jaw"],
      regions: ["seoul", "almaty"],
      kind: ["korea", "local"],
    });
    expect(parsed.kind).toEqual(["korea", "local"]);
    expect(parsed.regions).toEqual(["seoul", "almaty"]);
  });
});

describe("photoRefSchema", () => {
  it("accepts a Supabase Storage path + supported MIME", () => {
    expect(() =>
      photoRefSchema.parse({ path: "leads/abc/01.jpg", mime: "image/jpeg" }),
    ).not.toThrow();
    expect(() =>
      photoRefSchema.parse({ path: "leads/abc/01.png", mime: "image/png" }),
    ).not.toThrow();
  });

  it("rejects unsupported MIMEs", () => {
    expect(() => photoRefSchema.parse({ path: "leads/abc/01.heic", mime: "image/heic" })).toThrow();
    expect(() => photoRefSchema.parse({ path: "leads/abc/01.webp", mime: "image/webp" })).toThrow();
  });
});

describe("extrasSchema", () => {
  it("requires consentTos = true literally", () => {
    expect(() => extrasSchema.parse({ consentTos: false })).toThrow();
    expect(() => extrasSchema.parse({ consentTos: true })).not.toThrow();
  });

  it("defaults photos to [] and consentMkt to false", () => {
    const parsed = extrasSchema.parse({ consentTos: true });
    expect(parsed.photos).toEqual([]);
    expect(parsed.consentMkt).toBe(false);
  });

  it("caps photos at 3", () => {
    expect(() =>
      extrasSchema.parse({
        photos: Array.from({ length: 4 }, (_, i) => ({
          path: `leads/abc/${i}.jpg`,
          mime: "image/jpeg",
        })),
        consentTos: true,
      }),
    ).toThrow();
  });

  it("caps message at 2000 chars", () => {
    expect(() => extrasSchema.parse({ message: "x".repeat(2001), consentTos: true })).toThrow();
  });
});

describe("leadSubmitSchema (merged)", () => {
  const valid = {
    name: "Aigerim",
    phone: "+77012345678",
    preferredLanguage: "kr" as const,
    treatmentSlugs: ["botox-jaw"],
    regions: ["seoul"],
    kind: ["korea"],
    photos: [],
    consentTos: true,
  } as const;

  it("accepts a minimal valid lead", () => {
    expect(() => leadSubmitSchema.parse(valid)).not.toThrow();
  });

  it("accepts a lead with WhatsApp + Telegram IDs", () => {
    const r = leadSubmitSchema.parse({
      ...valid,
      whatsappId: "+7 701 234 5678",
      telegramId: "@aigerim",
    });
    expect(r.whatsappId).toBe("+7 701 234 5678");
    expect(r.telegramId).toBe("@aigerim");
  });

  it("rejects without consentTos", () => {
    expect(() => leadSubmitSchema.parse({ ...valid, consentTos: false })).toThrow();
  });

  it("rejects without name (now required)", () => {
    expect(() => leadSubmitSchema.parse({ ...valid, name: "" })).toThrow();
  });

  it("rejects with no treatments or no regions", () => {
    expect(() => leadSubmitSchema.parse({ ...valid, treatmentSlugs: [] })).toThrow();
    expect(() => leadSubmitSchema.parse({ ...valid, regions: [] })).toThrow();
  });
});
