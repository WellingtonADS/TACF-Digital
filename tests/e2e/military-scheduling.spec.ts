import { expect, test } from "@playwright/test";
import { AuthPage } from "./page-objects/AuthPage";
import { getCredentials, hasCredentials } from "./support/credentials";
import {
  createEphemeralOpenSession,
  deleteBookingById,
  deleteBookingsByUserId,
  deleteSessionById,
  findBookingByOrderNumber,
  getUserIdByEmail,
  hasDbConnection,
  listAvailableSessionsForUser,
  mapSchedulingTables,
} from "./support/db";

const CREATE_SESSION_IF_EMPTY =
  process.env.E2E_SCHEDULING_CREATE_SESSION_IF_EMPTY === "true";
const RESET_USER_BOOKINGS =
  process.env.E2E_SCHEDULING_RESET_USER_BOOKINGS === "true";

function formatTicketDate(date: string): string {
  return new Date(date)
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "")
    .toUpperCase();
}

function parseIsoDateLocal(dateIso: string): Date {
  const [year, month, day] = dateIso.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function formatCalendarLabel(dateIso: string): string {
  return parseIsoDateLocal(dateIso)
    .toLocaleString("pt-BR", {
      month: "long",
      year: "numeric",
    })
    .toLowerCase();
}

function formatTargetDay(dateIso: string): string {
  return String(parseIsoDateLocal(dateIso).getDate());
}

test.describe("Military scheduling real flow", () => {
  test.skip(
    !hasCredentials("user"),
    "Credenciais E2E de user ausentes: defina E2E_USER_EMAIL e E2E_USER_PASSWORD.",
  );

  test.skip(
    !hasDbConnection(),
    "Conexão de banco ausente: defina DATABASE_URL, SUPABASE_DB_URL ou variáveis PG*.",
  );

  let createdBookingId: string | null = null;
  let createdSessionId: string | null = null;

  test.afterEach(async () => {
    if (!createdBookingId) return;

    const removed = await deleteBookingById(createdBookingId);
    expect(
      removed,
      `Teardown não removeu o agendamento criado (${createdBookingId}).`,
    ).toBeGreaterThan(0);

    createdBookingId = null;

    if (createdSessionId) {
      const removedSession = await deleteSessionById(createdSessionId);
      expect(
        removedSession,
        `Teardown não removeu a sessão temporária criada (${createdSessionId}).`,
      ).toBeGreaterThan(0);
      createdSessionId = null;
    }
  });

  test("deve agendar horário real, validar ticket com banco e limpar booking", async ({
    page,
  }) => {
    const credentials = getCredentials("user");
    const authPage = new AuthPage(page);

    const tableMap = await mapSchedulingTables();
    expect(tableMap.bookingsExists).toBeTruthy();
    expect(tableMap.sessionsExists).toBeTruthy();
    expect(tableMap.locationsExists).toBeTruthy();
    expect(tableMap.schedulesExists).toBeTruthy();

    const userId = await getUserIdByEmail(credentials.email);
    expect(userId, "Usuário E2E não encontrado em auth.users.").toBeTruthy();

    if (RESET_USER_BOOKINGS) {
      const removed = await deleteBookingsByUserId(userId!);
      test.info().annotations.push({
        type: "db-reset",
        description: `bookings removidos do usuário de teste=${removed}`,
      });
    }

    let availableSessions = await listAvailableSessionsForUser(userId!);

    if (availableSessions.length === 0 && CREATE_SESSION_IF_EMPTY) {
      const ephemeral = await createEphemeralOpenSession();
      createdSessionId = ephemeral.sessionId;
      availableSessions = await listAvailableSessionsForUser(userId!);
    }

    test.skip(
      availableSessions.length === 0,
      "Sem horários disponíveis para o usuário de teste. Use E2E_SCHEDULING_CREATE_SESSION_IF_EMPTY=true e, se necessário, E2E_SCHEDULING_RESET_USER_BOOKINGS=true.",
    );

    const targetSession = createdSessionId
      ? (availableSessions.find(
          (item) => item.session_id === createdSessionId,
        ) ?? availableSessions[0])
      : availableSessions[0];

    const availableSessionIds = new Set(
      availableSessions.map((s) => s.session_id),
    );

    await authPage.login(credentials.email, credentials.password);
    await expect(page).toHaveURL(/\/app(\/)?$/);

    const availabilityStart = Date.now();
    const availabilityResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/rest/v1/rpc/get_sessions_availability") &&
        response.request().method() === "POST",
    );

    await page.goto("/app/agendamentos");
    await expect(
      page.getByRole("heading", { name: "Novo Agendamento" }),
    ).toBeVisible();

    const availabilityResponse = await availabilityResponsePromise;
    const availabilityLatencyMs = Date.now() - availabilityStart;
    expect(availabilityResponse.ok()).toBeTruthy();
    expect(availabilityLatencyMs).toBeGreaterThan(0);

    const monthLabel = formatCalendarLabel(targetSession.date);
    const targetDay = formatTargetDay(targetSession.date);
    const calendarCard = page
      .locator("div")
      .filter({
        has: page.getByRole("heading", { name: "Calendário de Testes" }),
      })
      .first();

    for (let steps = 0; steps < 12; steps += 1) {
      const currentLabel = (
        (await calendarCard
          .locator("p")
          .filter({ hasText: /\d{4}/ })
          .first()
          .textContent()) ?? ""
      )
        .trim()
        .toLowerCase();

      if (currentLabel === monthLabel) break;

      await calendarCard
        .locator("button")
        .filter({ has: page.locator("svg") })
        .nth(1)
        .click();
    }

    await calendarCard
      .locator("button")
      .filter({ hasText: new RegExp(`^${targetDay}$`) })
      .first()
      .click();

    const availableSlotButton = page
      .locator("button")
      .filter({
        hasText: new RegExp(
          `${targetSession.period}[\\s\\S]*Vagas:\\s*\\d+\\/`,
          "i",
        ),
      })
      .first();

    await expect(
      availableSlotButton,
      "Não foi possível encontrar botão de horário disponível na UI.",
    ).toBeVisible();
    await availableSlotButton.click();

    await page
      .getByRole("button", { name: /CONTINUAR PARA CONFIRMAÇÃO/i })
      .click();

    await expect(page).toHaveURL(/\/app\/agendamentos\/confirmacao/);
    await expect(
      page.getByRole("heading", { name: "Revisar Agendamento" }),
    ).toBeVisible();

    const confirmationStart = Date.now();
    const confirmationResponsePromise = page.waitForResponse(
      (response) =>
        response.url().includes("/rest/v1/rpc/confirmar_agendamento") &&
        response.request().method() === "POST",
    );

    await page.getByRole("button", { name: /Confirmar Agendamento/i }).click();

    const confirmationResponse = await confirmationResponsePromise;
    const confirmationLatencyMs = Date.now() - confirmationStart;
    const confirmationJson = await confirmationResponse.json();
    const confirmationResult = Array.isArray(confirmationJson)
      ? confirmationJson[0]
      : confirmationJson;

    expect(confirmationResponse.ok()).toBeTruthy();
    expect(confirmationLatencyMs).toBeGreaterThan(0);
    expect(confirmationResult?.success).toBeTruthy();
    expect(confirmationResult?.booking_id).toBeTruthy();

    await expect(page).toHaveURL(/\/app\/ticket/);
    await expect(
      page.getByRole("heading", { name: /COMPROVANTE DE AGENDAMENTO/i }),
    ).toBeVisible();
    await expect(page.getByText("Confirmado", { exact: true })).toBeVisible();

    const orderCodeRaw =
      (await page
        .locator('span:has-text("Código de Validação") + p')
        .first()
        .textContent()) ?? "";
    const orderCode = orderCodeRaw.replace(/\s+/g, "").trim();

    expect(
      orderCode,
      "Código de validação do ticket não encontrado.",
    ).toBeTruthy();

    const persisted = await findBookingByOrderNumber(orderCode);
    expect(
      persisted,
      "Agendamento não encontrado no banco após confirmação.",
    ).toBeTruthy();

    createdBookingId = persisted!.bookingId;

    expect(persisted!.orderNumber).toBe(orderCode);
    expect(persisted!.status).toBe("confirmed");
    expect(availableSessionIds.has(persisted!.sessionId)).toBeTruthy();

    await expect(page.getByText(persisted!.militaryName)).toBeVisible();
    await expect(page.getByText(persisted!.saram)).toBeVisible();

    if (persisted!.locationName) {
      await expect(page.getByText(persisted!.locationName)).toBeVisible();
    }

    await expect(page.getByText(persisted!.sessionPeriod)).toBeVisible();
    await expect(
      page.getByText(formatTicketDate(persisted!.sessionDate)),
    ).toBeVisible();

    test.info().annotations.push(
      {
        type: "db-latency",
        description: `get_sessions_availability=${availabilityLatencyMs}ms`,
      },
      {
        type: "db-latency",
        description: `confirmar_agendamento=${confirmationLatencyMs}ms`,
      },
    );
  });
});
