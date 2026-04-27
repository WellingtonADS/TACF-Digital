import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import {
  adminCredentials,
  coordinatorCredentials,
  databaseUrl,
} from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

const SESSION_PERMISSIONS_SOURCE = "e2e-session-permissions-visual";

type SessionPermissionsSeed = {
  sessionId: string;
  sessionCode: string;
  coordinatorId: string;
  originalCoordinatorRole: string | null;
  originalCoordinatorActive: boolean | null;
  originalCoordinatorMetadata: unknown;
};

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

function getSessionCode(sessionId: string) {
  return sessionId.slice(0, 12).toUpperCase();
}

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 60000,
  });
}

async function login(page: Page, email: string, password: string) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
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

async function getNextAvailableDate(client: Client) {
  for (let offset = 2; offset <= 45; offset += 1) {
    const candidate = addDays(new Date(), offset);
    if (candidate.getDay() === 0 || candidate.getDay() === 6) continue;

    const key = toDateKey(candidate);
    const conflictRes = await client.query<{ total: number }>(
      `
      SELECT count(*)::int AS total
      FROM public.sessions
      WHERE date = $1::date
        AND period = 'manha'::session_period
      `,
      [key],
    );

    if ((conflictRes.rows[0]?.total ?? 0) === 0) {
      return key;
    }
  }

  throw new Error(
    "Não foi possível encontrar uma data elegível para o teste visual de permissões.",
  );
}

async function prepareSessionPermissionsSeed(): Promise<SessionPermissionsSeed> {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    const coordinatorRes = await client.query<{
      id: string;
      role: string | null;
      active: boolean | null;
      metadata: unknown;
    }>(
      `
      SELECT
        p.id::text AS id,
        p.role::text AS role,
        p.active,
        p.metadata
      FROM auth.users u
      JOIN public.profiles p ON p.id = u.id
      WHERE u.email = $1
      LIMIT 1
      `,
      [coordinatorCredentials.email],
    );

    const coordinator = coordinatorRes.rows[0];
    if (!coordinator?.id) {
      throw new Error("Coordenador de teste não encontrado.");
    }

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
      throw new Error("Nenhum local ativo encontrado para o seed.");
    }

    await client.query(
      `
      DELETE FROM public.sessions
      WHERE metadata ->> 'source' = $1
      `,
      [SESSION_PERMISSIONS_SOURCE],
    );

    await client.query(
      `
      UPDATE public.profiles
      SET
        role = 'coordinator'::user_role,
        active = true,
        metadata = jsonb_set(
          coalesce(metadata, '{}'::jsonb),
          '{access_modules}',
          '["/app/turmas"]'::jsonb,
          true
        )
      WHERE id = $1::uuid
      `,
      [coordinator.id],
    );

    const sessionDate = await getNextAvailableDate(client);
    const sessionInsertRes = await client.query<{ id: string }>(
      `
      INSERT INTO public.sessions (
        date,
        period,
        capacity,
        max_capacity,
        status,
        location_id,
        coordinator_id,
        applicators,
        metadata
      )
      VALUES (
        $1::date,
        'manha'::session_period,
        8,
        21,
        'open'::session_status,
        $2::uuid,
        $3::uuid,
        ARRAY[$3::text],
        jsonb_build_object('source', $4::text)
      )
      RETURNING id::text AS id
      `,
      [
        sessionDate,
        locationId,
        coordinator.id,
        SESSION_PERMISSIONS_SOURCE,
      ],
    );

    const sessionId = sessionInsertRes.rows[0]?.id;
    if (!sessionId) {
      throw new Error("Falha ao criar sessão de seed para o teste visual.");
    }

    return {
      sessionId,
      sessionCode: getSessionCode(sessionId),
      coordinatorId: coordinator.id,
      originalCoordinatorRole: coordinator.role,
      originalCoordinatorActive: coordinator.active,
      originalCoordinatorMetadata: coordinator.metadata,
    };
  } finally {
    await client.end();
  }
}

async function cleanupSessionPermissionsSeed(
  seed: SessionPermissionsSeed | null,
) {
  if (!seed) return;

  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(
      `
      DELETE FROM public.sessions
      WHERE id = $1::uuid
         OR metadata ->> 'source' = $2
      `,
      [seed.sessionId, SESSION_PERMISSIONS_SOURCE],
    );

    await client.query(
      `
      UPDATE public.profiles
      SET
        role = $2::user_role,
        active = $3,
        metadata = $4::jsonb
      WHERE id = $1::uuid
      `,
      [
        seed.coordinatorId,
        seed.originalCoordinatorRole ?? "coordinator",
        seed.originalCoordinatorActive ?? true,
        JSON.stringify(seed.originalCoordinatorMetadata ?? {}),
      ],
    );
  } finally {
    await client.end();
  }
}

async function grantCoordinatorSessionActionPermissions(
  seed: SessionPermissionsSeed,
) {
  const client = new Client({ connectionString: databaseUrl });
  await client.connect();

  try {
    await client.query(
      `
      UPDATE public.profiles
      SET metadata = jsonb_set(
        jsonb_set(
          coalesce(metadata, '{}'::jsonb),
          '{access_modules}',
          '["/app/turmas"]'::jsonb,
          true
        ),
        '{session_permissions}',
        jsonb_build_object(
          'create_session', true,
          'duplicate_session', true,
          'cancel_session', true
        ),
        true
      )
      WHERE id = $1::uuid
      `,
      [seed.coordinatorId],
    );
  } finally {
    await client.end();
  }
}

test.describe.serial("Visual: permissões de sessão por papel", () => {
  let seed: SessionPermissionsSeed | null = null;

  test.beforeAll(async () => {
    seed = await prepareSessionPermissionsSeed();
  });

  test.afterAll(async () => {
    await cleanupSessionPermissionsSeed(seed);
  });

  test("coordenador mantém gestão operacional e não vê ações sensíveis", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "desktop-1440",
      "Baseline visual estabilizada apenas no desktop.",
    );

    if (!seed) {
      throw new Error("Seed ausente para o teste visual.");
    }

    await login(
      page,
      coordinatorCredentials.email,
      coordinatorCredentials.password,
    );
    await navigateToSessionsHub(page);
    await filterSessionList(page, seed.sessionCode);

    await expect(
      page.getByRole("button", { name: /nova sessão/i }),
    ).toHaveCount(0);

    const sessionRow = page
      .locator("tbody tr")
      .filter({ hasText: seed.sessionCode })
      .first();
    await expect(sessionRow).toBeVisible({ timeout: 10000 });

    const actionCell = sessionRow.locator("td").last();
    await expect(
      actionCell.getByRole("button", { name: /editar sessão/i }),
    ).toBeVisible();
    await expect(
      actionCell.getByRole("button", { name: /duplicar sessão/i }),
    ).toHaveCount(0);
    await expect(
      actionCell.getByRole("button", { name: /cancelar sessão/i }),
    ).toHaveCount(0);
    await expect(
      actionCell.getByRole("button", { name: /excluir sessão definitivamente/i }),
    ).toHaveCount(0);

    await expect(actionCell).toHaveScreenshot(
      "coordinator-open-session-operational-actions.png",
    );

    await actionCell
      .getByRole("button", { name: /editar sessão/i })
      .click();

    const editDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", {
        name: /editar sessão/i,
      }),
    });
    await expect(editDialog).toBeVisible({ timeout: 10000 });
    await expect(
      editDialog.getByLabel(/local de aplicacao/i),
    ).not.toHaveValue("", {
      timeout: 15000,
    });
    await expect(
      editDialog.getByLabel(/coordenador aplicador/i),
    ).not.toHaveValue("", {
      timeout: 15000,
    });

    await editDialog.getByRole("button", { name: /^Tarde$/i }).click();
    await editDialog.getByRole("button", { name: /salvar alteracoes/i }).click();
    await expect(editDialog).toHaveCount(0, { timeout: 15000 });
    await filterSessionList(page, seed.sessionCode);
    await expect(sessionRow).toContainText(/tarde/i);
  });

  test("coordenador com permissão delegada vê criação, duplicação e cancelamento", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "desktop-1440",
      "Baseline visual estabilizada apenas no desktop.",
    );

    if (!seed) {
      throw new Error("Seed ausente para o teste visual.");
    }

    await grantCoordinatorSessionActionPermissions(seed);

    await login(
      page,
      coordinatorCredentials.email,
      coordinatorCredentials.password,
    );
    await navigateToSessionsHub(page);
    await filterSessionList(page, seed.sessionCode);

    await expect(
      page.getByRole("button", { name: /nova sessão/i }),
    ).toBeVisible();

    const sessionRow = page
      .locator("tbody tr")
      .filter({ hasText: seed.sessionCode })
      .first();
    await expect(sessionRow).toBeVisible({ timeout: 10000 });

    const actionCell = sessionRow.locator("td").last();
    await expect(
      actionCell.getByRole("button", { name: /duplicar sessão/i }),
    ).toBeVisible();
    await expect(
      actionCell.getByRole("button", { name: /cancelar sessão/i }),
    ).toBeVisible();
    await expect(
      actionCell.getByRole("button", { name: /excluir sessão definitivamente/i }),
    ).toHaveCount(0);

    await expect(actionCell).toHaveScreenshot(
      "coordinator-delegated-session-actions.png",
    );
  });

  test("admin vê ações sensíveis na sessão aberta e pode excluir definitivamente", async ({
    page,
  }) => {
    test.skip(
      test.info().project.name !== "desktop-1440",
      "Baseline visual estabilizada apenas no desktop.",
    );

    if (!seed) {
      throw new Error("Seed ausente para o teste visual.");
    }

    await login(page, adminCredentials.email, adminCredentials.password);
    await navigateToSessionsHub(page);
    await filterSessionList(page, seed.sessionCode);

    await expect(
      page.getByRole("button", { name: /nova sessão/i }),
    ).toBeVisible();

    const sessionRow = page
      .locator("tbody tr")
      .filter({ hasText: seed.sessionCode })
      .first();
    await expect(sessionRow).toBeVisible({ timeout: 10000 });

    const actionCell = sessionRow.locator("td").last();
    await expect(
      actionCell.getByRole("button", { name: /editar sessão/i }),
    ).toBeVisible();
    await expect(
      actionCell.getByRole("button", { name: /duplicar sessão/i }),
    ).toBeVisible();
    await expect(
      actionCell.getByRole("button", { name: /cancelar sessão/i }),
    ).toBeVisible();
    await expect(
      actionCell.getByRole("button", { name: /excluir sessão definitivamente/i }),
    ).toBeVisible();

    await expect(actionCell).toHaveScreenshot(
      "admin-open-session-sensitive-actions.png",
    );

    await actionCell
      .getByRole("button", { name: /excluir sessão definitivamente/i })
      .click();

    const deleteDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", {
        name: /excluir sessão definitivamente/i,
      }),
    });
    await expect(deleteDialog).toBeVisible({ timeout: 10000 });

    await deleteDialog
      .getByRole("button", { name: /excluir definitivamente/i })
      .click();
    await expect(deleteDialog).toHaveCount(0, { timeout: 15000 });
    await expect(page.getByText(seed.sessionCode).first()).toHaveCount(0, {
      timeout: 10000,
    });
  });
});
