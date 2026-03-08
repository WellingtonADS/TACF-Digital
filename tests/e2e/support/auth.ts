import { expect, type Page } from "@playwright/test";

function getRequiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel de ambiente obrigatoria ausente: ${name}`);
  }
  return value;
}

export function getAdminCredentials() {
  return {
    email: getRequiredEnv("SEED_ADMIN_EMAIL"),
    password: getRequiredEnv("SEED_ADMIN_PASSWORD"),
  };
}

export function getUserCredentials() {
  return {
    email: getRequiredEnv("SEED_USER_EMAIL"),
    password: getRequiredEnv("SEED_USER_PASSWORD"),
  };
}

export async function loginAsAdmin(page: Page) {
  const { email, password } = getAdminCredentials();

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto("/login");
    await page.getByPlaceholder("Ex.: joao.silva@fab.mil.br").fill(email);
    await page.getByPlaceholder("Digite sua senha").fill(password);
    await page.getByRole("button", { name: "ENTRAR" }).click();

    try {
      await expect(page).toHaveURL(/\/app(\/admin)?$/, { timeout: 10000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 2) {
        throw lastError;
      }
    }
  }
}

export async function loginAsUser(page: Page) {
  const { email, password } = getUserCredentials();

  let lastError: unknown;

  for (let attempt = 1; attempt <= 2; attempt += 1) {
    await page.goto("/login");
    await page.getByPlaceholder("Ex.: joao.silva@fab.mil.br").fill(email);
    await page.getByPlaceholder("Digite sua senha").fill(password);
    await page.getByRole("button", { name: "ENTRAR" }).click();

    try {
      await expect(page).toHaveURL(/\/app$/, { timeout: 10000 });
      return;
    } catch (error) {
      lastError = error;
      if (attempt === 2) {
        throw lastError;
      }
    }
  }
}

export async function logout(page: Page) {
  const mobileMenuButton = page.getByRole("button", { name: "Abrir menu" });
  if (await mobileMenuButton.isVisible().catch(() => false)) {
    await mobileMenuButton.click();
  }

  const logoutButton = page.getByRole("button", { name: "Sair" });
  await logoutButton.scrollIntoViewIfNeeded();
  await logoutButton.click();
  await expect(page).toHaveURL(/\/login$/);
}
