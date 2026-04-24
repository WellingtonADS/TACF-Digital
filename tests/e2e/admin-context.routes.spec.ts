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

test.describe("Contexto administrativo", () => {
  test("acesso anonimo a rota administrativa redireciona para login", async ({
    page,
  }) => {
    await page.goto("/app/admin");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId("login-email-input")).toBeVisible();
  });

  test("acesso autenticado redireciona admin para dashboard administrativo", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await loginAsAdmin(loginPage);

    await expect(page).toHaveURL(/\/app\/admin$/);
    await expect(page.getByTestId("admin-dashboard")).toBeVisible();
    await expect(page.getByText("Total Inscritos")).toBeVisible();
    await expect(page.getByTestId("admin-quick-action-turmas")).toBeVisible();
  });

  test("admin autenticado acessa rotas prioritarias do contexto", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await loginAsAdmin(loginPage);

    await page.goto("/app/turmas");
    await expect(page).toHaveURL(/\/app\/turmas$/);
    await waitForPageReady(page);
    await expect(page.getByTestId("sessions-management-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(page.getByTestId("sessions-management-title")).toBeVisible();

    await page.goto("/app/turmas?tab=reagendamentos");
    await expect(page).toHaveURL(/\/app\/turmas\?tab=reagendamentos$/);
    await waitForPageReady(page);
    await expect(page.getByTestId("sessions-management-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: "Reagendamentos" }),
    ).toBeVisible();
  });
});
