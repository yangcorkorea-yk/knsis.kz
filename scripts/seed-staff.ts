/*
 * scripts/seed-staff.ts — one-shot staff-user provisioner (M5-01).
 *
 * Pattern (a) per M5-batch-1 PM sign-off
 * (`docs/decisions/m5-batch-1-spec.md` § "Open questions"):
 *
 *   1. PM picks a password.
 *   2. PM hashes it locally with bcryptjs:
 *      node -e "console.log(require('bcryptjs').hashSync('<pw>', 12))"
 *   3. PM sets STAFF_SEED_EMAIL + STAFF_SEED_PASSWORD_HASH in
 *      .env.local (and Vercel env vars for prod runs).
 *   4. `pnpm db:seed:staff` runs this script — reads both env
 *      vars, upserts the User row with role=admin, passwordHash
 *      set to the env value AS-IS (no further hashing). Idempotent.
 *
 * Why hash-in-env over plaintext-in-env: plaintext never crosses
 * the Vercel boundary at any point. The hash is what gets stored;
 * any leak of env vars exposes only the bcrypt cost-12 hash, which
 * still has to be cracked. Rotation = update the env var with a
 * fresh hash and re-run this script.
 *
 * Standalone tsx script — does NOT run from prisma/seed.ts. Run on
 * demand from the PM's PowerShell (or in CI via Vercel build hook
 * if/when we wire that up).
 */

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const email = process.env.STAFF_SEED_EMAIL?.trim().toLowerCase();
  const passwordHash = process.env.STAFF_SEED_PASSWORD_HASH?.trim();

  if (!email || !passwordHash) {
    throw new Error(
      "STAFF_SEED_EMAIL and STAFF_SEED_PASSWORD_HASH must both be set in the environment.",
    );
  }
  if (!email.includes("@")) {
    throw new Error(`STAFF_SEED_EMAIL doesn't look like an email: "${email}"`);
  }
  if (!passwordHash.startsWith("$2")) {
    throw new Error(
      "STAFF_SEED_PASSWORD_HASH must be a bcrypt hash (starts with $2a / $2b / $2y). Did you paste plaintext by accident?",
    );
  }

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      passwordHash,
      role: Role.admin,
      consentTos: true,
      consentedAt: new Date(),
    },
    update: {
      passwordHash,
      role: Role.admin,
    },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  console.log(`[seed-staff] upserted user ${user.email} (role=${user.role}, id=${user.id})`);
}

main()
  .catch((err) => {
    console.error("[seed-staff] failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
