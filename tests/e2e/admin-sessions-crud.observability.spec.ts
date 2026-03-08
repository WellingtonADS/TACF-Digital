import { expect, test } from "@playwright/test";
import { loginAsAdmin } from "./support/auth";
import {
  assertResponseTimeBelow,
  assertToastVisible,
  forceSlowSessionsRpc,
  measureActionDurationMs,
} from "./support/observability";
import {
  cancelSessionLogically,
  fillSessionCapacity,
  fillSessionStartTime,
  fillSingleSessionDate,
  goToClassCreationForm,
  goToSessionsManagement,
  openFirstSessionEditor,
  publishSession,
  saveSessionChanges,
} from "./support/sessionCrudHelpers";

function getNextWeekday(offsetDays = 15): string {
  const date = new Date();
  date.setDate(date.getDate() + offsetDays);

  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() + 1);
  }

  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getNextSaturday(): string {
  const date = new Date();
  while (date.getDay() !== 6) {
    date.setDate(date.getDate() + 1);
  }
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

test.describe("Admin Turmas CRUD + observabilidade", () => {
  test.describe.configure({ mode: "serial" });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
  });

  test("loading da lista de turmas e tempo de resposta", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await forceSlowSessionsRpc(page, 1400);

    const elapsed = await measureActionDurationMs(async () => {
      await page.goto("/app/turmas");
      await expect(page.getByText("Carregando turmas...")).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Gerenciar Turmas" }),
      ).toBeVisible();
    });

    await assertResponseTimeBelow(
      elapsed,
      15000,
      "Carregamento de /app/turmas",
    );
    await page.unroute("**/rest/v1/rpc/get_sessions_availability");
  });

  test("alertas e avisos no formulario de turma", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    await goToClassCreationForm(page);
    await fillSingleSessionDate(page, getNextSaturday());
    await assertToastVisible(page, "Sábados e domingos não estão disponíveis.");

    await expect(
      page.getByText("Sábados e domingos são bloqueados automaticamente."),
    ).toBeVisible();
  });

  test("CRUD de turmas: create + update + cancelamento logico", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Cobertura investigativa configurada para desktop-1440.",
    );

    // C - Create
    await goToClassCreationForm(page);
    await fillSingleSessionDate(page, getNextWeekday(25));
    await fillSessionStartTime(page, "08:00");
    await fillSessionCapacity(page, 9);

    const createElapsed = await measureActionDurationMs(async () => {
      await publishSession(page);
      await assertToastVisible(
        page,
        /Turma publicada com sucesso|turmas publicadas com sucesso/i,
      );
    });
    await assertResponseTimeBelow(createElapsed, 15000, "Create de turma");

    // R/U - Read + Update
    await goToSessionsManagement(page);
    await openFirstSessionEditor(page);
    await fillSessionCapacity(page, 10);

    const updateElapsed = await measureActionDurationMs(async () => {
      await saveSessionChanges(page);
      await assertToastVisible(page, "Turma atualizada com sucesso.");
    });
    await assertResponseTimeBelow(updateElapsed, 15000, "Update de turma");

    // D - Delete logico
    await openFirstSessionEditor(page);
    await cancelSessionLogically(page);
    await assertToastVisible(page, "Turma cancelada (fechada).");
  });
});
