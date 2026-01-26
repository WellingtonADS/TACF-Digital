import { expect, test } from "@playwright/test";

test.describe("Auth / Login", () => {
  test("loads login page", async ({ page, baseURL }) => {
    await page.goto(baseURL! + "/login");
    // App header shows the product name; assert it is visible
    await expect(
      page.getByRole("heading", { name: /TACF-Digital|TACF|TACF HACO/i }),
    ).toBeVisible();
    // Prefer stable id selectors for inputs
    await expect(page.locator("#email")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
