/*
 * lib/seed/loaders.ts — domain loaders for the M2-09 seed pipeline.
 *
 * Reads /seed/{treatments,clinics,reviews}.csv and upserts the
 * corresponding Prisma rows.
 *
 * i18n policy (revised at the M2-03 visual sign-off — see
 * `docs/runbook/i18n-dynamic-content.md`): the seed CSV is the
 * source of truth for kz + ru + kr at first-write time. KZ
 * fallback visible to a RU or KR user is a launch-quality bug,
 * not a deferred-to-M7 cosmetic. The CSV carries all three
 * columns; loaders write the trilingual JSON on create.
 *
 * On a re-run with new translations in the CSV, the loaders
 * fill **blanks only** — any locale slot that's already non-null
 * in the existing row wins (so an admin edit through Studio /
 * Supabase SQL editor or an M7 native-reviewer pass survives a
 * subsequent seed). Re-seeding never overwrites user-visible
 * content that someone has already curated.
 *
 * Reviews are still kz-only on this commit — review.body stays a
 * single String column (reviewers wrote in one language, we don't
 * machine-translate their experience). The M2-06 reviews feed
 * will revisit per-locale review display if PM wants it.
 *
 * The CSVs contain no monetary fields, no medical claims, no PII —
 * per CLAUDE.md §2.
 */

import {
  ClinicKind,
  ClinicVerifyState,
  Locale,
  type Prisma,
  type PrismaClient,
  ReviewState,
  Role,
  TreatmentCategory,
} from "@prisma/client";
import { parseCsv } from "./csv";

type Trilingual = { kz: string; ru: string | null; kr: string | null };
type TrilingualList = { kz: string[]; ru: string[]; kr: string[] };

export interface SeedSummary {
  treatments: { created: number; updated: number; unchanged: number };
  clinics: { created: number; updated: number; unchanged: number };
  customers: { created: number; existing: number };
  reviews: { created: number; updated: number; unchanged: number };
}

function parseEnum<T extends string>(value: string, allowed: readonly T[], field: string): T {
  if ((allowed as readonly string[]).includes(value)) return value as T;
  throw new Error(`Invalid ${field}: "${value}" (allowed: ${allowed.join(", ")})`);
}

function parsePipeList(value: string): string[] {
  return value
    .split("|")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function parseHours(value: string): Record<string, string> {
  try {
    const parsed = JSON.parse(value);
    if (parsed && typeof parsed === "object") return parsed as Record<string, string>;
  } catch {
    /* fall through */
  }
  throw new Error(`Invalid hours JSON: ${value}`);
}

/** Read `{base}_kz` / `{base}_ru` / `{base}_kr` into the trilingual JSON shape. */
function trilingualFromRow(row: Record<string, string | undefined>, base: string): Trilingual {
  const kz = (row[`${base}_kz`] ?? "").trim();
  const ruRaw = (row[`${base}_ru`] ?? "").trim();
  const krRaw = (row[`${base}_kr`] ?? "").trim();
  return { kz, ru: ruRaw.length > 0 ? ruRaw : null, kr: krRaw.length > 0 ? krRaw : null };
}

/** Same as above for pipe-list (e.g. `expects`) columns. */
function trilingualListFromRow(
  row: Record<string, string | undefined>,
  base: string,
): TrilingualList {
  return {
    kz: parsePipeList(row[`${base}_kz`] ?? ""),
    ru: parsePipeList(row[`${base}_ru`] ?? ""),
    kr: parsePipeList(row[`${base}_kr`] ?? ""),
  };
}

/** Fill-blanks merge: any existing non-null slot wins. */
function mergeTrilingual(prev: unknown, fresh: Trilingual): Trilingual {
  const p = (prev ?? {}) as Partial<Trilingual>;
  return {
    kz: (p.kz && p.kz.length > 0 ? p.kz : fresh.kz) ?? "",
    ru: p.ru && p.ru.length > 0 ? p.ru : fresh.ru,
    kr: p.kr && p.kr.length > 0 ? p.kr : fresh.kr,
  };
}

function mergeTrilingualList(prev: unknown, fresh: TrilingualList): TrilingualList {
  const p = (prev ?? {}) as Partial<TrilingualList>;
  return {
    kz: p.kz && p.kz.length > 0 ? p.kz : fresh.kz,
    ru: p.ru && p.ru.length > 0 ? p.ru : fresh.ru,
    kr: p.kr && p.kr.length > 0 ? p.kr : fresh.kr,
  };
}

const TREATMENT_CATEGORIES = Object.values(TreatmentCategory) as TreatmentCategory[];
const CLINIC_KINDS = Object.values(ClinicKind) as ClinicKind[];
const CLINIC_VERIFY_STATES = Object.values(ClinicVerifyState) as ClinicVerifyState[];
const REVIEW_STATES = Object.values(ReviewState) as ReviewState[];

function detectFilledSlots(
  base: string,
  existing: Partial<Trilingual> | undefined,
  merged: Trilingual,
): string[] {
  const filled: string[] = [];
  if (!existing?.ru && merged.ru) filled.push(`${base}.ru`);
  if (!existing?.kr && merged.kr) filled.push(`${base}.kr`);
  return filled;
}

function detectFilledListSlots(
  base: string,
  existing: Partial<TrilingualList> | undefined,
  merged: TrilingualList,
): string[] {
  const filled: string[] = [];
  if ((!existing?.ru || existing.ru.length === 0) && merged.ru.length > 0) {
    filled.push(`${base}.ru`);
  }
  if ((!existing?.kr || existing.kr.length === 0) && merged.kr.length > 0) {
    filled.push(`${base}.kr`);
  }
  return filled;
}

export async function seedTreatments(
  prisma: PrismaClient,
  csv: string,
): Promise<SeedSummary["treatments"]> {
  const rows = parseCsv(csv);
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  for (const row of rows) {
    const slug = row.slug!.trim();
    const title = trilingualFromRow(row, "title");
    const summary = trilingualFromRow(row, "summary");
    const recovery = trilingualFromRow(row, "recovery");
    const expects = trilingualListFromRow(row, "expects");

    const existingRow = await prisma.treatment.findUnique({ where: { slug } });
    if (existingRow) {
      // Compute the merged JSON ahead of time so we can compare with
      // the existing value and only spend a DB write when a locale
      // slot actually transitions from null/empty to filled.
      const existingTitle = existingRow.title as Partial<Trilingual> | null;
      const existingSummary = existingRow.summary as Partial<Trilingual> | null;
      const existingRecovery = existingRow.recovery as Partial<Trilingual> | null;
      const existingExpects = existingRow.expects as Partial<TrilingualList> | null;

      const mergedTitle = mergeTrilingual(existingTitle, title);
      const mergedSummary = mergeTrilingual(existingSummary, summary);
      const mergedRecovery = mergeTrilingual(existingRecovery, recovery);
      const mergedExpects = mergeTrilingualList(existingExpects, expects);

      const filled = [
        ...detectFilledSlots("title", existingTitle ?? undefined, mergedTitle),
        ...detectFilledSlots("summary", existingSummary ?? undefined, mergedSummary),
        ...detectFilledSlots("recovery", existingRecovery ?? undefined, mergedRecovery),
        ...detectFilledListSlots("expects", existingExpects ?? undefined, mergedExpects),
      ];

      if (filled.length === 0) {
        unchanged++;
        continue;
      }
      await prisma.treatment.update({
        where: { slug },
        data: {
          title: mergedTitle,
          summary: mergedSummary,
          recovery: mergedRecovery,
          expects: mergedExpects,
        },
      });
      console.log(`  · ${slug}: filled ${filled.join(", ")}`);
      updated++;
      continue;
    }
    await prisma.treatment.create({
      data: {
        slug,
        category: parseEnum(row.category!, TREATMENT_CATEGORIES, "treatment.category"),
        title,
        summary,
        durationMin: Number(row.durationMin),
        recovery,
        expects,
      },
    });
    console.log(`  · ${slug}: created (kz/ru/kr)`);
    created++;
  }
  return { created, updated, unchanged };
}

export async function seedClinics(
  prisma: PrismaClient,
  csv: string,
): Promise<SeedSummary["clinics"]> {
  const rows = parseCsv(csv);
  let created = 0;
  let updated = 0;
  let unchanged = 0;
  for (const row of rows) {
    const slug = row.slug!.trim();
    const name = trilingualFromRow(row, "name");
    const city = row.city ?? null;
    const cityKr = (row.city_kr ?? "").trim() || null;
    // `location.city` stays a flat canonical Russian Cyrillic string
    // — the categories filter (lib/discover/filters.ts CITY_SLUG_MAP)
    // depends on it. `location.cityI18n` carries the locale-aware
    // display value so KR users don't see Cyrillic city names.
    const freshCityI18n = {
      kz: city,
      ru: city,
      kr: cityKr ?? city,
    } as const;
    const location: Prisma.InputJsonValue = {
      country: row.country ?? null,
      city,
      cityI18n: freshCityI18n,
    };

    const existingRow = await prisma.clinic.findUnique({ where: { slug } });
    if (existingRow) {
      const existingLoc = (existingRow.location ?? {}) as Record<string, unknown>;
      const existingCityI18n = (existingLoc.cityI18n ?? {}) as Record<string, string | null>;
      const mergedCityI18n = {
        kz: existingCityI18n.kz ?? freshCityI18n.kz,
        ru: existingCityI18n.ru ?? freshCityI18n.ru,
        kr: existingCityI18n.kr ?? freshCityI18n.kr,
      };
      const mergedName = mergeTrilingual(existingRow.name, name);
      const existingName = existingRow.name as Partial<Trilingual> | null;

      const filled = [...detectFilledSlots("name", existingName ?? undefined, mergedName)];
      if (!existingCityI18n.kr && mergedCityI18n.kr) filled.push("location.cityI18n.kr");
      if (!existingCityI18n.ru && mergedCityI18n.ru) filled.push("location.cityI18n.ru");
      if (!existingCityI18n.kz && mergedCityI18n.kz) filled.push("location.cityI18n.kz");

      if (filled.length === 0) {
        unchanged++;
        continue;
      }

      const mergedLocation: Prisma.InputJsonValue = {
        ...existingLoc,
        cityI18n: mergedCityI18n,
      } as Prisma.InputJsonValue;
      await prisma.clinic.update({
        where: { slug },
        data: {
          name: mergedName,
          location: mergedLocation,
        },
      });
      console.log(`  · ${slug}: filled ${filled.join(", ")}`);
      updated++;
      continue;
    }

    const treatmentSlugs = parsePipeList(row.treatment_slugs ?? "");
    const treatments = await prisma.treatment.findMany({
      where: { slug: { in: treatmentSlugs } },
      select: { id: true, slug: true },
    });
    const missing = treatmentSlugs.filter((s) => !treatments.find((t) => t.slug === s));
    if (missing.length > 0) {
      throw new Error(`Clinic ${slug} references unknown treatment slug(s): ${missing.join(", ")}`);
    }
    await prisma.clinic.create({
      data: {
        slug,
        kind: parseEnum(row.kind!, CLINIC_KINDS, "clinic.kind"),
        name,
        location,
        interpreters: parsePipeList(row.interpreters ?? ""),
        treatmentIds: treatments.map((t) => t.id),
        verifyState: parseEnum(row.verifyState!, CLINIC_VERIFY_STATES, "clinic.verifyState"),
        hours: parseHours(row.hours!),
      },
    });
    console.log(`  · ${slug}: created (kz/ru/kr name + cityI18n)`);
    created++;
  }
  return { created, updated, unchanged };
}

/**
 * Upsert seed-customer User rows by email. Used as Review.userId
 * targets so the FK is satisfied without leaking the staff sign-in
 * path. Same `customer_slug` value reused → same User row.
 */
async function ensureSeedCustomer(
  prisma: PrismaClient,
  slug: string,
  name: string,
): Promise<{ id: string; created: boolean }> {
  const email = `seed-${slug}@knsis.kz`;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) return { id: existing.id, created: false };
  const created = await prisma.user.create({
    data: {
      email,
      name,
      role: Role.customer,
      locale: Locale.kz,
      consentTos: true,
      consentedAt: new Date(),
    },
    select: { id: true },
  });
  return { id: created.id, created: true };
}

export async function seedReviews(
  prisma: PrismaClient,
  csv: string,
): Promise<{ customers: SeedSummary["customers"]; reviews: SeedSummary["reviews"] }> {
  const rows = parseCsv(csv);
  let reviewsCreated = 0;
  let reviewsUpdated = 0;
  let reviewsUnchanged = 0;
  let customersCreated = 0;
  let customersExisting = 0;

  for (const row of rows) {
    const code = row.code!.trim();
    const body = trilingualFromRow(row, "body");

    const existingReview = await prisma.review.findUnique({ where: { code } });
    if (existingReview) {
      // M2-06: Review.body became trilingual JSON. Apply the same
      // fill-blanks merge we use for Treatment / Clinic — admin or
      // M7 reviewer edits in DB survive a CSV re-run.
      const existingBody = existingReview.body as Partial<Trilingual> | null;
      const mergedBody = mergeTrilingual(existingBody, body);
      const filled = detectFilledSlots("body", existingBody ?? undefined, mergedBody);
      if (filled.length === 0) {
        reviewsUnchanged++;
        continue;
      }
      await prisma.review.update({
        where: { code },
        data: { body: mergedBody },
      });
      console.log(`  · ${code}: filled ${filled.join(", ")}`);
      reviewsUpdated++;
      continue;
    }
    const customer = await ensureSeedCustomer(prisma, row.customer_slug!, row.customer_name!);
    if (customer.created) customersCreated++;
    else customersExisting++;
    const clinic = row.clinic_slug
      ? await prisma.clinic.findUnique({ where: { slug: row.clinic_slug } })
      : null;
    const treatment = row.treatment_slug
      ? await prisma.treatment.findUnique({ where: { slug: row.treatment_slug } })
      : null;
    if (row.clinic_slug && !clinic) {
      throw new Error(`Review ${code} references unknown clinic slug: ${row.clinic_slug}`);
    }
    if (row.treatment_slug && !treatment) {
      throw new Error(`Review ${code} references unknown treatment slug: ${row.treatment_slug}`);
    }
    const rating = Number(row.rating);
    if (!(rating >= 1 && rating <= 5)) {
      throw new Error(`Review ${code} has out-of-range rating: ${row.rating}`);
    }
    await prisma.review.create({
      data: {
        code,
        userId: customer.id,
        clinicId: clinic?.id ?? null,
        txId: treatment?.id ?? null,
        rating,
        body,
        state: parseEnum(row.state!, REVIEW_STATES, "review.state"),
      },
    });
    console.log(`  · ${code}: created (kz/ru/kr body)`);
    reviewsCreated++;
  }
  return {
    customers: { created: customersCreated, existing: customersExisting },
    reviews: { created: reviewsCreated, updated: reviewsUpdated, unchanged: reviewsUnchanged },
  };
}
