// scripts/i18n-check.ts — fail CI if any catalog key is missing or
// flagged with `TODO: review`. Run via `pnpm i18n:check`.

import { readFileSync } from "node:fs";
import { join } from "node:path";

const LOCALES = ["kz", "ru", "kr"] as const;
const DIR = join(process.cwd(), "messages");

type Catalog = Record<string, unknown>;
const cats: Record<string, Catalog> = {};
for (const l of LOCALES) {
  cats[l] = JSON.parse(readFileSync(join(DIR, `${l}.json`), "utf8"));
}

function flatten(o: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (o && typeof o === "object" && !Array.isArray(o)) {
    for (const [k, v] of Object.entries(o)) {
      const path = prefix ? `${prefix}.${k}` : k;
      if (typeof v === "string") out[path] = v;
      else Object.assign(out, flatten(v, path));
    }
  }
  return out;
}

const flat = Object.fromEntries(LOCALES.map((l) => [l, flatten(cats[l])])) as Record<
  (typeof LOCALES)[number],
  Record<string, string>
>;

const allKeys = new Set<string>();
for (const l of LOCALES) Object.keys(flat[l]).forEach((k) => allKeys.add(k));

const errors: string[] = [];
for (const k of allKeys) {
  for (const l of LOCALES) {
    if (!(k in flat[l])) errors.push(`Missing in ${l}: ${k}`);
    else if (/TODO:?\s*review/i.test(flat[l][k]!)) errors.push(`Unreviewed in ${l}: ${k}`);
  }
}

if (errors.length > 0) {
  console.error(`\n❌ i18n-check: ${errors.length} issue(s)\n`);
  errors.forEach((e) => console.error(`  ${e}`));
  process.exit(1);
} else {
  console.log("✅ i18n-check: clean");
}
