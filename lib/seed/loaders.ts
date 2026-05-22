/*
 * lib/seed/loaders.ts — domain loaders for the M2-09 seed pipeline.
 *
 * Reads /seed/{treatments,clinics,reviews}.csv and upserts the
 * corresponding Prisma rows. Idempotent: a re-run never overwrites
 * existing rows. The "create if missing" semantic preserves any
 * RU/KR translations or admin-side edits that landed after the
 * initial seed (M7 i18n review will fill ru/kr in-DB; we won't
 * stomp on that).
 *
 * Reviews require a User row (FK Review.userId → User). The CSV's
 * `customer_slug` column lets us upsert deterministic seed-customer
 * Users by email (`seed-<slug>@knsis.kz`). They're tagged role=
 * customer so they pass the M1-04 RBAC matrix without leaking the
 * staff sign-in path.
 *
 * The CSVs contain no monetary fields, no medical claims, no PII —
 * per CLAUDE.md §2.
 */

import {
  ClinicKind,
  ClinicVerifyState,
  Locale,
  type PrismaClient,
  ReviewState,
  Role,
  TreatmentCategory,
} from "@prisma/client";
import { parseCsv } from "./csv";

type Trilingual = { kz: string; ru: string | null; kr: string | null };

export interface SeedSummary {
  treatments: { created: number; existing: number };
  clinics: { created: number; existing: number };
  customers: { created: number; existing: number };
  reviews: { created: number; existing: number };
}

const KZ_ONLY = (kz: string): Trilingual => ({ kz, ru: null, kr: null });

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

const TREATMENT_CATEGORIES = Object.values(TreatmentCategory) as TreatmentCategory[];
const CLINIC_KINDS = Object.values(ClinicKind) as ClinicKind[];
const CLINIC_VERIFY_STATES = Object.values(ClinicVerifyState) as ClinicVerifyState[];
const REVIEW_STATES = Object.values(ReviewState) as ReviewState[];

export async function seedTreatments(
  prisma: PrismaClient,
  csv: string,
): Promise<SeedSummary["treatments"]> {
  const rows = parseCsv(csv);
  let created = 0;
  let existing = 0;
  for (const row of rows) {
    const slug = row.slug!.trim();
    const existingRow = await prisma.treatment.findUnique({ where: { slug } });
    if (existingRow) {
      existing++;
      continue;
    }
    await prisma.treatment.create({
      data: {
        slug,
        category: parseEnum(row.category!, TREATMENT_CATEGORIES, "treatment.category"),
        title: KZ_ONLY(row.title_kz!),
        summary: KZ_ONLY(row.summary_kz!),
        durationMin: Number(row.durationMin),
        recovery: KZ_ONLY(row.recovery_kz!),
        expects: {
          kz: parsePipeList(row.expects_kz ?? ""),
          ru: [],
          kr: [],
        },
      },
    });
    created++;
  }
  return { created, existing };
}

export async function seedClinics(
  prisma: PrismaClient,
  csv: string,
): Promise<SeedSummary["clinics"]> {
  const rows = parseCsv(csv);
  let created = 0;
  let existing = 0;
  for (const row of rows) {
    const slug = row.slug!.trim();
    const existingRow = await prisma.clinic.findUnique({ where: { slug } });
    if (existingRow) {
      existing++;
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
        name: KZ_ONLY(row.name_kz!),
        location: {
          country: row.country ?? null,
          city: row.city ?? null,
        },
        interpreters: parsePipeList(row.interpreters ?? ""),
        treatmentIds: treatments.map((t) => t.id),
        verifyState: parseEnum(row.verifyState!, CLINIC_VERIFY_STATES, "clinic.verifyState"),
        hours: parseHours(row.hours!),
      },
    });
    created++;
  }
  return { created, existing };
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
  let reviewsExisting = 0;
  let customersCreated = 0;
  let customersExisting = 0;

  for (const row of rows) {
    const code = row.code!.trim();
    const existingReview = await prisma.review.findUnique({ where: { code } });
    if (existingReview) {
      reviewsExisting++;
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
        body: row.body_kz ?? "",
        state: parseEnum(row.state!, REVIEW_STATES, "review.state"),
      },
    });
    reviewsCreated++;
  }
  return {
    customers: { created: customersCreated, existing: customersExisting },
    reviews: { created: reviewsCreated, existing: reviewsExisting },
  };
}
