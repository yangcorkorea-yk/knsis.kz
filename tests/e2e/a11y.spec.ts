/*
 * tests/e2e/a11y.spec.ts — axe-core smoke against the Home page on
 * each locale.
 *
 * Run via `pnpm e2e:a11y`. Targets PLAYWRIGHT_BASE_URL (default
 * http://localhost:3000 via playwright.config.ts webServer).
 *
 * Tagged WCAG 2.1 AA (per spec §11). One failure across any locale
 * fails the run — fail-fast for the reviewer.
 *
 * Pre-req: the Home page needs Prisma-served data, so the target
 * URL must have DATABASE_URL set + seed applied. Production
 * (seoulbeauty-kz.vercel.app) and per-PR Vercel previews both
 * satisfy that once the env vars are wired.
 *
 * CI gate decision: this spec is the building block; the wiring
 * step (running it against the right URL after every PR) lands as
 * a follow-up — see PR description.
 */

import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

const LOCALES = ["kz", "ru", "kr"] as const;

for (const locale of LOCALES) {
  test(`home /${locale} passes axe WCAG 2.1 AA`, async ({ page }) => {
    const response = await page.goto(`/${locale}`);
    expect(response?.status(), `GET /${locale}`).toBe(200);
    // Make sure the page actually rendered something — guards
    // against a 200 with an empty body during a partial deploy.
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

    const { violations } = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    expect(
      violations,
      `axe found ${violations.length} violation(s) on /${locale}:\n` +
        violations.map((v) => `  · ${v.id} — ${v.help} (${v.nodes.length} node(s))`).join("\n"),
    ).toEqual([]);
  });
}
