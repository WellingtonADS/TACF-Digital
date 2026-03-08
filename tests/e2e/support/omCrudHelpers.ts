import { expect, type Page } from "@playwright/test";

export type OmDraft = {
  name: string;
  address: string;
  capacity: number;
  facility: string;
};

export async function goToNewOmForm(page: Page) {
  await page.goto("/app/om/new");
  await expect(
    page.getByRole("heading", { name: "Nova Organização Militar" }),
  ).toBeVisible();
}

export async function fillOmForm(page: Page, draft: OmDraft) {
  await page
    .getByPlaceholder("Ex.: HACO – Hospital de Aeronáutica de Canoas")
    .fill(draft.name);
  await page
    .getByPlaceholder("Rua, número, bairro, cidade — UF")
    .fill(draft.address);

  const capacityInput = page.locator('input[type="number"]').first();
  await capacityInput.fill(String(draft.capacity));

  const facilityInput = page.getByPlaceholder("Ex.: Pista de Atletismo");
  await facilityInput.fill(draft.facility);
  await page.getByRole("button", { name: "Adicionar" }).click();

  await expect(page.getByText(draft.facility)).toBeVisible();
}

export async function saveNewOm(page: Page) {
  await page.getByRole("button", { name: "Cadastrar Unidade" }).click();
}

export async function saveOmChanges(page: Page) {
  await page.getByRole("button", { name: "Salvar Alterações" }).click();
}

export async function searchOmByName(page: Page, name: string) {
  const searchInput = page.getByPlaceholder(
    "Buscar organização militar ou localidade...",
  );
  await searchInput.fill(name);
}

export async function openOmEditorFromCard(page: Page, name: string) {
  const card = page.locator("article", { hasText: name }).first();
  await expect(card).toBeVisible({ timeout: 15000 });
  await card.getByRole("button", { name: "Editar" }).click();
  await expect(page).toHaveURL(/\/app\/om\//);

  const match = page.url().match(/\/app\/om\/([^/]+)$/);
  return match?.[1] ?? null;
}

export async function markOmAsInactive(page: Page) {
  await page.getByRole("button", { name: /Inativo/i }).click();
}

export async function filterInactiveOms(page: Page) {
  await page.getByRole("button", { name: "INATIVO" }).click();
}
