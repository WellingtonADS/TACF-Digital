import { expect, test, type Locator, type Page } from "@playwright/test";
import { Client } from "pg";
import { adminCredentials, userCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

type HubScenario = {
  locationId: string;
  locationName: string;
  openSessionId: string;
  closedSessionId: string;
  completedSessionId: string;
  bookingId: string;
  bookedUserName: string;
  runId: string;
};

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente para E2E: ${name}`);
  }
  return value;
}

function toDateString(date: Date): string {
  return date.toISOString().slice(0, 10);
}

async function findAvailableSessionSlot(
  client: Client,
  usedSlots: Set<string>,
  startOffsetDays = 5,
): Promise<{ date: string; period: "manha" | "tarde" }> {
  for (let offset = startOffsetDays; offset < startOffsetDays + 45; offset += 1) {
    const candidateDate = new Date();
    candidateDate.setDate(candidateDate.getDate() + offset);
    const date = toDateString(candidateDate);

    for (const period of ["manha", "tarde"] as const) {
      const key = `${date}|${period}`;

      if (usedSlots.has(key)) {
        continue;
      }

      const existingRes = await client.query<{ exists: boolean }>(
        `
          select exists(
            select 1
            from public.sessions
            where date = $1::date
              and period = $2::session_period
          ) as exists
        `,
        [date, period],
      );

      if (!existingRes.rows[0]?.exists) {
        usedSlots.add(key);
        return { date, period };
      }
    }
  }

  throw new Error("Nao foi encontrado slot livre para o cenario E2E do Hub.");
}

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 15000,
  });
}

async function loginAsAdmin(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(adminCredentials.email, adminCredentials.password);
  await expect(page).toHaveURL(/\/app(\/admin)?/, { timeout: 15000 });
  await waitForPageReady(page);
}

async function createHubScenario(client: Client): Promise<HubScenario> {
  const runId = `e2e-hub-settings-${Date.now()}`;
  const usedSlots = new Set<string>();
  const openSlot = await findAvailableSessionSlot(client, usedSlots, 5);
  const closedSlot = await findAvailableSessionSlot(client, usedSlots, 6);
  const completedSlot = await findAvailableSessionSlot(client, usedSlots, 7);
  const locationName = `Local E2E Hub ${runId}`;

  const locationRes = await client.query<{ id: string }>(
    `
      insert into public.locations (
        name,
        address,
        max_capacity,
        status,
        facilities,
        metadata
      )
      values (
        $1,
        $2,
        21,
        'active',
        array['pista']::text[],
        jsonb_build_object('source', 'e2e-hub-settings', 'run_id', $3::text)
      )
      returning id::text as id
    `,
    [locationName, `Endereco ${runId}`, runId],
  );

  const locationId = locationRes.rows[0]?.id;

  if (!locationId) {
    throw new Error("Falha ao criar local do cenario E2E.");
  }

  const createSession = async (
    status: "open" | "closed" | "completed",
    date: string,
    period: "manha" | "tarde",
    title: string,
  ) => {
    const sessionRes = await client.query<{ id: string }>(
      `
        insert into public.sessions (
          title,
          summary,
          date,
          period,
          capacity,
          max_capacity,
          status,
          location_id,
          applicators,
          metadata
        )
        values (
          $1,
          $2,
          $3::date,
          $4::session_period,
          8,
          21,
          $5::session_status,
          $6::uuid,
          array[]::text[],
          jsonb_build_object('source', 'e2e-hub-settings', 'run_id', $7::text)
        )
        returning id::text as id
      `,
      [
        title,
        `${title} - cenario E2E de validacao do Hub.`,
        date,
        period,
        status,
        locationId,
        runId,
      ],
    );

    const sessionId = sessionRes.rows[0]?.id;

    if (!sessionId) {
      throw new Error(`Falha ao criar sessao ${status} do cenario E2E.`);
    }

    return sessionId;
  };

  const openSessionId = await createSession(
    "open",
    openSlot.date,
    openSlot.period,
    `Sessao Aberta ${runId}`,
  );
  const closedSessionId = await createSession(
    "closed",
    closedSlot.date,
    closedSlot.period,
    `Sessao Fechada ${runId}`,
  );
  const completedSessionId = await createSession(
    "completed",
    completedSlot.date,
    completedSlot.period,
    `Sessao Concluida ${runId}`,
  );

  const userRes = await client.query<{
    id: string;
    full_name: string | null;
    war_name: string | null;
  }>(
    `
      select id::text as id, full_name, war_name
      from public.profiles
      where email = $1
      limit 1
    `,
    [userCredentials.email],
  );

  const userId = userRes.rows[0]?.id;
  if (!userId) {
    throw new Error("Usuario seed de E2E nao encontrado para o cenario do Hub.");
  }

  const bookingRes = await client.query<{ id: string }>(
    `
      insert into public.bookings (
        user_id,
        session_id,
        status,
        semester,
        metadata,
        result_details,
        test_date,
        attendance_confirmed
      )
      values (
        $1::uuid,
        $2::uuid,
        'agendado'::booking_status,
        '1'::semester_type,
        jsonb_build_object('source', 'e2e-hub-settings', 'run_id', $3::text),
        null,
        $4::date,
        false
      )
      returning id::text as id
    `,
    [userId, openSessionId, runId, openSlot.date],
  );

  const bookingId = bookingRes.rows[0]?.id;
  if (!bookingId) {
    throw new Error("Falha ao criar booking de teste para o Hub.");
  }

  return {
    locationId,
    locationName,
    openSessionId,
    closedSessionId,
    completedSessionId,
    bookingId,
    bookedUserName:
      userRes.rows[0]?.war_name ?? userRes.rows[0]?.full_name ?? userCredentials.email,
    runId,
  };
}

async function cleanupHubScenario(client: Client, scenario: HubScenario | null) {
  if (!scenario) {
    return;
  }

  await client.query(
    `
      delete from public.bookings
      where id = $1::uuid
    `,
    [scenario.bookingId],
  );

  await client.query(
    `
      delete from public.sessions
      where id = any($1::uuid[])
    `,
    [[
      scenario.openSessionId,
      scenario.closedSessionId,
      scenario.completedSessionId,
    ]],
  );

  await client.query(
    `
      delete from public.locations
      where id = $1::uuid
    `,
    [scenario.locationId],
  );
}

async function searchHubByLocation(page: Page, locationName: string) {
  const searchInput = page.getByPlaceholder("Buscar por ID, data, turno ou local...");
  await searchInput.fill(locationName);
}

function managementModal(page: Page, title: RegExp): Locator {
  return page.locator("section").filter({
    has: page.getByRole("heading", { name: title }),
  }).first();
}

test.describe.serial("Hub de Sessões e Configurações - fluxos revisados", () => {
  let client: Client;
  let scenario: HubScenario | null = null;

  test.beforeAll(async () => {
    client = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await client.connect();
    scenario = await createHubScenario(client);
  });

  test.afterAll(async () => {
    await cleanupHubScenario(client, scenario);
    await client.end();
  });

  test("configurações exibem abas persistidas e copy de padrão global", async ({
    page,
  }) => {
    await loginAsAdmin(page);

    await page.goto("/app/configuracoes");
    await waitForPageReady(page);

    await page.getByRole("button", { name: /^Locais$/i }).click();
    await expect(
      page.getByText(
        /Cadastre os padrões globais dos locais de aplicação\. Alterações feitas no Hub afetam apenas a sessão selecionada\./i,
      ),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: /Novo Local/i })).toBeVisible();
    await expect(
      page.getByText(/Padrão global reutilizado ao criar ou editar sessões\./i).first(),
    ).toBeVisible();

    await page.getByRole("button", { name: /^Tabelas$/i }).click();
    await expect(
      page.getByText(
        /Tabelas persistidas de índices usadas como referência administrativa global\./i,
      ),
    ).toBeVisible();
  });

  test("sessão aberta mantém modo operacional e edição restrita à sessão", async ({
    page,
  }) => {
    test.skip(!scenario, "Cenário E2E não inicializado.");

    await loginAsAdmin(page);
    await page.goto("/app/turmas");
    await waitForPageReady(page);

    await searchHubByLocation(page, scenario!.locationName);
    await page.getByRole("button", { name: /^Abertas$/i }).click();
    await page.getByRole("button", { name: "Abrir sessão" }).first().click();

    const modal = managementModal(page, /Operação da Sessão/i);
    await expect(modal).toBeVisible();
    await expect(modal.getByRole("button", { name: "Finalizar Sessão" })).toBeEnabled();
    await expect(page.getByText(/Salvar como Rascunho/i)).toHaveCount(0);

    await modal.getByRole("button", { name: "Editar Sessão" }).click();

    const editModal = managementModal(page, /Editar Dados da Sessão/i);
    await expect(editModal).toBeVisible();
    await expect(editModal.getByText(/^Coordenador Aplicador$/i)).toBeVisible();
    await expect(
      editModal.getByText(
        /Esta alteração vale apenas para a sessão atual\. O padrão global do local é mantido em Configurações\./i,
      ),
    ).toBeVisible();
    await expect(
      editModal.getByText(
        /As capacidades abaixo ajustam apenas esta sessão e não alteram o padrão global cadastrado para o local\./i,
      ),
    ).toBeVisible();
  });

  test("sessões fechadas e concluídas abrem em consulta e preservam ações por estado", async ({
    page,
  }) => {
    test.skip(!scenario, "Cenário E2E não inicializado.");

    await loginAsAdmin(page);
    await page.goto("/app/turmas");
    await waitForPageReady(page);

    await searchHubByLocation(page, scenario!.locationName);
    await page.getByRole("button", { name: /^Canceladas$/i }).click();
    await expect(page.getByRole("button", { name: "Reabrir sessão" }).first()).toBeVisible();
    await page.getByRole("button", { name: "Abrir sessão" }).first().click();

    const closedModal = managementModal(page, /Consulta da Sessão/i);
    await expect(closedModal).toBeVisible();
    await expect(closedModal.getByRole("button", { name: "Editar Sessão" })).toBeDisabled();
    await expect(closedModal.getByRole("button", { name: "Finalizar Sessão" })).toBeDisabled();

    await page.goto("/app/turmas");
    await waitForPageReady(page);
    await searchHubByLocation(page, scenario!.locationName);
    await page.getByRole("button", { name: /Conclu/i }).click();
    await expect(
      page.getByRole("button", { name: "Imprimir lista de presença" }).first(),
    ).toBeVisible();
    await page.getByRole("button", { name: "Abrir sessão" }).first().click();

    const completedModal = managementModal(page, /Consulta da Sessão/i);
    await expect(completedModal).toBeVisible();
    await expect(completedModal.getByRole("button", { name: "Editar Sessão" })).toBeDisabled();
    await expect(completedModal.getByRole("button", { name: "Finalizar Sessão" })).toBeDisabled();
  });

  test("lançamento de performance persiste índices e recarrega valores salvos", async ({
    page,
  }) => {
    test.skip(!scenario, "Cenário E2E não inicializado.");

    await loginAsAdmin(page);
    await page.goto("/app/turmas");
    await waitForPageReady(page);

    await searchHubByLocation(page, scenario!.locationName);
    await page.getByRole("button", { name: /^Abertas$/i }).click();
    await page.getByRole("button", { name: "Abrir sessão" }).first().click();

    const management = managementModal(page, /Operação da Sessão/i);
    await expect(management).toBeVisible();
    await expect(management.getByText(scenario!.bookedUserName).first()).toBeVisible();
    await management.getByRole("button", { name: /Lançar Resultado/i }).click();

    const performanceModal = managementModal(page, /Lançamento de Índices e Resultado/i);
    await expect(performanceModal).toBeVisible();

    const inputs = performanceModal.locator('input[type="number"]');
    await inputs.nth(0).fill("22");
    await inputs.nth(1).fill("41");
    await inputs.nth(2).fill("2800");
    await performanceModal.getByRole("button", { name: /INAPTO/i }).click();
    await performanceModal.getByRole("button", { name: /Salvar e Próximo/i }).click();
    await expect(performanceModal).toHaveCount(0, { timeout: 15000 });

    await management.getByTitle("Editar resultado").click();
    const reopenedModal = managementModal(page, /Lançamento de Índices e Resultado/i);
    await expect(reopenedModal).toBeVisible();
    const reopenedInputs = reopenedModal.locator('input[type="number"]');
    await expect(reopenedInputs.nth(0)).toHaveValue("22");
    await expect(reopenedInputs.nth(1)).toHaveValue("41");
    await expect(reopenedInputs.nth(2)).toHaveValue("2800");
    await expect(reopenedModal.getByRole("button", { name: /INAPTO/i })).toHaveClass(/bg-error/);
  });
});
