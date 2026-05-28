/*
 * lib/leads/code-gen.ts — Lead.code generator.
 *
 * Format: `KB-${YYYY}-${4 numeric chars}` (e.g. `KB-2026-0427`).
 * The 4-digit suffix is random per attempt; on a unique-constraint
 * collision the caller retries (with a fresh suffix). Collision
 * odds for our MVP volume (< 100 leads / year) over 10000 buckets
 * are vanishingly small but the retry loop closes the door entirely.
 *
 * Pure — accepts a clock + rng so vitest can pin both. Production
 * callers pass `Date.now` + `crypto.randomInt`.
 */

const SUFFIX_RANGE = 10_000; // 0000..9999

export interface CodeGenDeps {
  /** Returns the current year for the prefix. */
  now: () => Date;
  /** Returns an integer in [0, SUFFIX_RANGE). */
  random: () => number;
}

export function makeLeadCode(deps: CodeGenDeps): string {
  const year = deps.now().getFullYear();
  const suffix = deps.random() % SUFFIX_RANGE;
  const padded = String(suffix).padStart(4, "0");
  return `KB-${year}-${padded}`;
}

export const defaultDeps: CodeGenDeps = {
  now: () => new Date(),
  random: () => Math.floor(Math.random() * SUFFIX_RANGE),
};
