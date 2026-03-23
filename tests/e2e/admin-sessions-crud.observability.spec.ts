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

test.describe("Observabilidade: Gestão de Turmas", () => {
  test("admin vê página de turmas com título e estrutura", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/turmas");
    await waitForPageReady(page);

    await expect(page.getByTestId("sessions-management-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("sessions-management-title")).toBeVisible();
  });

  test("admin vê botão para criar nova turma", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/turmas");
    await waitForPageReady(page);

    await expect(page.getByTestId("sessions-management-page")).toBeVisible({
      timeout: 15000,
    });

    // Botão de nova turma (pode estar na página ou como link)
    const novaButton = page
      .getByRole("button", { name: /nova turma/i })
      .or(page.getByRole("link", { name: /nova turma/i }));
    await expect(novaButton).toBeVisible({ timeout: 10000 });
  });

  test("admin acessa formulário de criação de nova turma", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/turmas/nova");
    await waitForPageReady(page);

    // Página de criação deve ter um formulário
    await expect(page.locator("form")).toBeVisible({ timeout: 15000 });
  });
});
