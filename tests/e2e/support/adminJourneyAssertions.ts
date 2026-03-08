import { expect, type Page } from "@playwright/test";
import type { AdminMenuCase } from "./adminJourneyData";

export async function assertAdminShellVisible(page: Page) {
  await expect(page.locator("aside")).toBeVisible();
  await expect(page.getByText("TACF-Digital")).toBeVisible();
  await expect(page.getByRole("button", { name: "Sair" })).toBeVisible();
}

export async function openMobileSidebar(page: Page) {
  await page.getByRole("button", { name: "Abrir menu" }).click();
  await expect(page.locator("aside")).toBeVisible();
}

export async function closeMobileSidebar(page: Page) {
  await page.getByRole("button", { name: "Fechar menu" }).click();
}

export async function assertAdminMenuNavigation(
  page: Page,
  routeCase: AdminMenuCase,
) {
  await page.getByRole("link", { name: routeCase.menuLabel }).click();

  await expect(page).toHaveURL(new RegExp(`${routeCase.path}$`));
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByText("Acesso negado")).toHaveCount(0);
  await expect(page.getByText("Area administrativa restrita")).toHaveCount(0);

  await expect(
    page.getByRole("heading", { name: routeCase.pageMarker }),
  ).toBeVisible({ timeout: 20000 });
}

export async function assertAdminDirectRouteAccess(page: Page, route: string) {
  await page.goto(route);

  await expect(page).toHaveURL(new RegExp(`${route}$`));
  await expect(page).not.toHaveURL(/\/login$/);
  await expect(page.getByText("Acesso negado")).toHaveCount(0);
  await expect(page.getByText("Area administrativa restrita")).toHaveCount(0);
  await expect(page.locator("main").first()).toBeVisible();
}
