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

test.describe("Observabilidade: Log de Auditoria", () => {
  test("admin vê página de auditoria com cabeçalho", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/auditoria");
    await waitForPageReady(page);

    await expect(page.getByTestId("audit-log-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: "Log de Auditoria" }),
    ).toBeVisible();
  });

  test("admin vê cards de estatísticas na auditoria", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/auditoria");
    await waitForPageReady(page);

    await expect(page.getByTestId("audit-log-page")).toBeVisible({
      timeout: 15000,
    });

    // StatCards devem estar presentes
    await expect(page.getByText("Total de Eventos")).toBeVisible({
      timeout: 10000,
    });
  });

  test("admin vê tabela ou lista de eventos de auditoria", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/auditoria");
    await waitForPageReady(page);

    await expect(page.getByTestId("audit-log-page")).toBeVisible({
      timeout: 15000,
    });

    // Tabela ou mensagem de sem dados
    const hasTable = await page
      .locator("table")
      .isVisible()
      .catch(() => false);
    const hasEmptyMsg = await page
      .getByText(/nenhum evento|sem registros|no events/i)
      .isVisible()
      .catch(() => false);
    const hasList = await page
      .locator("ul li")
      .first()
      .isVisible()
      .catch(() => false);

    expect(hasTable || hasEmptyMsg || hasList).toBe(true);
  });
});
