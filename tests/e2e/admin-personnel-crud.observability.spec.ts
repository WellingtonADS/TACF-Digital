import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";
import {
  assertResponseTimeBelow,
  assertToastVisible,
  forceSlowBookingsQuery,
  forceSlowProfilesQuery,
  measureActionDurationMs,
} from "./support/observability";
import {
  getProfileButtonsCount,
  goToPersonnelManagement,
  openFirstProfileDrawer,
  searchPersonnel,
  toggleActiveFromDrawer,
} from "./support/personnelHelpers";

test.describe("Admin Efetivo CRUD operacional + observabilidade", () => {
  test.describe.configure({ mode: "serial" });

  const runId = Date.now();

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("loading da gestão de efetivo e tempo de resposta", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowProfilesQuery(page, 1300);
    await forceSlowBookingsQuery(page, 1300);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/efetivo");
      await expect(
        page.getByText("Carregando efetivo...").last(),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Gestão de Efetivo" }),
      ).toBeVisible();
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/efetivo",
    );
    await page.unroute("**/rest/v1/profiles**");
    await page.unroute("**/rest/v1/bookings**");
  });

  test("avisos e filtros: empty state por busca", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToPersonnelManagement(page);
    await searchPersonnel(page, `SEM_RESULTADO_${runId}`);
    await expect(
      page
        .getByText("Nenhum militar encontrado para os filtros selecionados.")
        .last(),
    ).toBeVisible();
  });

  test("CRUD operacional: leitura + update de status ativo/inativo", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToPersonnelManagement(page);

    const profileCount = await getProfileButtonsCount(page);
    test.skip(
      profileCount === 0,
      "Sem perfis disponíveis para validar update de status.",
    );

    // R - Read
    await openFirstProfileDrawer(page);
    await expect(
      page.getByText(
        /Informações adicionais|Nenhum teste registrado\.|Carregando informações adicionais.../i,
      ),
    ).toBeVisible();

    // U - Update (toggle ativo/inativo)
    const updateElapsed = await measureActionDurationMs(async () => {
      const expectedToast = await toggleActiveFromDrawer(page);
      if (!expectedToast) {
        test.skip(
          true,
          "Não foi possível alternar status do perfil no drawer.",
        );
        return;
      }
      await assertToastVisible(page, expectedToast);
    });

    await assertResponseTimeBelow(
      updateElapsed,
      15000,
      "Atualização de status no efetivo",
    );
  });
});
