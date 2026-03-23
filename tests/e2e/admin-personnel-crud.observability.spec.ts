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

test.describe("Observabilidade: Gestão de Efetivo", () => {
  test("admin vê página de efetivo com título", async ({ page }) => {
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

  test("admin vê campo de busca na página de efetivo", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/efetivo");
    await waitForPageReady(page);

    await expect(page.getByTestId("personnel-management-page")).toBeVisible({
      timeout: 15000,
    });

    // Input de busca deve estar visível
    await expect(
      page.getByPlaceholder(/buscar|pesquisar|nome|militar/i),
    ).toBeVisible({ timeout: 10000 });
  });

  test("admin vê filtros de graduação e status no efetivo", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/efetivo");
    await waitForPageReady(page);

    await expect(page.getByTestId("personnel-management-page")).toBeVisible({
      timeout: 15000,
    });

    // Selects de filtro devem estar presentes
    const selects = page.locator("select");
    await expect(selects.first()).toBeVisible({ timeout: 10000 });
  });
});
