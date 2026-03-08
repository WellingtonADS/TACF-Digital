import { expect, test } from "@playwright/test";
import {
  clickFirstExportButton,
  goToAnalyticsDashboard,
  openExportTab,
  openPendingTab,
  searchPendingByTerm,
} from "./support/analyticsHelpers";
import { loginAsAdmin } from "./support/auth";
import {
  assertResponseTimeBelow,
  assertToastVisible,
  forceSlowBookingsQuery,
  forceSlowProfilesQuery,
  measureActionDurationMs,
} from "./support/observability";

test.describe("Admin Analytics observabilidade + investigação", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("loading de analytics e tempo de resposta", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowProfilesQuery(page, 1300);
    await forceSlowBookingsQuery(page, 1300);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/analytics");
      await expect(
        page.getByText(/Carregando\.\.\.|Carregando dados\.\.\./i).first(),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Relatorios Consolidados" }),
      ).toBeVisible({ timeout: 20000 });
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/analytics",
    );
    await page.unroute("**/rest/v1/profiles**");
    await page.unroute("**/rest/v1/bookings**");
  });

  test("filtros investigativos: empty state por busca na revalidação", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToAnalyticsDashboard(page);
    await openPendingTab(page);
    await searchPendingByTerm(page, `SEM_ANALYTICS_${Date.now()}`);

    await expect(
      page.getByRole("cell", { name: "Nenhuma revalidacao pendente." }),
    ).toBeVisible();
  });

  test("export operacional: baixar relatorio com feedback visual", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToAnalyticsDashboard(page);
    await openExportTab(page);
    await clickFirstExportButton(page);

    await assertToastVisible(
      page,
      /Relatorio exportado com sucesso\.|Relatorio de unidades exportado\.|Relatorio completo exportado\./i,
    );
  });
});
