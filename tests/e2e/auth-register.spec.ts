import { expect, test } from "@playwright/test";

const BASE = process.env.E2E_BASE_URL ?? "http://localhost:5173";

test.describe("Auth — cadastro de usuário", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`${BASE}/register`);
    await expect(page).toHaveURL(/\/register/);
  });

  test("exibe a página de cadastro com todos os campos", async ({ page }) => {
    await expect(
      page.locator('[name="tacf-register-full-name"]'),
    ).toBeVisible();
    await expect(page.locator('[name="tacf-register-email"]')).toBeVisible();
    await expect(page.locator('[name="tacf-register-password"]')).toBeVisible();
    await expect(
      page.getByRole("button", { name: /cadastrar/i }),
    ).toBeVisible();
  });

  test("exibe erro ao enviar formulário vazio", async ({ page }) => {
    await page.getByRole("button", { name: /cadastrar/i }).click();

    await expect(
      page.getByText(/preencha todos os campos|obrigatório|required/i),
    ).toBeVisible({ timeout: 5_000 });

    await expect(page).toHaveURL(/\/register/);
  });

  test("exibe erro para e-mail inválido", async ({ page }) => {
    await page
      .locator('[name="tacf-register-full-name"]')
      .fill("Teste Usuário");
    await page.locator('[name="tacf-register-email"]').fill("emailinvalido");
    await page.locator('[name="tacf-register-password"]').fill("senha12345");
    await page.getByRole("button", { name: /cadastrar/i }).click();

    await expect(
      page.getByText(/e-?mail inválido|email inválido|invalid.*email/i),
    ).toBeVisible({ timeout: 5_000 });

    await expect(page).toHaveURL(/\/register/);
  });

  test("exibe erro para senha com menos de 8 caracteres", async ({ page }) => {
    await page
      .locator('[name="tacf-register-full-name"]')
      .fill("Teste Usuário");
    await page.locator('[name="tacf-register-email"]').fill("teste@fab.mil.br");
    await page.locator('[name="tacf-register-password"]').fill("1234567");
    await page.getByRole("button", { name: /cadastrar/i }).click();

    await expect(
      page.getByText(/mínimo.*8|pelo menos 8|8 caracteres/i),
    ).toBeVisible({ timeout: 5_000 });

    await expect(page).toHaveURL(/\/register/);
  });

  test("registra novo usuário com sucesso e redireciona", async ({ page }) => {
    test.skip(
      !process.env.E2E_LIVE,
      "E2E_LIVE não definido — pulando teste com Supabase real",
    );

    const uniqueEmail = `e2e+${Date.now()}@fab.mil.br`;

    await page
      .locator('[name="tacf-register-full-name"]')
      .fill("Usuário Teste E2E");
    await page.locator('[name="tacf-register-email"]').fill(uniqueEmail);
    await page
      .locator('[name="tacf-register-password"]')
      .fill("SenhaSegura@2025");
    await page.getByRole("button", { name: /cadastrar/i }).click();

    // Após cadastro bem-sucedido: redireciona para /app/perfil ou /login
    await expect(page).toHaveURL(/\/app\/perfil|\/login/, {
      timeout: 15_000,
    });
  });
});
