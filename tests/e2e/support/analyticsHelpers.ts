import { expect, type Page } from "@playwright/test";

export async function goToAnalyticsDashboard(page: Page) {
  await page.goto("/app/analytics");
  await expect(
    page.getByRole("heading", { name: "Relatorios Consolidados" }),
  ).toBeVisible({ timeout: 20000 });
}

export async function openPendingTab(page: Page) {
  await page.getByRole("button", { name: /Pendente/i }).click();
  await expect(page.getByPlaceholder("Buscar nome ou SARAM...")).toBeVisible();
}

export async function searchPendingByTerm(page: Page, term: string) {
  await page.getByPlaceholder("Buscar nome ou SARAM...").fill(term);
}

export async function openExportTab(page: Page) {
  await page.getByRole("button", { name: /Export|Exportar/i }).click();
  await expect(
    page.getByRole("button", { name: "Baixar" }).first(),
  ).toBeVisible();
}

export async function clickFirstExportButton(page: Page) {
  await page.getByRole("button", { name: "Baixar" }).first().click();
}
