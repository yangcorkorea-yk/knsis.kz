#!/usr/bin/env node
/*
 * scripts/hash-password.mjs — one-shot bcrypt hasher for seeding the
 * first staff admin row.
 *
 * Usage:
 *   node scripts/hash-password.mjs 'Plain-Text-Password!'
 *
 * Output is the bcrypt hash on stdout, no trailing newline noise so
 * the operator can pipe it straight into a Supabase Table Editor
 * Insert cell. Cost factor matches lib/auth/password.ts (12).
 *
 * Workflow:
 *   1. node scripts/hash-password.mjs '...'   → copy the hash
 *   2. Supabase Table Editor → User → Insert row:
 *        email = staff@knsis.kz
 *        passwordHash = <paste hash>
 *        role = manager (or admin / head / support)
 *        locale = kz
 *        consentTos = true
 *   3. Sign in at POST /api/auth/signin with the plaintext.
 *
 * Do NOT add the plaintext to git history. The shell argument lives
 * in your terminal's history file — clear it (`history -d <n>`) when
 * you're done.
 */

import bcrypt from "bcryptjs";

const COST = 12;
const plain = process.argv[2];

if (!plain) {
  console.error("Usage: node scripts/hash-password.mjs '<plain-text-password>'");
  process.exit(2);
}
if (plain.length < 8) {
  console.error("Refusing to hash a password shorter than 8 characters.");
  process.exit(2);
}

const hash = await bcrypt.hash(plain, COST);
process.stdout.write(hash);
