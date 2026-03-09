import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// simple e2e check on login page in dark mode

test("dark mode baseline has no contrast violations", async ({ page }) => {
  await page.emulateMedia({ colorScheme: "dark" });
  await page.goto("/login", { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(200); // allow tailwind to apply

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2aa"])
    .analyze();
  expect(results.violations).toEqual([]);
});
