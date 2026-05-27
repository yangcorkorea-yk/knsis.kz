/*
 * prisma/seed.ts — M2-09 content seed entry point.
 *
 * Reads /seed/{treatments,clinics,reviews}.csv from the repo root
 * and idempotently upserts them via lib/seed/loaders.ts.
 *
 * Re-running is safe: the loaders skip rows that already exist by
 * slug / code / email. They never overwrite existing rows so the
 * M7 RU/KR translation pass and any admin edits survive a re-seed.
 *
 * Invoke:
 *   pnpm db:seed
 *
 * The staff admin seed lives outside this script (operator-side
 * `node scripts/hash-password.mjs` + Supabase Table Editor insert).
 */

import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { PrismaClient } from "@prisma/client";
import { seedClinics, seedReviews, seedTreatments } from "../lib/seed/loaders";

const prisma = new PrismaClient();

async function main() {
  const root = process.cwd();
  const [treatmentsCsv, clinicsCsv, reviewsCsv] = await Promise.all([
    readFile(join(root, "seed", "treatments.csv"), "utf8"),
    readFile(join(root, "seed", "clinics.csv"), "utf8"),
    readFile(join(root, "seed", "reviews.csv"), "utf8"),
  ]);

  console.log("• Treatments…");
  const t = await seedTreatments(prisma, treatmentsCsv);
  console.log(
    `  ${t.created} created, ${t.updated} updated (filled blanks), ${t.unchanged} unchanged`,
  );

  console.log("• Clinics…");
  const c = await seedClinics(prisma, clinicsCsv);
  console.log(
    `  ${c.created} created, ${c.updated} updated (filled blanks), ${c.unchanged} unchanged`,
  );

  console.log("• Reviews + seed customers…");
  const r = await seedReviews(prisma, reviewsCsv);
  console.log(
    `  reviews: ${r.reviews.created} created, ${r.reviews.updated} updated (filled blanks), ${r.reviews.unchanged} unchanged`,
  );
  console.log(
    `  seed customers: ${r.customers.created} created, ${r.customers.existing} already present`,
  );

  // Diagnostic verification: sample one row per trilingual model so
  // the operator can see at a glance whether fill-blanks persisted.
  console.log("\n• Verification (sample row read-back)…");
  const sampleTx = await prisma.treatment.findFirst({
    select: { slug: true, title: true },
  });
  if (sampleTx) {
    console.log(`  Treatment "${sampleTx.slug}" title: ${JSON.stringify(sampleTx.title)}`);
  }
  const sampleClinic = await prisma.clinic.findFirst({
    select: { slug: true, name: true, location: true },
  });
  if (sampleClinic) {
    console.log(`  Clinic "${sampleClinic.slug}" name: ${JSON.stringify(sampleClinic.name)}`);
    console.log(
      `    location.cityI18n: ${JSON.stringify(
        (sampleClinic.location as { cityI18n?: unknown })?.cityI18n,
      )}`,
    );
  }
  const sampleReview = await prisma.review.findFirst({
    select: { code: true, body: true },
  });
  if (sampleReview) {
    console.log(`  Review "${sampleReview.code}" body: ${JSON.stringify(sampleReview.body)}`);
  }

  console.log("\n✅ seed: done");
}

main()
  .catch((err) => {
    console.error("\n❌ seed failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
