import { expect, test } from "@playwright/test";
import { loginAsUser } from "./support/auth";
import {
  assertResponseTimeBelow,
  forceSlowResultsHistoryRpc,
  measureActionDurationMs,
} from "./support/observability";
import {
  discardAppealDraft,
  ensureProfileRequiredFields,
  goToDocuments,
  goToResultsHistory,
  goToUserProfile,
  submitAppealRequest,
  submitRescheduleIfEligible,
  updatePhoneWithRollback,
} from "./support/userCrudHelpers";

test.describe("Usuário CRUD operacional + observabilidade", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsUser(page);
  });

  test("read: loading do histórico e tempo de resposta", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowResultsHistoryRpc(page, 1300);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/resultados");
      await expect(page.locator(".animate-pulse").first()).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Histórico de Avaliações" }),
      ).toBeVisible({ timeout: 20000 });
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/resultados",
    );
    await page.unroute("**/rest/v1/rpc/get_results_history**");
  });

  test("create: envio de solicitação de recurso", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await submitAppealRequest(page);
    await expect(
      page.getByRole("button", { name: "Voltar ao Histórico" }),
    ).toBeVisible();
  });

  test("update: perfil com rollback de telefone", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToUserProfile(page);
    await ensureProfileRequiredFields(page);
    await updatePhoneWithRollback(page);
  });

  test("delete lógico: descarte de rascunho de recurso", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await discardAppealDraft(page);
    await expect(page).toHaveURL(/\/app$/);
  });

  test("read: documentos carregam e expõem acesso ao ticket", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToDocuments(page);
    await expect(
      page.getByRole("heading", { name: "Bilhete Digital" }),
    ).toBeVisible();

    await goToResultsHistory(page);
    await expect(
      page.getByText(
        /Status Atual|Você ainda não possui resultados registrados\./i,
      ),
    ).toBeVisible();
  });

  test.describe("reagendamento condicional", () => {
    test("[reagendamento-condicional] update: solicitar reagendamento quando houver dado elegível", async ({
      page,
    }, testInfo) => {
      test.skip(
        testInfo.project.name !== "desktop-1440",
        "Cobertura investigativa configurada para desktop-1440.",
      );

      const outcome = await submitRescheduleIfEligible(page);

      testInfo.annotations.push({
        type: "user-reagendamento-condicional",
        description: outcome.executed
          ? "Reagendamento condicional executado com sucesso."
          : `Cenário não executado: ${outcome.reason ?? "motivo não informado"}`,
      });

      test.skip(!outcome.executed, outcome.reason);
    });
  });
});
