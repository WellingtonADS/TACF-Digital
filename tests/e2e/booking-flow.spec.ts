import { expect, test } from "./fixtures/auth";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Booking flow — regular user", () => {
  test.skip(
    !process.env.E2E_USER_EMAIL || !process.env.E2E_USER_PASSWORD,
    "E2E_USER_EMAIL/PASSWORD not set",
  );

  test("can navigate to the scheduling page", async ({ userContext }) => {
    const page = await userContext.newPage();
    await page.goto(`${BASE}/app/agendamento`);

    // The page should load without redirecting to /login
    await expect(page).not.toHaveURL(/\/login/);
    await page.close();
  });

  test("lists available sessions", async ({ userContext }) => {
    const page = await userContext.newPage();
    await page.goto(`${BASE}/app/agendamento`);

    // Wait for the session list or calendar to appear
    await expect(
      page
        .getByRole("list")
        .or(page.locator('[data-testid="session-list"]'))
        .first(),
    ).toBeVisible({ timeout: 15_000 });

    await page.close();
  });

  test("can open session details", async ({ userContext }) => {
    const page = await userContext.newPage();
    await page.goto(`${BASE}/app/agendamento`);

    // Click the first session item / card
    const firstSession = page
      .locator('[data-testid="session-card"]')
      .first()
      .or(
        page
          .getByRole("button", {
            name: /selecionar|agendar|reservar|ver|details/i,
          })
          .first(),
      );

    await firstSession.waitFor({ timeout: 15_000 });
    await firstSession.click();

    // A modal / detail panel should appear
    await expect(
      page
        .getByRole("dialog")
        .or(page.locator('[data-testid="session-detail"]'))
        .first(),
    ).toBeVisible({ timeout: 10_000 });

    await page.close();
  });
});
