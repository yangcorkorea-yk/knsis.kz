/*
 * scripts/seed-staff.ts — multi-role staff-user provisioner (M5-01,
 * extended for the M5-03 visual matrix).
 *
 * Pattern (a) per M5-batch-1 PM sign-off — plaintext never crosses
 * the Vercel boundary. The PM hashes locally:
 *
 *   node -e "console.log(require('bcryptjs').hashSync('<pw>', 12))"
 *
 * …and pastes the `$2b$…` string into one or more of these env-var
 * pairs (one per role they want available):
 *
 *   STAFF_SEED_EMAIL                + STAFF_SEED_PASSWORD_HASH
 *     → legacy alias for admin (M5-01 shape; preserved as-is)
 *   STAFF_SEED_EMAIL_ADMIN          + STAFF_SEED_PASSWORD_HASH_ADMIN
 *   STAFF_SEED_EMAIL_HEAD           + STAFF_SEED_PASSWORD_HASH_HEAD
 *   STAFF_SEED_EMAIL_MANAGER        + STAFF_SEED_PASSWORD_HASH_MANAGER
 *   STAFF_SEED_EMAIL_SUPPORT        + STAFF_SEED_PASSWORD_HASH_SUPPORT
 *
 * The M5-03 permission matrix needs at least manager + support to
 * exercise both branches. Admin / head as needed.
 *
 * Validation:
 *   - Partial pair (email without hash, or vice versa) → throw.
 *   - Hash must start with `$2` (bcrypt) — guards plaintext paste.
 *   - At least one complete pair must be set, otherwise nothing
 *     to do.
 *
 * Idempotent: each role upserts by email. Re-running with the same
 * hash is a no-op write; rotating the hash via env-var update + re-
 * running the script propagates the new credential.
 */

import { PrismaClient, Role } from "@prisma/client";

const prisma = new PrismaClient();

interface SeedPair {
  envLabel: string;
  email: string | undefined;
  passwordHash: string | undefined;
  role: Role;
}

function readPair(envKey: string, role: Role): SeedPair {
  const emailKey = `STAFF_SEED_EMAIL_${envKey}`;
  const hashKey = `STAFF_SEED_PASSWORD_HASH_${envKey}`;
  return {
    envLabel: envKey,
    role,
    email: process.env[emailKey]?.trim().toLowerCase() || undefined,
    passwordHash: process.env[hashKey]?.trim() || undefined,
  };
}

function readLegacyAdminPair(): SeedPair {
  return {
    envLabel: "ADMIN (legacy STAFF_SEED_*)",
    role: Role.admin,
    email: process.env.STAFF_SEED_EMAIL?.trim().toLowerCase() || undefined,
    passwordHash: process.env.STAFF_SEED_PASSWORD_HASH?.trim() || undefined,
  };
}

function validatePair(pair: SeedPair): void {
  const eitherSet = !!pair.email || !!pair.passwordHash;
  const bothSet = !!pair.email && !!pair.passwordHash;
  if (eitherSet && !bothSet) {
    throw new Error(
      `[seed-staff] partial config for ${pair.envLabel}: email + hash must both be set or both empty.`,
    );
  }
  if (!bothSet) return;
  if (!pair.email!.includes("@")) {
    throw new Error(
      `[seed-staff] ${pair.envLabel} email doesn't look like an email: "${pair.email}"`,
    );
  }
  if (!pair.passwordHash!.startsWith("$2")) {
    throw new Error(
      `[seed-staff] ${pair.envLabel} password hash must start with $2 (bcrypt). Plaintext paste?`,
    );
  }
}

async function upsert(pair: SeedPair): Promise<void> {
  const user = await prisma.user.upsert({
    where: { email: pair.email! },
    create: {
      email: pair.email!,
      passwordHash: pair.passwordHash!,
      role: pair.role,
      consentTos: true,
      consentedAt: new Date(),
    },
    update: {
      passwordHash: pair.passwordHash!,
      role: pair.role,
    },
    select: { id: true, email: true, role: true },
  });
  console.log(`[seed-staff] upserted ${user.email} (role=${user.role}, id=${user.id})`);
}

async function main() {
  const pairs: SeedPair[] = [
    readLegacyAdminPair(),
    readPair("ADMIN", Role.admin),
    readPair("HEAD", Role.head),
    readPair("MANAGER", Role.manager),
    readPair("SUPPORT", Role.support),
  ];

  for (const p of pairs) validatePair(p);

  const ready = pairs.filter((p) => !!p.email && !!p.passwordHash);
  if (ready.length === 0) {
    throw new Error(
      "[seed-staff] nothing to seed — set at least one STAFF_SEED_EMAIL_* / _PASSWORD_HASH_* pair.",
    );
  }

  // Dedup: if both legacy STAFF_SEED_EMAIL and STAFF_SEED_EMAIL_ADMIN
  // resolve to the same address, upsert once. The later pair wins on
  // role, but admin × admin makes that a no-op anyway.
  const byEmail = new Map<string, SeedPair>();
  for (const p of ready) byEmail.set(p.email!, p);

  for (const p of byEmail.values()) {
    await upsert(p);
  }
  console.log(`[seed-staff] done — ${byEmail.size} row(s) upserted`);
}

main()
  .catch((err) => {
    console.error("[seed-staff] failed:", err instanceof Error ? err.message : err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
