import { expect, test, type Page } from "@playwright/test";
import { adminCredentials, coordinatorCredentials } from "./fixtures/auth";
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

  test("admin vê permissões sensíveis de sessão no perfil do coordenador", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);

    await page.goto("/app/configuracoes?tab=profiles");
    await waitForPageReady(page);

    await expect(page.getByTestId("system-settings-page")).toBeVisible({
      timeout: 15000,
    });

    await page
      .getByPlaceholder(/Buscar por nome, e-mail, posto ou setor/i)
      .fill(coordinatorCredentials.email);

    const coordinatorRow = page
      .locator("article")
      .filter({ hasText: coordinatorCredentials.email })
      .first();
    await expect(coordinatorRow).toBeVisible({ timeout: 10000 });
    await coordinatorRow.getByRole("button", { name: /editar perfil/i }).click();

    const dialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", { name: /editar perfil de acesso/i }),
    });
    await expect(dialog).toBeVisible({ timeout: 10000 });

    await dialog.getByLabel(/Nivel de acesso/i).selectOption("coordinator");

    await expect(dialog.getByText(/Permissoes de sessão/i)).toBeVisible();
    await expect(dialog.getByLabel(/Criar nova sessão/i)).toBeVisible();
    await expect(dialog.getByLabel(/Duplicar sessão/i)).toBeVisible();
    await expect(dialog.getByLabel(/Cancelar sessão/i)).toBeVisible();
  });
});
