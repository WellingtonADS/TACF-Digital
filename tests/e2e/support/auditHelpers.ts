import { expect, type Page } from "@playwright/test";

export async function goToAuditLog(page: Page) {
  await page.goto("/app/auditoria");
  await expect(
    page.getByRole("heading", { name: "Log de Auditoria" }),
  ).toBeVisible();
}

export async function filterAuditByUser(page: Page, term: string) {
  await page.getByPlaceholder("Ex: 7234567 ou Nome").fill(term);
  await page.getByRole("button", { name: "Filtrar" }).click();
}

export async function openFirstJsonDetails(page: Page) {
  const firstJsonButton = page.getByRole("button", { name: /JSON/i }).first();
  if ((await firstJsonButton.count()) === 0) {
    return false;
  }

  await firstJsonButton.click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByText("Detalhes da Alteração")).toBeVisible();
  return true;
}

export async function closeJsonDetails(page: Page) {
  await page.getByRole("button", { name: "Fechar" }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
}
