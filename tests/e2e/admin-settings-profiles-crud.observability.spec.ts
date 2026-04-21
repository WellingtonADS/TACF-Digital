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

test.describe("Observabilidade: Configurações e Perfis de Acesso", () => {
  test("admin vê página de configurações do sistema", async ({ page }) => {
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

  test("admin vê painel de seções nas configurações", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/configuracoes");
    await waitForPageReady(page);

    await expect(page.getByTestId("system-settings-page")).toBeVisible({
      timeout: 15000,
    });

    // Lateral de seções (aside com botões de seção)
    await expect(
      page
        .getByRole("button", { name: /semestre|geral|usuários|segurança/i })
        .first(),
    ).toBeVisible({ timeout: 10000 });
  });

  test("admin vê página de gestão de perfis de acesso", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/configuracoes?tab=profiles");
    await waitForPageReady(page);

    await expect(page.getByTestId("system-settings-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: /Perfis de Acesso/i }),
    ).toBeVisible({ timeout: 10000 });
  });
});
