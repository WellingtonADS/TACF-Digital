import { expect, type Page } from "@playwright/test";

export async function goToReschedulingManagement(page: Page) {
  await page.goto("/app/reagendamentos");
  await expect(
    page.getByRole("heading", {
      name: "Gestão de Solicitações de Reagendamento",
    }),
  ).toBeVisible();
}

export async function filterPending(page: Page) {
  await page.getByRole("button", { name: "PENDENTES" }).click();
}

export async function filterApproved(page: Page) {
  await page.getByRole("button", { name: "APROVADOS" }).click();
}

export async function filterDenied(page: Page) {
  await page.getByRole("button", { name: "RECUSADOS" }).click();
}

export async function searchRescheduling(page: Page, term: string) {
  await page.getByPlaceholder("PESQUISAR POR SARAM OU NOME...").fill(term);
}

export async function openFirstJustification(page: Page) {
  const button = page
    .getByRole("button", { name: /Ver Justificativa/i })
    .first();
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
}

export async function deferFirstRequest(page: Page) {
  const deferBtn = page.getByRole("button", { name: /DEFERIR/i }).first();
  await expect(deferBtn).toBeVisible({ timeout: 10000 });
  await deferBtn.click();
}

export async function denyFirstRequest(page: Page) {
  const denyBtn = page.getByRole("button", { name: /INDEFERIR/i }).first();
  await expect(denyBtn).toBeVisible({ timeout: 10000 });
  await denyBtn.click();
}

export async function getDecisionButtonsCount(page: Page) {
  return page.getByRole("button", { name: /DEFERIR|INDEFERIR/i }).count();
}
