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

test.describe("Observabilidade: OMs e Locais de Avaliação", () => {
  test("admin vê página de gerenciamento de OMs carregada", async ({
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

  test("admin vê botão de nova OM ou lista de locais existentes", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/om-locations");
    await waitForPageReady(page);

    await expect(page.getByTestId("om-location-manager-page")).toBeVisible({
      timeout: 15000,
    });

    // Espera lista ou estado vazio carregados
    const hasList = await page
      .locator('[class*="grid"]')
      .first()
      .isVisible()
      .catch(() => false);
    const hasEmpty = await page
      .getByText(/Nenhum local|Cadastrar nova OM/i)
      .isVisible()
      .catch(() => false);
    expect(hasList || hasEmpty).toBe(true);
  });
});
