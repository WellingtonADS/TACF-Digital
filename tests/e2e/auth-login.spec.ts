import { expect, test } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Auth — login / logout", () => {
  test("redirects unauthenticated user to /login", async ({ page }) => {
    await page.goto(`${BASE}/app`);
    await expect(page).toHaveURL(/\/login/);
  });

  test("shows error for invalid credentials", async ({ page }) => {
    await page.goto(`${BASE}/login`);

    await page.getByLabel(/e-?mail/i).fill("naoexiste@tacf.mil.br");
    await page.getByLabel(/senha|password/i).fill("senhaerrada123");
    await page.getByRole("button", { name: /entrar|login|sign in/i }).click();

    // Expect an error message to appear (toast or inline)
    await expect(
      page.getByText(/inválid|incorret|não encontrado|invalid|not found/i),
    ).toBeVisible({ timeout: 10_000 });

    // Should remain on /login
    await expect(page).toHaveURL(/\/login/);
  });

  test("logs in with valid admin credentials and reaches /app", async ({
    page,
  }) => {
    const email = process.env.E2E_ADMIN_EMAIL ?? "";
    const password = process.env.E2E_ADMIN_PASSWORD ?? "";

    test.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD not set");

    await page.goto(`${BASE}/login`);
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/senha|password/i).fill(password);
    await page.getByRole("button", { name: /entrar|login|sign in/i }).click();

    await expect(page).toHaveURL(/\/app/, { timeout: 15_000 });
  });

  test("logs out and redirects to /login", async ({ page }) => {
    const email = process.env.E2E_ADMIN_EMAIL ?? "";
    const password = process.env.E2E_ADMIN_PASSWORD ?? "";

    test.skip(!email || !password, "E2E_ADMIN_EMAIL/PASSWORD not set");

    await page.goto(`${BASE}/login`);
    await page.getByLabel(/e-?mail/i).fill(email);
    await page.getByLabel(/senha|password/i).fill(password);
    await page.getByRole("button", { name: /entrar|login|sign in/i }).click();
    await page.waitForURL(/\/app/, { timeout: 15_000 });

    // Click the logout button — label may vary
    await page.getByRole("button", { name: /sair|logout|sign out/i }).click();

    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });
});
