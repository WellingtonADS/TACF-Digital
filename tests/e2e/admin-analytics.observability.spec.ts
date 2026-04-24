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

test.describe("Observabilidade: Analytics e Relatórios", () => {
  test("admin vê dashboard de analytics carregado", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/analytics");
    await waitForPageReady(page);

    await expect(page.getByTestId("analytics-dashboard-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: "Operações Inteligência" }),
    ).toBeVisible();
  });

  test("admin vê controles de filtro de período no analytics", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/analytics");
    await waitForPageReady(page);

    await expect(page.getByTestId("analytics-dashboard-page")).toBeVisible({
      timeout: 15000,
    });

    // Header de período deve estar visível
    await expect(page.getByText("Período de Análise")).toBeVisible({
      timeout: 10000,
    });
  });

  test("admin vê seção de indicadores no analytics", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/analytics");
    await waitForPageReady(page);

    await expect(page.getByTestId("analytics-dashboard-page")).toBeVisible({
      timeout: 15000,
    });

    // Algum indicador ou card de dado deve aparecer
    const hasStatCard = await page
      .locator('[class*="rounded"]')
      .filter({ hasText: /aptos|inaptos|militares|turmas|total/i })
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasStatCard).toBe(true);
  });
});
