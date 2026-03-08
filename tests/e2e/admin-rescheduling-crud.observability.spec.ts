import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";
import {
  assertResponseTimeBelow,
  assertToastVisible,
  forceSlowBookingsQuery,
  measureActionDurationMs,
} from "./support/observability";
import {
  deferFirstRequest,
  filterPending,
  getDecisionButtonsCount,
  goToReschedulingManagement,
  openFirstJustification,
} from "./support/reschedulingHelpers";

test.describe("Admin Reagendamentos CRUD operacional + observabilidade", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("loading da gestão de reagendamentos e tempo de resposta", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowBookingsQuery(page, 1400);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/reagendamentos");
      await expect(page.locator(".animate-pulse").first()).toBeVisible();
      await expect(
        page.getByRole("heading", {
          name: "Gestão de Solicitações de Reagendamento",
        }),
      ).toBeVisible();
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/reagendamentos",
    );
    await page.unroute("**/rest/v1/bookings**");
  });

  test("avisos e notificações: página de notificação funciona", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await page.goto("/app/reagendamentos/notificacao");
    await expect(
      page.getByRole("heading", { name: "Notificações de Reagendamento" }),
    ).toBeVisible();

    const noNotifications = page.getByRole("heading", {
      name: "Nenhuma nova notificação",
    });

    if (await noNotifications.count()) {
      await expect(noNotifications).toBeVisible();
      return;
    }

    const markButton = page
      .getByRole("button", { name: "Marcar como lida" })
      .first();
    if ((await markButton.count()) > 0) {
      await markButton.click();
      await assertToastVisible(page, "Notificação marcada como lida");
    }
  });

  test("CRUD operacional: decisão de reagendamento (update de status)", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToReschedulingManagement(page);
    await filterPending(page);

    const decisionButtons = await getDecisionButtonsCount(page);
    test.skip(
      decisionButtons === 0,
      "Sem solicitações pendentes de reagendamento para validar decisão.",
    );

    await openFirstJustification(page);
    await expect(page.getByText("Justificativa Selecionada")).toBeVisible();

    const updateElapsed = await measureActionDurationMs(async () => {
      await deferFirstRequest(page);
      await assertToastVisible(page, "Registro atualizado");
    });

    await assertResponseTimeBelow(
      updateElapsed,
      15000,
      "Atualização de status de reagendamento",
    );
  });
});
