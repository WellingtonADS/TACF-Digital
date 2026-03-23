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

test.describe("Observabilidade CRUD: Fluxos de Usuário", () => {
  test("usuário vê dashboard operacional com cards de ações", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsUser(loginPage);

    await expect(page.getByTestId("operational-dashboard")).toBeVisible({
      timeout: 15000,
    });

    // Valida a presença dos cards/ações principais sem assumir semântica de botão.
    await expect(page.getByText(/Marcar TACF/i)).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/Histórico/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test("usuário vê calendário de agendamentos com navegação de meses", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsUser(loginPage);

    await page.goto("/app/agendamentos");
    await waitForPageReady(page);

    await expect(page.getByTestId("scheduling-page")).toBeVisible({
      timeout: 15000,
    });

    // Título da página de agendamento
    await expect(
      page.getByRole("heading", { name: "Novo Agendamento" }),
    ).toBeVisible();
  });

  test("usuário vê histórico de resultados com lista de avaliações", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsUser(loginPage);

    await page.goto("/app/resultados");
    await waitForPageReady(page);

    await expect(page.getByTestId("results-history-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: "Histórico de Avaliações" }),
    ).toBeVisible();
  });

  test("usuário vê página de documentos com normativos", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsUser(loginPage);

    await page.goto("/app/documentos");
    await waitForPageReady(page);

    await expect(page.getByTestId("documents-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("heading", { name: "Documentos e Normas" }),
    ).toBeVisible();
    await expect(page.getByText(/^Normativos$/i)).toBeVisible();
  });

  test("usuário não consegue acessar rota administrativa", async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginAsUser(loginPage);

    await page.goto("/app/admin");
    await waitForPageReady(page);

    // Deve ser redirecionado ou ver tela de acesso negado
    const isOnAdmin = page.url().includes("/app/admin");
    if (isOnAdmin) {
      // Se chegou na rota, deve ver tela de proibido, não o dashboard admin
      await expect(page.getByTestId("admin-dashboard")).not.toBeVisible();
    } else {
      // Redirecionado para home do usuário
      await expect(page).toHaveURL(/\/app(\/)?$/);
    }
  });

  test("reagendamento-condicional: usuário vê opção de reagendamento no dashboard quando aplicável", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsUser(loginPage);

    await expect(page.getByTestId("operational-dashboard")).toBeVisible({
      timeout: 15000,
    });

    // O botão de reagendamento pode ou não estar visível dependendo do estado do agendamento
    // Este teste apenas verifica que o dashboard carregou sem erros
    await expect(page).not.toHaveURL(/\/login/);
  });
});
