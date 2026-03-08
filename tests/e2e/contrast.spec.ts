import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// simple e2e check on login page in dark mode

test("dark mode baseline has no contrast violations", async ({ page }) => {
  await page.goto("/login");
  // force dark mode
  await page.evaluate(() => document.documentElement.classList.add("dark"));
  await page.waitForTimeout(200); // allow tailwind to apply

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
