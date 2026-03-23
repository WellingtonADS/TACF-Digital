import { expect, test, type Page } from "@playwright/test";
import { coordinatorCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 15000,
  });
}

async function loginAsCoordinator(loginPage: LoginPage) {
  await loginPage.goto();
  await loginPage.login(
    coordinatorCredentials.email,
    coordinatorCredentials.password,
  );
  await expect(loginPage.page).toHaveURL(/\/app(\/admin)?/, {
    timeout: 15000,
  });
  await waitForPageReady(loginPage.page);
}

test.describe("Autorização: Coordenador", () => {
  test("coordenador recebe toast de não autorizado ao tentar criar turma", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsCoordinator(loginPage);

    await page.goto("/app/turmas/nova");
    await waitForPageReady(page);

    await expect(
      page.getByRole("heading", { name: "Criar Nova Turma" }),
    ).toBeVisible();

    // Preenche o mínimo necessário para evitar bloqueio da validação nativa do browser.
    await page.locator('input[type="date"]').first().fill("2026-04-15");
    await page.locator('input[type="time"]').fill("08:00");

    await page.getByRole("button", { name: /publicar turma/i }).click();

    await expect(
      page.getByText(
        "Acesso negado: você não tem permissão para criar turmas.",
      ),
    ).toBeVisible({ timeout: 10000 });
  });
});
