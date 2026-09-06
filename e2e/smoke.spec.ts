import { expect, test } from "@playwright/test";

test("homepage loads and has NAVO title", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveTitle(/NAVO/);
});
