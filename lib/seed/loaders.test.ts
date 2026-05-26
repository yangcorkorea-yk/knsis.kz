/*
 * lib/seed/loaders.test.ts — in-memory fake Prisma to prove the
 * loaders are idempotent and validate enums / FKs without hitting
 * a real database. Vitest sandbox has no Postgres.
 *
 * The fake implements only the operations the loaders touch
 * (findUnique by slug/email/code, findMany, create, update). No
 * deletes, no transactions — neither path is taken by seed code.
 *
 * Fixture CSVs carry kz + ru + kr columns since M2-09's i18n
 * expansion — see `docs/runbook/i18n-dynamic-content.md`. The
 * fill-blanks merge on re-run is exercised below: a row with a
 * locale already populated must NOT be overwritten by the CSV.
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
    update: async ({ where, data }: { where: Row; data: Row }) => {
      const key = Object.keys(where)[0]!;
      const target = rows.find((r) => r[key] === where[key]);
      if (!target) throw new Error(`fake.update miss: ${key}=${String(where[key])}`);
      Object.assign(target, data);
      return target;
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

const TREATMENTS_CSV = `slug,category,title_kz,title_ru,title_kr,summary_kz,summary_ru,summary_kr,durationMin,recovery_kz,recovery_ru,recovery_kr,expects_kz,expects_ru,expects_kr
a-one,pigment,Бір,Один,일번,Қысқа,Кратко,짧음,30,Жылдам,Быстро,빠르게,Жақсы|Шай,Хорошо|Чай,좋음|차
a-two,botox,Екі,Два,이번,Қысқа,Кратко,짧음,15,Бірден,Сразу,즉시,V-форма,V-форма,V라인`;

const TREATMENTS_CSV_KZ_ONLY = `slug,category,title_kz,title_ru,title_kr,summary_kz,summary_ru,summary_kr,durationMin,recovery_kz,recovery_ru,recovery_kr,expects_kz,expects_ru,expects_kr
a-three,acne,Үш,,,Қысқа,,,20,Жеңіл,,,Тазалық,,`;

const CLINICS_CSV = `slug,kind,name_kz,name_ru,name_kr,city,city_kr,country,verifyState,hours,interpreters,treatment_slugs
clinic-a,korea,Клиника А,Клиника А ру,클리닉 A,Сеул,서울,KR,verified,"{""mon-fri"":""10:00-19:00""}",ru|kz,a-one|a-two
clinic-b,local,Клиника Б,Клиника Б ру,클리닉 B,Алматы,알마티,KZ,pending,"{""mon-sun"":""09:00-18:00""}",kz,a-one`;

const REVIEWS_CSV = `code,customer_slug,customer_name,rating,clinic_slug,treatment_slug,state,body_kz
KB-RV-T-0001,aliya,Әлия,5,clinic-a,a-one,published,Жақсы тәжірибе.
KB-RV-T-0002,aliya,Әлия,4,clinic-b,a-one,published,Жайлы орта.`;

describe("seedTreatments", () => {
  it("creates rows on first run, no NEW rows on second", async () => {
    const { client, store } = makeFakePrisma();
    const r1 = await seedTreatments(client as never, TREATMENTS_CSV);
    expect(r1).toEqual({ created: 2, updated: 0, unchanged: 0 });
    expect(store.treatment).toHaveLength(2);

    // Same CSV, every locale slot already filled → no updates, no new rows.
    const r2 = await seedTreatments(client as never, TREATMENTS_CSV);
    expect(r2).toEqual({ created: 0, updated: 0, unchanged: 2 });
    expect(store.treatment).toHaveLength(2);
  });

  it("writes the trilingual title/summary/recovery/expects from kz+ru+kr columns", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    expect(store.treatment[0]!.title).toEqual({ kz: "Бір", ru: "Один", kr: "일번" });
    expect(store.treatment[0]!.summary).toEqual({ kz: "Қысқа", ru: "Кратко", kr: "짧음" });
    expect(store.treatment[0]!.recovery).toEqual({
      kz: "Жылдам",
      ru: "Быстро",
      kr: "빠르게",
    });
    expect(store.treatment[0]!.expects).toEqual({
      kz: ["Жақсы", "Шай"],
      ru: ["Хорошо", "Чай"],
      kr: ["좋음", "차"],
    });
  });

  it("leaves ru/kr null when a CSV cell is empty (KZ-only row falls back at the consumer)", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV_KZ_ONLY);
    expect(store.treatment[0]!.title).toEqual({ kz: "Үш", ru: null, kr: null });
    expect(store.treatment[0]!.expects).toEqual({ kz: ["Тазалық"], ru: [], kr: [] });
  });

  it("fill-blanks merge: existing non-null locale wins over the CSV value", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    // Simulate an M7 reviewer edit: a hand-corrected RU title in DB.
    const target = store.treatment[0]!;
    (target.title as Record<string, string>).ru = "Один (исправлено редактором)";

    // Re-run seed — the curated RU value must survive, no update fires.
    const r = await seedTreatments(client as never, TREATMENTS_CSV);
    expect(r).toEqual({ created: 0, updated: 0, unchanged: 2 });
    expect((target.title as Record<string, string>).ru).toBe("Один (исправлено редактором)");
    expect((target.title as Record<string, string>).kz).toBe("Бір");
    expect((target.title as Record<string, string>).kr).toBe("일번");
  });

  it("fill-blanks merge: CSV-new locale lands when previous row had it null", async () => {
    const { client, store } = makeFakePrisma();
    const r1 = await seedTreatments(client as never, TREATMENTS_CSV_KZ_ONLY);
    expect(r1).toEqual({ created: 1, updated: 0, unchanged: 0 });
    expect((store.treatment[0]!.title as Record<string, string | null>).ru).toBeNull();

    // Operator updates the CSV with a freshly translated RU title and re-runs.
    const filled = TREATMENTS_CSV_KZ_ONLY.replace(",Үш,,,", ",Үш,Три,삼번,");
    const r2 = await seedTreatments(client as never, filled);
    expect(r2).toEqual({ created: 0, updated: 1, unchanged: 0 });
    expect((store.treatment[0]!.title as Record<string, string | null>).ru).toBe("Три");
    expect((store.treatment[0]!.title as Record<string, string | null>).kr).toBe("삼번");
  });

  // Regression for the M2-09 fill-blanks bug surfaced at PR #7
  // sign-off. Production rows from PR #3 seed had {kz, ru: null,
  // kr: null}; the loader has to detect the null slots, call
  // prisma.update, and persist all three locales. The fake's update
  // mocks prisma's behaviour 1:1 (Object.assign on the row), so a
  // failing update path here would have surfaced earlier — but we
  // pin the integration shape explicitly now.
  it("KZ-only existing row + 3-locale CSV → updates count + persisted JSON has all 3 locales", async () => {
    const { client, store } = makeFakePrisma();
    // Plant a KZ-only row simulating the PR #3 production state.
    store.treatment.push({
      id: "fixture-0001",
      slug: "a-one",
      category: "pigment",
      title: { kz: "Бір", ru: null, kr: null },
      summary: { kz: "Қысқа", ru: null, kr: null },
      durationMin: 30,
      recovery: { kz: "Жылдам", ru: null, kr: null },
      expects: { kz: ["Жақсы"], ru: [], kr: [] },
      createdAt: new Date(),
    });

    const r = await seedTreatments(client as never, TREATMENTS_CSV);
    // a-one updates (blanks filled); a-two creates.
    expect(r.created).toBe(1);
    expect(r.updated).toBe(1);
    expect(r.unchanged).toBe(0);

    const refreshed = store.treatment.find((t) => t.slug === "a-one")!;
    expect(refreshed.title).toEqual({ kz: "Бір", ru: "Один", kr: "일번" });
    expect(refreshed.summary).toEqual({ kz: "Қысқа", ru: "Кратко", kr: "짧음" });
    expect(refreshed.expects).toEqual({
      kz: ["Жақсы"],
      ru: ["Хорошо", "Чай"],
      kr: ["좋음", "차"],
    });
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
    expect(r1).toEqual({ created: 2, updated: 0, unchanged: 0 });
    const clinicA = store.clinic.find((c) => c.slug === "clinic-a")!;
    expect((clinicA.treatmentIds as string[]).length).toBe(2);
    expect((clinicA.location as Row).city).toBe("Сеул");
  });

  it("stores cityI18n alongside the flat city so KR users see Korean", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    await seedClinics(client as never, CLINICS_CSV);
    const clinicA = store.clinic.find((c) => c.slug === "clinic-a")!;
    expect((clinicA.location as Row).cityI18n).toEqual({
      kz: "Сеул",
      ru: "Сеул",
      kr: "서울",
    });
  });

  it("name lands as trilingual from name_kz/name_ru/name_kr", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    await seedClinics(client as never, CLINICS_CSV);
    expect(store.clinic[0]!.name).toEqual({
      kz: "Клиника А",
      ru: "Клиника А ру",
      kr: "클리닉 A",
    });
  });

  it("re-run is idempotent (no NEW rows) and fill-blanks merge applies to name", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    await seedClinics(client as never, CLINICS_CSV);
    // Hand-edit the KR name to simulate a reviewer pass.
    (store.clinic[0]!.name as Record<string, string>).kr = "수동 수정 클리닉";
    const r2 = await seedClinics(client as never, CLINICS_CSV);
    expect(r2).toEqual({ created: 0, updated: 0, unchanged: 2 });
    expect((store.clinic[0]!.name as Record<string, string>).kr).toBe("수동 수정 클리닉");
  });

  // Regression for the M2-09 clinic fill-blanks bug (twin of the
  // treatment-side regression): legacy production row has KZ-only
  // name + no cityI18n; re-seed must persist name.ru / name.kr AND
  // location.cityI18n on the existing row.
  it("legacy KZ-only clinic + 3-locale CSV → name + cityI18n persisted", async () => {
    const { client, store } = makeFakePrisma();
    await seedTreatments(client as never, TREATMENTS_CSV);
    store.clinic.push({
      id: "fixture-clinic-0001",
      slug: "clinic-a",
      kind: "korea",
      name: { kz: "Клиника А", ru: null, kr: null },
      location: { country: "KR", city: "Сеул" },
      interpreters: ["ru", "kz"],
      treatmentIds: store.treatment.map((t) => t.id),
      verifyState: "verified",
      hours: { "mon-fri": "10:00-19:00" },
      createdAt: new Date(),
    });
    const r = await seedClinics(client as never, CLINICS_CSV);
    expect(r.updated).toBe(1);
    expect(r.created).toBe(1); // clinic-b is new
    const refreshed = store.clinic.find((c) => c.slug === "clinic-a")!;
    expect(refreshed.name).toEqual({ kz: "Клиника А", ru: "Клиника А ру", kr: "클리닉 A" });
    expect((refreshed.location as Record<string, unknown>).cityI18n).toEqual({
      kz: "Сеул",
      ru: "Сеул",
      kr: "서울",
    });
  });

  it("rejects clinic referencing a missing treatment slug (fail-fast on first create)", async () => {
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
