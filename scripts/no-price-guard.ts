// scripts/no-price-guard.ts — CI lint that fails the build if price terms
// land in source. Run via `pnpm price:check`.
// Whitelist must be empty unless legal review explicitly allows an instance.

import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const SCAN_DIRS = ["app", "components", "lib", "messages", "prisma"];
const SKIP = /node_modules|\.next|dist|build|\.git/;
const PRICE_TERMS =
  /\b(price|prices|pricing|cost|amount|fee|fees|стоимость|цена|цены|сумма|стоит|баға|құн|총가|가격|결제|결제금액)\b/i;
const WHITELIST = new Set<string>([
  // add reviewed paths here, ONLY with legal sign-off
]);

const hits: { file: string; line: number; text: string }[] = [];

function walk(dir: string) {
  for (const name of readdirSync(dir)) {
    if (SKIP.test(name)) continue;
    const full = join(dir, name);
    const s = statSync(full);
    if (s.isDirectory()) walk(full);
    else if (/\.(ts|tsx|js|jsx|md|json)$/.test(name)) scan(full);
  }
}

function scan(file: string) {
  const rel = file.replace(ROOT + "/", "");
  if (WHITELIST.has(rel)) return;
  const lines = readFileSync(file, "utf8").split("\n");
  lines.forEach((text, i) => {
    if (PRICE_TERMS.test(text)) {
      hits.push({ file: rel, line: i + 1, text: text.trim().slice(0, 200) });
    }
  });
}

for (const d of SCAN_DIRS) {
  try {
    walk(join(ROOT, d));
  } catch {
    /* dir may not exist yet */
  }
}

if (hits.length > 0) {
  console.error(`\n❌ price-guard: ${hits.length} hit(s)\n`);
  for (const h of hits) console.error(`  ${h.file}:${h.line}  ${h.text}`);
  console.error(`\nThe project may never display, ask, or persist prices.`);
  console.error(`If this is a false positive, add the file to WHITELIST after`);
  console.error(`legal sign-off in scripts/no-price-guard.ts.\n`);
  process.exit(1);
} else {
  console.log("✅ price-guard: clean");
}
