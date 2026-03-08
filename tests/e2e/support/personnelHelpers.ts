import { expect, type Page } from "@playwright/test";

export async function goToPersonnelManagement(page: Page) {
  await page.goto("/app/efetivo");
  await expect(
    page.getByRole("heading", { name: "Gestão de Efetivo" }),
  ).toBeVisible();
}

export async function searchPersonnel(page: Page, term: string) {
  await page.getByPlaceholder("Buscar por SARAM ou Nome...").fill(term);
}

export async function openFirstProfileDrawer(page: Page) {
  const button = page.getByRole("button", { name: "Ver perfil" }).first();
  await expect(button).toBeVisible({ timeout: 15000 });
  await button.click();
}

export async function closeProfileDrawer(page: Page) {
  await page
    .getByRole("button", { name: "button" })
    .filter({ has: page.locator("svg") })
    .first();
}

export async function getProfileButtonsCount(page: Page) {
  return page.getByRole("button", { name: "Ver perfil" }).count();
}

export async function toggleActiveFromDrawer(page: Page) {
  const inactivate = page.getByRole("button", { name: "Inativo" }).first();
  const activate = page.getByRole("button", { name: "Ativo" }).first();

  if (
    (await inactivate.count()) > 0 &&
    (await inactivate.isEnabled().catch(() => false))
  ) {
    await inactivate.click();
    return "Militar inativado.";
  }

  if (
    (await activate.count()) > 0 &&
    (await activate.isEnabled().catch(() => false))
  ) {
    await activate.click();
    return "Militar ativado.";
  }

  return null;
}
