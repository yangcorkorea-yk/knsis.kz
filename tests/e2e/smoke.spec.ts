import { expect, test } from "@playwright/test";

test("homepage renders the M0 shell", async ({ page }) => {
  const response = await page.goto("/");
  expect(response?.status()).toBe(200);
  await expect(page.getByRole("heading", { level: 1 })).toContainText(/M0/);
});
