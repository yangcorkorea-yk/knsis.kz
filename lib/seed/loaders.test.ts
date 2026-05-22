/*
 * lib/seed/loaders.test.ts — in-memory fake Prisma to prove the
 * loaders are idempotent and validate enums / FKs without hitting
 * a real database. Vitest sandbox has no Postgres.
 *
 * The fake only implements the operations the loaders touch
 * (findUnique by slug/email/code, findMany, create, count). No
 * deletes, no transactions — neither path is taken by seed code.
 */

import { describe, expect, it } from "vitest";
import { seedClinics, seedReviews, seedTreatments } from "./loaders";

type Row = Record<string, unknown>;

interface FakeStore {
  treatment: Row[];
  clinic: Row[];
  user: Row[];
  review: Row[];
}

function makeFakePrisma(): { client: unknown; store: FakeStore } {
  const store: FakeStore = { treatment: [], clinic: [], user: [], review: [] };
  let uuid = 0;
  const nextId = () => `00000000-0000-0000-0000-${String(uuid++).padStart(12, "0")}`;

  const table = (rows: Row[]) => ({
    findUnique: async ({ where }: { where: Row }) => {
      const key = Object.keys(where)[0]!;
      return rows.find((r) => r[key] === where[key]) ?? null;
    },
    findMany: async ({
      where,
      select: _s,
    }: {
      where?: { slug?: { in: string[] } };
      select?: Row;
    }) => {
      if (where?.slug?.in) {
        return rows.filter((r) => where.slug!.in.includes(r.slug as string));
      }
      return [...rows];
    },
    create: async ({ data, select: _s }: { data: Row; select?: Row }) => {
      const row = { id: nextId(), createdAt: new Date(), ...data };
      rows.push(row);
      return row;
    },
  });

  const client = {
    treatment: table(store.treatment),
    clinic: table(store.clinic),
    user: table(store.user),
    review: table(store.review),
  };
  return { client, store };
}

const TREATMENTS_CSV = `slug,category,title_kz,summary_kz,durationMin,recovery_kz,expects_kz
a-one,pigment,Бір,Қысқа сипат,30,Жылдам,Жақсы|Шай
a-two,botox,Екі,Қысқа сипат,15,Бірден,V-форма`;

const CLINICS_CSV = `slug,kind,name_kz,city,country,verifyState,hours,interpreters,treatment_slugs
clinic-a,korea,Клиника А,Сеул,KR,verified,"{""mon-fri"":""10:00-19:00""}",ru|kz,a-one|a-two
clinic-b,local,Клиника Б,Алматы,KZ,pending,"{""mon-sun"":""09:00-18:00""}",kz,a-one`;

const REVIEWS_CSV = `code,customer_slug,customer_name,rating,clinic_slug,treatment_slug,state,body_kz
KB-RV-T-0001,aliya,Әлия,5,clinic-a,a-one,published,Жақсы тәжірибе.
KB-RV-T-0002,aliya,Әлия,4,clinic-b,a-one,published,Жайлы орта.`;

describe("seedTreatments", () => {
  it("creates rows on first run, no-op on second", async () => {
    const { client, store } = makeFakePrisma();
    const r1 = await seedTreatments(client as never, TREATMENTS_CSV);
    expect(r1).toEqual({ created: 2, existing: 0 });
    expect(store.treatment).toHaveLength(2);

    const r2 = await seedTreatments(client as never, TREATMENTS_CSV);
    expect(r2).toEqual({ created: 0, existing: 2 });
    expect(store.treatment).toHaveLength(2);
  });

  it("title/summary land as KZ-only with null ru/kr (M7 review fills the rest)", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    expect(store.treatment[0]!.title).toEqual({ kz: "Бір", ru: null, kr: null });
    expect(store.treatment[0]!.expects).toEqual({ kz: ["Жақсы", "Шай"], ru: [], kr: [] });
  });

  it("rejects unknown TreatmentCategory values", async () => {
    const { client } = makeFakePrisma();
    const bad = TREATMENTS_CSV.replace("pigment", "not_a_category");
    await expect(seedTreatments(client as never, bad)).rejects.toThrow(
      /Invalid treatment.category/,
    );
  });
});

describe("seedClinics", () => {
  it("creates rows + links treatmentIds by slug → uuid", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    const r1 = await seedClinics(client as never, CLINICS_CSV);
    expect(r1).toEqual({ created: 2, existing: 0 });
    const clinicA = store.clinic.find((c) => c.slug === "clinic-a")!;
    expect((clinicA.treatmentIds as string[]).length).toBe(2);
    expect((clinicA.location as Row).city).toBe("Сеул");
  });

  it("idempotent on re-run", async () => {
    const { client } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    await seedClinics(client as never, CLINICS_CSV);
    const r2 = await seedClinics(client as never, CLINICS_CSV);
    expect(r2).toEqual({ created: 0, existing: 2 });
  });

  it("rejects clinic referencing a missing treatment slug (fail-fast)", async () => {
    const { client } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    const bad = CLINICS_CSV.replace("a-one|a-two", "a-one|does-not-exist");
    await expect(seedClinics(client as never, bad)).rejects.toThrow(/unknown treatment slug/);
  });
});

describe("seedReviews", () => {
  it("creates seed-customer User rows + Review rows; FK round-trip works", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    await seedClinics(client as never, CLINICS_CSV);
    const r1 = await seedReviews(client as never, REVIEWS_CSV);

    expect(r1.reviews).toEqual({ created: 2, existing: 0 });
    // Both reviews share customer_slug "aliya" → one User row.
    expect(r1.customers.created).toBe(1);
    expect(store.user).toHaveLength(1);
    expect(store.user[0]!.email).toBe("seed-aliya@knsis.kz");
    expect(store.user[0]!.role).toBe("customer");
    expect(store.user[0]!.consentTos).toBe(true);
    expect(store.review).toHaveLength(2);
  });

  it("re-run is idempotent — reviews + customer rows untouched", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    await seedClinics(client as never, CLINICS_CSV);
    await seedReviews(client as never, REVIEWS_CSV);
    const r2 = await seedReviews(client as never, REVIEWS_CSV);
    expect(r2.reviews).toEqual({ created: 0, existing: 2 });
    expect(store.review).toHaveLength(2);
    expect(store.user).toHaveLength(1);
  });

  it("rejects rating outside 1-5", async () => {
    const { client } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    await seedClinics(client as never, CLINICS_CSV);
    const bad = REVIEWS_CSV.replace(",5,clinic-a", ",6,clinic-a");
    await expect(seedReviews(client as never, bad)).rejects.toThrow(/rating/);
  });

  it("rejects unknown ReviewState", async () => {
    const { client } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    await seedClinics(client as never, CLINICS_CSV);
    const bad = REVIEWS_CSV.replace("published", "best-ever");
    await expect(seedReviews(client as never, bad)).rejects.toThrow(/review.state/);
  });
});
