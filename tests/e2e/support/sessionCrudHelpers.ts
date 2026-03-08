import { expect, type Page } from "@playwright/test";

export async function goToClassCreationForm(page: Page) {
  await page.goto("/app/turmas/nova");
  await expect(
    page.getByRole("heading", { name: "Criar Nova Turma" }),
  ).toBeVisible();
}

export async function fillSingleSessionDate(page: Page, date: string) {
  await page.locator('input[type="date"]').first().fill(date);
}

export async function fillSessionStartTime(page: Page, time: string) {
  await page.locator('input[type="time"]').first().fill(time);
}

export async function fillSessionCapacity(page: Page, capacity: number) {
  await page.locator('input[type="number"]').first().fill(String(capacity));
}

export async function publishSession(page: Page) {
  await page.getByRole("button", { name: "Publicar Turma" }).click();
}

export async function goToSessionsManagement(page: Page) {
  await page.goto("/app/turmas");
  await expect(
    page.getByRole("heading", { name: "Gerenciar Turmas" }),
  ).toBeVisible();
}

export async function openFirstSessionEditor(page: Page) {
  const firstEditButton = page
    .getByRole("button", { name: "Editar turma" })
    .first();
  await expect(firstEditButton).toBeVisible({ timeout: 15000 });
  await firstEditButton.click();
  await expect(page).toHaveURL(/\/app\/turmas\/.+\/editar$/);
  await expect(
    page.getByRole("heading", { name: "Editar Turma" }),
  ).toBeVisible();
}

export async function saveSessionChanges(page: Page) {
  await page.getByRole("button", { name: "Salvar Alterações" }).click();
}

export async function cancelSessionLogically(page: Page) {
  await page.getByRole("button", { name: "Cancelar Turma" }).click();
  await expect(
    page.getByRole("heading", { name: "Cancelar turma?" }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Confirmar" }).click();
}
