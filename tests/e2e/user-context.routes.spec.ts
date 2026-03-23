import { expect, test, type Page } from "@playwright/test";
import { userCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 15000,
  });
}

async function loginAsUser(loginPage: LoginPage) {
  await loginPage.goto();
  await loginPage.login(userCredentials.email, userCredentials.password);
  await expect(loginPage.page).toHaveURL(/\/app(\/)?$/, { timeout: 15000 });
  await waitForPageReady(loginPage.page);
}

test.describe("Contexto de usuário", () => {
  test("acesso anônimo a rota de usuário redireciona para login", async ({
    page,
  }) => {
    await page.goto("/app");

    await expect(page).toHaveURL(/\/login$/);
    await expect(page.getByTestId("login-email-input")).toBeVisible();
  });

  test("admin autenticado é redirecionado ao acessar rota de usuário", async ({
    page,
  }) => {
    const { adminCredentials } = await import("./fixtures/auth");
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login(adminCredentials.email, adminCredentials.password);
    await expect(page).toHaveURL(/\/app\/admin$/, { timeout: 15000 });
  });

  test("usuário autenticado acessa dashboard operacional", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginAsUser(loginPage);

    await expect(page).toHaveURL(/\/app\/?$/);
    await expect(page.getByTestId("operational-dashboard")).toBeVisible({
      timeout: 15000,
    });
  });

  test("usuário autenticado acessa página de agendamentos", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await loginAsUser(loginPage);

    await page.goto("/app/agendamentos");
    await expect(page).toHaveURL(/\/app\/agendamentos$/);
    await waitForPageReady(page);
    await expect(page.getByTestId("scheduling-page")).toBeVisible({
      timeout: 15000,
    });
  });

  test("usuário autenticado acessa histórico de resultados", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);

    await loginAsUser(loginPage);

    await page.goto("/app/resultados");
    await expect(page).toHaveURL(/\/app\/resultados$/);
    await waitForPageReady(page);
    await expect(page.getByTestId("results-history-page")).toBeVisible({
      timeout: 15000,
    });
  });

  test("usuário autenticado acessa página de documentos", async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginAsUser(loginPage);

    await page.goto("/app/documentos");
    await expect(page).toHaveURL(/\/app\/documentos$/);
    await waitForPageReady(page);
    await expect(page.getByTestId("documents-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: "Documentos e Normas" }),
    ).toBeVisible();
  });
});
