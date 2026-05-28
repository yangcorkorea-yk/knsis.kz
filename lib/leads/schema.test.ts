/*
 * lib/leads/schema.test.ts — Zod boundary contract for the M3
 * consult form + POST /api/leads.
 *
 * Pin the parse output so the FE form + the API handler stay in
 * lockstep — and so the consent + phone-normalisation rules can't
 * regress silently.
 */

import { describe, expect, it } from "vitest";
import {
  leadSubmitSchema,
  photoRefSchema,
  stepContactSchema,
  stepGoalSchema,
  stepPhotosSchema,
} from "./schema";

describe("stepContactSchema", () => {
  it("strips whitespace + dashes + parens and prepends + when missing", () => {
    const parsed = stepContactSchema.parse({
      phone: "7 (701) 234-56-78",
      name: " Aigerim ",
    });
    expect(parsed.phone).toBe("+77012345678");
    expect(parsed.name).toBe("Aigerim");
  });

  it("preserves a leading + if present", () => {
    const parsed = stepContactSchema.parse({ phone: "+77012345678" });
    expect(parsed.phone).toBe("+77012345678");
  });

  it("rejects an empty phone", () => {
    expect(() => stepContactSchema.parse({ phone: "" })).toThrow();
  });

  it("rejects a phone with too few digits", () => {
    expect(() => stepContactSchema.parse({ phone: "+7701" })).toThrow();
  });

  it("rejects a phone with non-digit characters after normalisation", () => {
    expect(() => stepContactSchema.parse({ phone: "+7770abcde123" })).toThrow();
  });

  it("makes name optional (undefined passes)", () => {
    const parsed = stepContactSchema.parse({ phone: "+77012345678" });
    expect(parsed.name).toBeUndefined();
  });

  it("rejects a name longer than 80 characters", () => {
    expect(() =>
      stepContactSchema.parse({ phone: "+77012345678", name: "x".repeat(81) }),
    ).toThrow();
  });
});

describe("stepGoalSchema", () => {
  it("requires at least one treatment slug", () => {
    expect(() =>
      stepGoalSchema.parse({ treatmentSlugs: [], regions: ["seoul"], kind: ["korea"] }),
    ).toThrow();
  });

  it("requires at least one region from the CITY_SLUGS whitelist", () => {
    expect(() =>
      stepGoalSchema.parse({ treatmentSlugs: ["botox-jaw"], regions: [], kind: ["korea"] }),
    ).toThrow();
  });

  it("rejects an unknown region slug", () => {
    expect(() =>
      stepGoalSchema.parse({
        treatmentSlugs: ["botox-jaw"],
        regions: ["new-york"],
        kind: ["korea"],
      }),
    ).toThrow();
  });

  it("requires at least one kind, only accepts korea|local", () => {
    expect(() =>
      stepGoalSchema.parse({
        treatmentSlugs: ["botox-jaw"],
        regions: ["seoul"],
        kind: [],
      }),
    ).toThrow();
    expect(() =>
      stepGoalSchema.parse({
        treatmentSlugs: ["botox-jaw"],
        regions: ["seoul"],
        kind: ["foreign"],
      }),
    ).toThrow();
  });

  it("accepts both kinds simultaneously (user is weighing options)", () => {
    const parsed = stepGoalSchema.parse({
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

  it("rejects unsupported MIMEs (server always re-encodes to jpeg/png)", () => {
    expect(() => photoRefSchema.parse({ path: "leads/abc/01.heic", mime: "image/heic" })).toThrow();
    expect(() => photoRefSchema.parse({ path: "leads/abc/01.webp", mime: "image/webp" })).toThrow();
  });
});

describe("stepPhotosSchema", () => {
  it("requires consentTos = true literally", () => {
    expect(() => stepPhotosSchema.parse({ consentTos: false })).toThrow();
    expect(() => stepPhotosSchema.parse({ consentTos: true })).not.toThrow();
  });

  it("defaults photos to [] and consentMkt to false", () => {
    const parsed = stepPhotosSchema.parse({ consentTos: true });
    expect(parsed.photos).toEqual([]);
    expect(parsed.consentMkt).toBe(false);
  });

  it("caps photos at 3", () => {
    expect(() =>
      stepPhotosSchema.parse({
        photos: Array.from({ length: 4 }, (_, i) => ({
          path: `leads/abc/${i}.jpg`,
          mime: "image/jpeg",
        })),
        consentTos: true,
      }),
    ).toThrow();
  });

  it("caps message at 2000 chars", () => {
    expect(() => stepPhotosSchema.parse({ message: "x".repeat(2001), consentTos: true })).toThrow();
  });
});

describe("leadSubmitSchema (merged)", () => {
  const valid = {
    phone: "+77012345678",
    treatmentSlugs: ["botox-jaw"],
    regions: ["seoul"],
    kind: ["korea"],
    photos: [],
    consentTos: true,
  } as const;

  it("accepts a minimal valid lead", () => {
    expect(() => leadSubmitSchema.parse(valid)).not.toThrow();
  });

  it("rejects without consentTos", () => {
    expect(() => leadSubmitSchema.parse({ ...valid, consentTos: false })).toThrow();
  });

  it("rejects with no treatments or no regions even when contact + consent are valid", () => {
    expect(() => leadSubmitSchema.parse({ ...valid, treatmentSlugs: [] })).toThrow();
    expect(() => leadSubmitSchema.parse({ ...valid, regions: [] })).toThrow();
  });
});
