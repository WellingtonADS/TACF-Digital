import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { adminCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

const ADMIN_CRUD_SOURCE = "e2e-admin-sessions-crud";
type AdminSessionsSeed = {
  adminId: string;
  coordinatorId: string;
  locationId: string;
  createdSessionIds: string[];
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function toDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function addDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 60000,
  });
}

async function getNextAvailableDate(
  client: Client,
  minOffset: number,
  blockedDates: Set<string>,
) {
  for (let offset = minOffset; offset <= 30; offset += 1) {
    const candidate = addDays(new Date(), offset);
    // Evita fins de semana
    if (candidate.getDay() === 0 || candidate.getDay() === 6) continue;

    const key = toDateKey(candidate);
    if (blockedDates.has(key)) continue;

    const conflictRes = await client.query<{ total: number }>(
      `
      SELECT count(*)::int AS total
      FROM public.sessions
      WHERE date = $1::date
        AND period = 'manha'::session_period
      `,
      [key],
    );

    if ((conflictRes.rows[0]?.total ?? 0) > 0) {
      continue;
    }

    blockedDates.add(key);
    return key;
  }

  throw new Error(
    "Não foi possível encontrar uma data elegível para o CRUD de sessões.",
  );
}

async function cleanupAdminSessionsSeed(seed: AdminSessionsSeed | null) {
  if (!seed) return;

  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
    if (seed.createdSessionIds.length > 0) {
      await client.query(
        `
        DELETE FROM public.sessions
        WHERE id = ANY($1::uuid[])
        `,
        [seed.createdSessionIds],
      );
    }
  } finally {
    await client.end();
  }
}

async function prepareAdminSessionsSeed(): Promise<AdminSessionsSeed> {
  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
    // Busca admin user
    const adminRes = await client.query<{ id: string }>(
      `
      SELECT u.id::text AS id
      FROM auth.users u
      JOIN public.profiles p ON p.id = u.id
      WHERE u.email = $1 AND p.role = 'admin'
      LIMIT 1
      `,
      [adminCredentials.email],
    );

    const adminId = adminRes.rows[0]?.id;
    if (!adminId) {
      throw new Error("Admin user não encontrado em auth.users.");
    }

    // Busca coordinator (ou usa admin se não houver)
    const coordinatorRes = await client.query<{ id: string }>(
      `
      SELECT u.id::text AS id
      FROM auth.users u
      JOIN public.profiles p ON p.id = u.id
      WHERE p.role IN ('admin', 'coordinator')
      LIMIT 1
      `,
    );

    const coordinatorId = coordinatorRes.rows[0]?.id || adminId;

    // Busca location
    const locationRes = await client.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM public.locations
      WHERE status = 'active'
      LIMIT 1
      `,
    );

    const locationId = locationRes.rows[0]?.id;
    if (!locationId) {
      throw new Error("Nenhuma localização ativa encontrada.");
    }

    // Limpa sessões anteriores criadas por este teste
    await client.query(
      `
      DELETE FROM public.sessions
      WHERE metadata ->> 'source' = $1
      `,
      [ADMIN_CRUD_SOURCE],
    );

    return {
      adminId,
      coordinatorId,
      locationId,
      createdSessionIds: [],
    };
  } finally {
    await client.end();
  }
}

async function loginAsAdmin(loginPage: LoginPage) {
  await loginPage.goto();
  await loginPage.login(adminCredentials.email, adminCredentials.password);
  await expect(loginPage.page).toHaveURL(/\/app(\/admin)?/, { timeout: 15000 });
  await waitForPageReady(loginPage.page);
}

async function navigateToSessionsHub(page: Page) {
  await page.goto("/app/turmas");
  await waitForPageReady(page);
  await expect(page.getByTestId("sessions-management-page")).toBeVisible({
    timeout: 15000,
  });
}

function getSessionCode(sessionId: string) {
  return sessionId.slice(0, 12).toUpperCase();
}

async function findCreatedSession(
  sessionDate: string,
  seed: AdminSessionsSeed,
) {
  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
    const res = await client.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM public.sessions
      WHERE date = $1::date
        AND period = 'manha'::session_period
      ORDER BY created_at DESC
      LIMIT 1
      `,
      [sessionDate],
    );

    const sessionId = res.rows[0]?.id;
    if (!sessionId) {
      throw new Error("Sessão criada não encontrada no banco após o fluxo.");
    }

    if (!seed.createdSessionIds.includes(sessionId)) {
      seed.createdSessionIds.push(sessionId);
    }

    return {
      id: sessionId,
      code: getSessionCode(sessionId),
    };
  } finally {
    await client.end();
  }
}

async function filterSessionList(page: Page, sessionCode: string) {
  const searchInput = page.getByPlaceholder(
    /Buscar sessão, data, turno ou local/i,
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(sessionCode);
  await searchInput.blur();

  await expect(page.getByText(sessionCode).first()).toBeVisible({
    timeout: 10000,
  });
}

async function createSessionViaCRUD(
  page: Page,
  sessionDate: string,
  seed: AdminSessionsSeed,
) {
  // Clica em "Nova Sessão"
  const createButton = page
    .getByRole("button", { name: /nova sessão/i })
    .first();
  await expect(createButton).toBeVisible({ timeout: 10000 });
  await createButton.click();

  // Aguarda diálogo de criação
  const dialogHeading = page.getByRole("heading", {
    name: /configurar nova sessão/i,
  });
  await expect(dialogHeading).toBeVisible({ timeout: 10000 });
  await expect(page.locator("#session-form-dialog")).toBeVisible({
    timeout: 10000,
  });

  // Preenche data
  const dateInput = page.getByLabel(/^Data$/i);
  await expect(dateInput).toBeVisible({ timeout: 5000 });
  await dateInput.fill(sessionDate);
  await dateInput.blur();

  // Seleciona localização
  const locationSelect = page.getByLabel(/Local de aplicacao/i);
  await expect(locationSelect).toBeVisible({ timeout: 5000 });
  await locationSelect.selectOption(seed.locationId);

  // Seleciona coordenador
  const coordinatorSelect = page.getByLabel(/Coordenador aplicador/i);
  await expect(coordinatorSelect).toBeVisible({ timeout: 5000 });
  const coordinatorOptions = await coordinatorSelect.locator("option").count();
  if (coordinatorOptions > 1) {
    await coordinatorSelect.selectOption({ index: 1 });
  }

  // Clica em salvar
  const saveButton = page.getByRole("button", { name: /gerar sessões/i });
  await expect(saveButton).toBeVisible({ timeout: 5000 });

  // Screenshot antes de salvar
  await page.screenshot({
    path: "test-results/admin-crud-create-filled.png",
    fullPage: true,
  });

  await saveButton.click();

  // Aguarda sucesso (retorna ao hub)
  await expect(dialogHeading).toHaveCount(0, { timeout: 15000 });
  await waitForPageReady(page);

  const createdSession = await findCreatedSession(sessionDate, seed);
  await filterSessionList(page, createdSession.code);

  // Screenshot após criar
  await page.screenshot({
    path: "test-results/admin-crud-created-in-list.png",
    fullPage: true,
  });

  return createdSession;
}

async function editSessionViaCRUD(page: Page, sessionCode: string) {
  await filterSessionList(page, sessionCode);

  const editButton = page.getByRole("button", {
    name: /editar sessão|editar/i,
  });
  await expect(editButton.first()).toBeVisible({ timeout: 10000 });
  await editButton.first().click();

  // Aguarda diálogo de edição
  const dialogHeading = page.getByRole("heading", {
    name: /editar sessão/i,
  });
  await expect(dialogHeading).toBeVisible({ timeout: 10000 });

  // Altera capacidade máxima (como exemplo de edição)
  const maxCapacityInput = page.getByLabel(/Capacidade maxima da sessao/i);
  await expect(maxCapacityInput).toBeVisible({ timeout: 5000 });
  const currentValue = await maxCapacityInput.inputValue();
  const newValue = String(Math.max(9, parseInt(currentValue || "21", 10) - 1));
  await maxCapacityInput.fill(newValue);

  // Clica em salvar
  const saveButton = page.getByRole("button", {
    name: /salvar alteracoes/i,
  });
  await expect(saveButton).toBeVisible({ timeout: 5000 });

  // Screenshot antes de salvar edição
  await page.screenshot({
    path: "test-results/admin-crud-edit-modified.png",
    fullPage: true,
  });

  await saveButton.click();

  // Aguarda retorno ao hub
  await expect(dialogHeading).toHaveCount(0, { timeout: 15000 });
  await waitForPageReady(page);
  await filterSessionList(page, sessionCode);

  // Screenshot após editar
  await page.screenshot({
    path: "test-results/admin-crud-edited-in-list.png",
    fullPage: true,
  });
}

async function viewSessionDetails(page: Page, sessionCode: string) {
  await filterSessionList(page, sessionCode);

  const openButton = page.getByRole("button", {
    name: /gerir sessão|visualizar sessão/i,
  });
  await expect(openButton.first()).toBeVisible({ timeout: 10000 });
  await openButton.first().click();

  // Aguarda abertura do painel/diálogo de detalhes
  const detailsHeading = page.getByRole("heading", {
    name: /gestão da turma|consulta da turma/i,
  });

  await expect(detailsHeading).toBeVisible({ timeout: 10000 });

  // Screenshot de detalhes
  await page.screenshot({
    path: "test-results/admin-crud-view-details.png",
    fullPage: true,
  });

  await page.getByRole("button", { name: "Fechar", exact: true }).click();
  await expect(detailsHeading).toHaveCount(0, { timeout: 10000 });
}

async function deleteSessionViaCRUD(page: Page, sessionCode: string) {
  await filterSessionList(page, sessionCode);

  const deleteButton = page.getByRole("button", {
    name: /cancelar sessão|cancelar/i,
  });
  await expect(deleteButton.first()).toBeVisible({ timeout: 10000 });
  await deleteButton.first().click();

  // Aguarda confirmação
  const confirmButton = page
    .getByRole("button", { name: /confirmar cancelamento/i })
    .last();
  await expect(confirmButton).toBeVisible({ timeout: 10000 });

  // Screenshot antes de confirmar delete
  await page.screenshot({
    path: "test-results/admin-crud-delete-confirm.png",
    fullPage: true,
  });

  await confirmButton.click();
  await waitForPageReady(page);
  await filterSessionList(page, sessionCode);
  await expect(page.getByText(/FECHADA/i).first()).toBeVisible({
    timeout: 10000,
  });

  // Screenshot após delete
  await page.screenshot({
    path: "test-results/admin-crud-after-delete.png",
    fullPage: true,
  });
}

test.describe("CRUD visual: admin gerencia sessões no hub", () => {
  test.setTimeout(240000);

  let adminSeed: AdminSessionsSeed | null = null;

  test.beforeAll(async () => {
    adminSeed = await prepareAdminSessionsSeed();
  });

  test.afterAll(async () => {
    await cleanupAdminSessionsSeed(adminSeed);
  });

  test("admin visualiza página de sessões e estrutura do hub", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);
    await navigateToSessionsHub(page);

    await expect(page.getByTestId("sessions-management-page")).toBeVisible({
      timeout: 15000,
    });
    await expect(
      page.getByRole("button", { name: /nova sessão/i }).first(),
    ).toBeVisible({ timeout: 10000 });

    // Screenshot do hub
    await page.screenshot({
      path: "test-results/admin-crud-hub-overview.png",
      fullPage: true,
    });
  });

  test("CRUD completo: create → read → update → delete em desktop (1440x900)", async ({
    page,
  }, testInfo) => {
    if (!adminSeed) {
      throw new Error("Seed admin não inicializado.");
    }

    const blockedDates = new Set<string>();
    const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
    let testSessionDate: string;
    await client.connect();
    try {
      const minOffset = /mobile/i.test(testInfo.project.name) ? 7 : 2;
      testSessionDate = await getNextAvailableDate(
        client,
        minOffset,
        blockedDates,
      );
    } finally {
      await client.end();
    }

    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);
    await navigateToSessionsHub(page);

    // CREATE
    const createdSession = await createSessionViaCRUD(
      page,
      testSessionDate,
      adminSeed,
    );

    // READ
    await viewSessionDetails(page, createdSession.code);

    // UPDATE
    await editSessionViaCRUD(page, createdSession.code);

    // DELETE
    await deleteSessionViaCRUD(page, createdSession.code);

    // Screenshot final do workflow
    await page.screenshot({
      path: "test-results/admin-crud-complete-workflow.png",
      fullPage: true,
    });
  });
});
