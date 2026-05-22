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
  console.log(`  ${t.created} created, ${t.existing} already present`);

  console.log("• Clinics…");
  const c = await seedClinics(prisma, clinicsCsv);
  console.log(`  ${c.created} created, ${c.existing} already present`);

  console.log("• Reviews + seed customers…");
  const r = await seedReviews(prisma, reviewsCsv);
  console.log(`  reviews: ${r.reviews.created} created, ${r.reviews.existing} already present`);
  console.log(
    `  seed customers: ${r.customers.created} created, ${r.customers.existing} already present`,
  );

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
