import { expect, test } from "@playwright/test";

test.describe("Route guards sem autenticação", () => {
  test("deve redirecionar /app para /login", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "TACF-Digital" }),
    ).toBeVisible();
  });

  test("deve redirecionar /app/admin para /login", async ({ page }) => {
    await page.goto("/app/admin");
    await expect(page).toHaveURL(/\/login$/);
    await expect(
      page.getByRole("heading", { name: "TACF-Digital" }),
    ).toBeVisible();
  });
});
