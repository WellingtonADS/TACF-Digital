import { expect, test, type Page } from "@playwright/test";
import { adminCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 15000,
  });
}

async function loginAsAdmin(loginPage: LoginPage) {
  await loginPage.goto();
  await loginPage.login(adminCredentials.email, adminCredentials.password);
  await expect(loginPage.page).toHaveURL(/\/app(\/admin)?/, { timeout: 15000 });
  await waitForPageReady(loginPage.page);
}

test.describe("Observabilidade: Gestão de Reagendamentos", () => {
  test("admin vê página de reagendamentos carregada", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/reagendamentos");
    await waitForPageReady(page);

    await expect(page.getByTestId("rescheduling-management-page")).toBeVisible({
      timeout: 15000,
    });
  });

  test("admin vê filtros de status na página de reagendamentos", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/reagendamentos");
    await waitForPageReady(page);

    await expect(page.getByTestId("rescheduling-management-page")).toBeVisible({
      timeout: 15000,
    });

    // Filtros de status devem estar presentes
    const filtersVisible = await page
      .getByRole("button", { name: /todos|pendentes|aprovados|cancelados/i })
      .first()
      .isVisible()
      .catch(() => false);
    const tabsVisible = await page
      .getByRole("tab", { name: /todos|pendentes/i })
      .first()
      .isVisible()
      .catch(() => false);

    expect(filtersVisible || tabsVisible).toBe(true);
  });
});
