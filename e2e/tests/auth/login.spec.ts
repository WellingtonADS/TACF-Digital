import { expect, test } from "@playwright/test";

test.describe("Auth / Login", () => {
  test("loads login page", async ({ page, baseURL }) => {
    await page.goto(baseURL! + "/login");
    await expect(page.getByRole("heading", { name: /Login/i })).toBeVisible();
    await expect(page.getByPlaceholder("Email")).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
  });
});
