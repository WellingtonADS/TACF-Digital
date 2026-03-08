import { expect, type Page } from "@playwright/test";

export async function goToSystemSettings(page: Page) {
  await page.goto("/app/configuracoes");
  await expect(
    page.getByRole("heading", { name: "Configurações do Sistema" }),
  ).toBeVisible();
}

export async function toggleAllowSwapsCheckbox(page: Page) {
  await page.getByRole("button", { name: "Geral" }).click();
  const checkbox = page.locator("#allow_swaps");
  await expect(checkbox).toBeVisible();
  const before = await checkbox.isChecked();
  await checkbox.click();
  const after = await checkbox.isChecked();
  return { before, after };
}

export async function saveSystemSettings(page: Page) {
  await page.getByRole("button", { name: "Salvar" }).click();
}

export async function goToAccessProfiles(page: Page) {
  await page.goto("/app/configuracoes/perfis");
  await expect(
    page.getByRole("heading", { name: /Perfis Cadastrados/i }),
  ).toBeVisible({ timeout: 20000 });
}

export async function clickFirstPermissionCheckbox(page: Page) {
  const profileButtons = page.locator("aside .space-y-3 button");
  const profilesCount = await profileButtons.count();
  if (profilesCount > 1) {
    await profileButtons.nth(1).click();
  }

  const checkbox = page
    .locator("tbody input[type='checkbox']:not([disabled])")
    .first();
  if ((await checkbox.count()) === 0) {
    return null;
  }

  await expect(checkbox).toBeVisible({ timeout: 15000 });
  const before = await checkbox.isChecked();
  await checkbox.click();
  const after = await checkbox.isChecked();
  return { before, after };
}

export async function createAccessProfileViaPrompt(page: Page, name: string) {
  page.once("dialog", async (dialog) => {
    await dialog.accept(name);
  });

  await page.getByRole("button", { name: /Novo Perfil/i }).click();
}
