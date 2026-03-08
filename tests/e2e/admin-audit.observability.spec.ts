import { expect, test } from "@playwright/test";
import {
  closeJsonDetails,
  filterAuditByUser,
  goToAuditLog,
  openFirstJsonDetails,
} from "./support/auditHelpers";
import { loginAsAdmin } from "./support/auth";
import {
  assertResponseTimeBelow,
  forceSlowAuditLogsQuery,
  measureActionDurationMs,
} from "./support/observability";

test.describe("Admin Auditoria observabilidade + investigação", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("loading da auditoria e tempo de resposta", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowAuditLogsQuery(page, 1300);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/auditoria");
      await expect(page.locator(".animate-pulse").first()).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Log de Auditoria" }),
      ).toBeVisible();
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/auditoria",
    );
    await page.unroute("**/rest/v1/audit_logs**");
  });

  test("avisos e filtros: exibe empty state por busca", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToAuditLog(page);
    await filterAuditByUser(page, `SEM_LOG_${Date.now()}`);

    await expect(
      page.getByText("Nenhum registro encontrado para os filtros aplicados."),
    ).toBeVisible();
  });

  test("leitura operacional: abre e fecha modal de JSON", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToAuditLog(page);

    const hasJsonDetails = await openFirstJsonDetails(page);
    test.skip(!hasJsonDetails, "Sem registros com payload JSON disponível.");

    await closeJsonDetails(page);
  });
});
