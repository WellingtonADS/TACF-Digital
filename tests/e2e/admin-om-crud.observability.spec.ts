import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";
import {
  assertResponseTimeBelow,
  assertToastVisible,
  forceSlowLocationsRpc,
  measureActionDurationMs,
} from "./support/observability";
import {
  fillOmForm,
  goToNewOmForm,
  markOmAsInactive,
  openOmEditorFromCard,
  saveNewOm,
  saveOmChanges,
  searchOmByName,
} from "./support/omCrudHelpers";

test.describe("Admin OMs CRUD + observabilidade", () => {
  test.describe.configure({ mode: "serial" });

  const runId = Date.now();
  const createdName = `E2E OM ${runId}`;
  const editedName = `${createdName} EDITADA`;

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("loading da listagem e tempo de resposta inicial", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowLocationsRpc(page, 1400);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/om-locations");
      await expect(page.locator(".animate-pulse").first()).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Gestão de OMs e Locais" }),
      ).toBeVisible();
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/om-locations",
    );
    await page.unroute("**/rest/v1/rpc/get_locations");
  });

  test("alertas e avisos: validacao + aviso visual", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToNewOmForm(page);
    await page
      .getByPlaceholder("Ex.: HACO – Hospital de Aeronáutica de Canoas")
      .fill("   ");
    await page
      .getByPlaceholder("Rua, número, bairro, cidade — UF")
      .fill("Endereco temporario E2E");
    await page.getByRole("button", { name: "Cadastrar Unidade" }).click();
    await assertToastVisible(page, "Nome é obrigatório");

    await expect(
      page.getByText("Nenhuma instalação adicionada."),
    ).toBeVisible();
  });

  test("CRUD investigativo: create/read/update/delete logico com toasts", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    // C - Create
    await goToNewOmForm(page);
    await fillOmForm(page, {
      name: createdName,
      address: "Base Aerea - E2E - Rua 1",
      capacity: 37,
      facility: "Pista E2E",
    });

    const createElapsed = await measureActionDurationMs(async () => {
      await saveNewOm(page);
      await assertToastVisible(page, "Unidade criada com sucesso");
      await expect(page).toHaveURL(/\/app\/om-locations$/);
    });
    await assertResponseTimeBelow(createElapsed, 15000, "Create de OM");

    // R - Read
    await searchOmByName(page, createdName);
    await expect(
      page.locator("article", { hasText: createdName }).first(),
    ).toBeVisible();

    // U - Update
    const omId = await openOmEditorFromCard(page, createdName);
    expect(omId).toBeTruthy();
    await page
      .getByPlaceholder("Ex.: HACO – Hospital de Aeronáutica de Canoas")
      .fill(editedName);
    await markOmAsInactive(page);

    const updateElapsed = await measureActionDurationMs(async () => {
      await saveOmChanges(page);
      await assertToastVisible(page, "Unidade atualizada com sucesso");
      await expect(page).toHaveURL(/\/app\/om-locations$/);
    });
    await assertResponseTimeBelow(updateElapsed, 15000, "Update de OM");

    // D - Delete lógico (desativação) coberto pela ação de marcar inativo + submit com sucesso.
    expect(omId).toBeTruthy();
  });
});
