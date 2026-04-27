import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { adminCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

const HUB_VISUAL_SOURCE = "e2e-admin-sessions-hub-visual";
const SEEDED_SESSION_ID = "00000000-0000-4000-8000-00000000a901";

type SeededHubSession = {
  sessionId: string;
  sessionCode: string;
  sessionDate: string;
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Variavel obrigatoria ausente: ${name}`);
  }
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

async function loginAsAdmin(page: Page) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(adminCredentials.email, adminCredentials.password);
  await expect(page).toHaveURL(/\/app(\/admin)?/, { timeout: 15000 });
  await waitForPageReady(page);
}

async function navigateToSessionsHub(page: Page) {
  await page.goto("/app/turmas");
  await waitForPageReady(page);
  await expect(page.getByTestId("sessions-management-page")).toBeVisible({
    timeout: 15000,
  });
}

async function getNextAvailableDate(client: Client, minOffset: number) {
  for (let offset = minOffset; offset <= 45; offset += 1) {
    const candidate = addDays(new Date(), offset);
    if (candidate.getDay() === 0 || candidate.getDay() === 6) continue;

    const key = toDateKey(candidate);

    const conflictRes = await client.query<{ total: number }>(
      `
      SELECT count(*)::int AS total
      FROM public.sessions
      WHERE date = $1::date
        AND period = 'manha'::session_period
        AND id <> $2::uuid
      `,
      [key, SEEDED_SESSION_ID],
    );

    if ((conflictRes.rows[0]?.total ?? 0) === 0) {
      return key;
    }
  }

  throw new Error("Nao foi possivel encontrar data elegivel para seed visual.");
}

async function cleanupSeededHubSession() {
  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
    await client.query(
      `
      DELETE FROM public.sessions
      WHERE id = $1::uuid
        OR metadata ->> 'source' = $2
      `,
      [SEEDED_SESSION_ID, HUB_VISUAL_SOURCE],
    );
  } finally {
    await client.end();
  }
}

async function prepareSeededHubSession(): Promise<SeededHubSession> {
  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
    await cleanupSeededHubSession();

    const adminRes = await client.query<{ id: string }>(
      `
      SELECT u.id::text AS id
      FROM auth.users u
      JOIN public.profiles p ON p.id = u.id
      WHERE u.email = $1
        AND p.role = 'admin'
      LIMIT 1
      `,
      [adminCredentials.email],
    );

    const adminId = adminRes.rows[0]?.id;
    if (!adminId) {
      throw new Error("Admin de teste nao encontrado em auth.users.");
    }

    const sessionDate = await getNextAvailableDate(client, 10);

    await client.query(
      `
      INSERT INTO public.sessions (
        id,
        date,
        period,
        max_capacity,
        status,
        coordinator_id,
        applicators,
        metadata
      )
      VALUES (
        $1::uuid,
        $2::date,
        'manha'::session_period,
        21,
        'open'::session_status,
        $3::uuid,
        ARRAY[$3::text],
        jsonb_build_object('source', $4::text)
      )
      `,
      [SEEDED_SESSION_ID, sessionDate, adminId, HUB_VISUAL_SOURCE],
    );

    return {
      sessionId: SEEDED_SESSION_ID,
      sessionCode: SEEDED_SESSION_ID.slice(0, 12).toUpperCase(),
      sessionDate,
    };
  } finally {
    await client.end();
  }
}

async function openSeededSessionDialog(page: Page, sessionCode: string) {
  const searchInput = page.getByPlaceholder(
    /Buscar sessao, data, turno ou local|Buscar sessão, data, turno ou local/i,
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(sessionCode);
  await searchInput.blur();

  const manageButton = page
    .getByRole("button", { name: /Gerir sessao|Gerir sessão/i })
    .first();
  await expect(manageButton).toBeVisible({ timeout: 10000 });
  await manageButton.click();

  await expect(
    page.getByRole("heading", { name: /Gestao da Turma|Gestão da Turma/i }),
  ).toBeVisible({
    timeout: 10000,
  });
}

test.describe("Visual E2E: Hub de Sessoes com modais", () => {
  test.setTimeout(180000);

  let seeded: SeededHubSession | null = null;

  test.beforeAll(async () => {
    seeded = await prepareSeededHubSession();
  });

  test.afterAll(async () => {
    await cleanupSeededHubSession();
  });

  test.beforeEach(async ({ page }) => {
    await loginAsAdmin(page);
    await navigateToSessionsHub(page);
  });

  test("hero e seletor de abas permanecem estaveis", async ({ page }) => {
    const heroSection = page
      .getByTestId("sessions-management-title")
      .locator("xpath=ancestor::section[1]");
    const tabsSection = page
      .getByRole("button", { name: "Sessões" })
      .locator("xpath=ancestor::section[1]");

    await expect(heroSection).toHaveScreenshot("sessions-hub-hero.png", {
      animations: "disabled",
      caret: "hide",
    });

    await expect(tabsSection).toHaveScreenshot("sessions-hub-tabs.png", {
      animations: "disabled",
      caret: "hide",
    });
  });

  test("modal de filtros mantem layout base", async ({ page }) => {
    const filtersButton = page.getByRole("button", {
      name: /Filtros avancados|Filtros avançados/i,
    });
    await expect(filtersButton).toBeVisible({ timeout: 10000 });
    await filtersButton.click();

    const dialogHeading = page.getByRole("heading", {
      name: /Filtros de exibicao|Filtros de exibição/i,
    });
    await expect(dialogHeading).toBeVisible({ timeout: 10000 });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveScreenshot("sessions-hub-filters-dialog.png", {
      animations: "disabled",
      caret: "hide",
    });
  });

  test("modal de criacao de sessao permanece consistente", async ({ page }) => {
    const createButton = page
      .getByRole("button", { name: /Nova sessao|Nova sessão/i })
      .first();
    await expect(createButton).toBeVisible({ timeout: 10000 });
    await createButton.click();

    const dialogHeading = page.getByRole("heading", {
      name: /Configurar Nova Sessao|Configurar Nova Sessão/i,
    });
    await expect(dialogHeading).toBeVisible({ timeout: 10000 });

    const dialog = page.getByRole("dialog");
    await expect(dialog).toHaveScreenshot("sessions-hub-create-dialog.png", {
      animations: "disabled",
      caret: "hide",
    });
  });

  test("modal de gestao da turma preserva estrutura operacional", async ({
    page,
  }) => {
    if (!seeded) {
      throw new Error("Seed visual nao inicializado.");
    }

    await openSeededSessionDialog(page, seeded.sessionCode);

    const dialog = page.getByRole("dialog");
    const table = dialog.locator("table").first();
    const finalizeButton = dialog.getByRole("button", {
      name: /Finalizar Sessao|Finalizar Sessão/i,
    });

    await expect(table).toHaveScreenshot(
      "sessions-hub-manage-dialog-table.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );

    await expect(finalizeButton).toHaveScreenshot(
      "sessions-hub-manage-finalize-button.png",
      {
        animations: "disabled",
        caret: "hide",
      },
    );
  });
});
