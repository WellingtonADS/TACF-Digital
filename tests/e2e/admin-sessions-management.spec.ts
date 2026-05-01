import { expect, test } from "../fixtures/auth";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Admin — sessions management", () => {
  test.skip(
    !process.env.E2E_ADMIN_EMAIL || !process.env.E2E_ADMIN_PASSWORD,
    "E2E_ADMIN_EMAIL/PASSWORD not set",
  );

  test("admin can reach the sessions management page", async ({
    adminContext,
  }) => {
    const page = await adminContext.newPage();
    await page.goto(`${BASE}/app/admin/sessoes`);

    await expect(page).not.toHaveURL(/\/login/);
    await expect(page).not.toHaveURL(/\/forbidden/);

    // Confirm page loaded by checking for a heading or table
    await expect(
      page.getByRole("heading").or(page.getByRole("table")).first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.close();
  });

  test("sessions list is visible and contains rows or empty state", async ({
    adminContext,
  }) => {
    const page = await adminContext.newPage();
    await page.goto(`${BASE}/app/admin/sessoes`);

    // Either a table with rows or an empty-state message must be visible
    const hasTable = await page
      .getByRole("table")
      .isVisible()
      .catch(() => false);
    const hasEmptyState = await page
      .getByText(/nenhuma sessão|sem sessões|no sessions/i)
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasEmptyState).toBe(true);

    await page.close();
  });

  test("admin can open the create session dialog", async ({ adminContext }) => {
    const page = await adminContext.newPage();
    await page.goto(`${BASE}/app/admin/sessoes`);

    const createBtn = page.getByRole("button", {
      name: /nova sessão|criar sessão|add session|new session/i,
    });
    await createBtn.waitFor({ timeout: 15_000 });
    await createBtn.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 10_000 });

    await page.close();
  });
});
