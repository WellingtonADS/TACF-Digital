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

test.describe("Jornada visual do administrador", () => {
  test("admin visualiza dashboard com métricas e ações rápidas", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
    await expect(page.getByText("Total Inscritos")).toBeVisible();
    await expect(page.getByTestId("admin-quick-action-turmas")).toBeVisible();
    await expect(
      page.getByTestId("admin-quick-action-turmas?tab=reagendamentos"),
    ).toBeVisible();
  });

  test("admin navega para gestão de efetivo e vê lista de militares", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/efetivo");
    await waitForPageReady(page);

    await expect(page.getByTestId("personnel-management-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: "Gestão de Efetivo" }),
    ).toBeVisible();
  });

  test("admin navega para analytics e vê cabeçalho de período", async ({
    page,
  }) => {
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

  test("admin navega para configurações e vê painel de navegação lateral", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/configuracoes");
    await waitForPageReady(page);

    await expect(page.getByTestId("system-settings-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: "Configurações do Sistema" }),
    ).toBeVisible();
  });

  test("admin navega para auditoria e vê log de eventos", async ({ page }) => {
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

  test("admin navega para locais de avaliação e vê gerenciador de OMs", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/om-locations");
    await waitForPageReady(page);

    await expect(page.getByTestId("om-location-manager-page")).toBeVisible({
      timeout: 15000,
    });
  });
});
