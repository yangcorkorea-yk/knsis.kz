// prisma/seed.ts — placeholder. Real seed data lands in M2-09
// (treatments + clinics import) and M1-02 (staff admin user).
//
// Invoke via `pnpm db:seed`.

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("ℹ️  prisma seed: placeholder — no rows written yet.");
  console.log("   Real seeds:");
  console.log("   - M1-02 · staff admin user (Better-Auth bootstrap)");
  console.log("   - M2-09 · treatments + clinics import");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
