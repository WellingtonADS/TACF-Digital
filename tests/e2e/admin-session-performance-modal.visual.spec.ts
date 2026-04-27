import { expect, test, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { adminCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

const PERFORMANCE_MODAL_SOURCE = "e2e-performance-modal-visual";

type SeededBooking = {
  id: string;
  orderNumber: number;
};

type PerformanceModalSeed = {
  sessionId: string;
  sessionCode: string;
  createdBookingIds: string[];
  createdAuthUserIds: string[];
};

type SeedUserDraft = {
  fullName: string;
  warName: string;
  saram: string;
  semester: "1" | "2";
  email: string;
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

function getSessionCode(sessionId: string) {
  return sessionId.slice(0, 12).toUpperCase();
}

function getAdminSupabase() {
  return createClient(
    requireEnv("SUPABASE_URL"),
    requireEnv("SUPABASE_SERVICE_ROLE_KEY"),
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    },
  );
}

function buildSeedUser(index: number): SeedUserDraft {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}${index}`;

  return {
    fullName: `E2E Modal Usuario ${index + 1}`,
    warName: `Modal${index + 1}`,
    saram: `E2EMOD${suffix.slice(-6)}`,
    semester: index % 2 === 0 ? "1" : "2",
    email: `e2e.modal.performance.${suffix}@example.com`,
  };
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

async function filterSessionList(page: Page, sessionCode: string) {
  const searchInput = page.getByPlaceholder(
    /Buscar sessao, data, turno ou local|Buscar sessão, data, turno ou local/i,
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
    "Nao foi possivel encontrar data elegivel para o teste visual do modal.",
  );
}

async function preparePerformanceModalSeed(): Promise<PerformanceModalSeed> {
  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  const adminSupabase = getAdminSupabase();
  const createdAuthUserIds: string[] = [];
  await client.connect();

  try {
    await client.query(
      `
      DELETE FROM public.bookings
      WHERE metadata ->> 'source' = $1
      `,
      [PERFORMANCE_MODAL_SOURCE],
    );

    await client.query(
      `
      DELETE FROM public.sessions
      WHERE metadata ->> 'source' = $1
      `,
      [PERFORMANCE_MODAL_SOURCE],
    );

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

    const candidateUsers: Array<{ id: string; semester: "1" | "2" }> = [];

    for (let index = 0; index < 5; index += 1) {
      const draft = buildSeedUser(index);

      const { data, error } = await adminSupabase.auth.admin.createUser({
        email: draft.email,
        password: `E2e!${Date.now()}${Math.floor(Math.random() * 1000)}`,
        email_confirm: true,
      });

      if (error || !data.user?.id) {
        throw error ?? new Error("Falha ao criar usuario auth para o seed.");
      }

      createdAuthUserIds.push(data.user.id);

      await client.query(
        `
        UPDATE public.profiles
        SET
          saram = $2::text,
          full_name = $3::text,
          rank = 'Soldado',
          role = 'user'::user_role,
          semester = $4::semester_type,
          active = true,
          war_name = $5::text,
          metadata = jsonb_build_object('source', $6::text)
        WHERE id = $1::uuid
        `,
        [
          data.user.id,
          draft.saram,
          draft.fullName,
          draft.semester,
          draft.warName,
          PERFORMANCE_MODAL_SOURCE,
        ],
      );

      candidateUsers.push({
        id: data.user.id,
        semester: draft.semester,
      });
    }

    const sessionDate = await getNextAvailableDate(client);

    const sessionInsertRes = await client.query<{ id: string }>(
      `
      INSERT INTO public.sessions (
        date,
        period,
        max_capacity,
        status,
        coordinator_id,
        applicators,
        metadata
      )
      VALUES (
        $1::date,
        'manha'::session_period,
        21,
        'open'::session_status,
        $2::uuid,
        ARRAY[$2::text],
        jsonb_build_object('source', $3::text)
      )
      RETURNING id::text AS id
      `,
      [sessionDate, adminId, PERFORMANCE_MODAL_SOURCE],
    );

    const sessionId = sessionInsertRes.rows[0]?.id;
    if (!sessionId) {
      throw new Error("Falha ao criar sessao para o teste visual do modal.");
    }

    const seededBookings: SeededBooking[] = [];

    for (let index = 0; index < 5; index += 1) {
      const user = candidateUsers[index];
      let resultDetails: string | null = null;

      if (index === 0) {
        resultDetails = JSON.stringify({
          result_status: "apto",
          corrida: "2200",
          flexao: "12",
          abdominal: "24",
        });
      }

      if (index === 1) {
        resultDetails = JSON.stringify({
          result_status: "inapto",
          corrida: "1800",
          flexao: "8",
          abdominal: "18",
        });
      }

      if (index === 2) {
        resultDetails = JSON.stringify({
          result_status: "apto",
          corrida: "2350",
          flexao: "14",
          abdominal: "28",
        });
      }

      const bookingInsertRes = await client.query<{ id: string }>(
        `
        INSERT INTO public.bookings (
          session_id,
          user_id,
          status,
          semester,
          attendance_confirmed,
          result_details,
          order_number,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          'agendado'::booking_status,
          $3::semester_type,
          false,
          $4::jsonb,
          $5::int,
          jsonb_build_object('source', $6::text)
        )
        RETURNING id::text AS id
        `,
        [
          sessionId,
          user.id,
          user.semester,
          resultDetails,
          index + 1,
          PERFORMANCE_MODAL_SOURCE,
        ],
      );

      const bookingId = bookingInsertRes.rows[0]?.id;
      if (!bookingId) {
        throw new Error("Falha ao criar booking de seed para o modal.");
      }

      seededBookings.push({ id: bookingId, orderNumber: index + 1 });
    }

    return {
      sessionId,
      sessionCode: getSessionCode(sessionId),
      createdBookingIds: seededBookings.map((booking) => booking.id),
      createdAuthUserIds,
    };
  } finally {
    await client.end();
  }
}

async function cleanupPerformanceModalSeed(seed: PerformanceModalSeed | null) {
  if (!seed) return;

  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  const adminSupabase = getAdminSupabase();
  await client.connect();

  try {
    if (seed.createdBookingIds.length > 0) {
      await client.query(
        `
        DELETE FROM public.bookings
        WHERE id = ANY($1::uuid[])
        `,
        [seed.createdBookingIds],
      );
    }

    await client.query(
      `
      DELETE FROM public.sessions
      WHERE id = $1::uuid
         OR metadata ->> 'source' = $2
      `,
      [seed.sessionId, PERFORMANCE_MODAL_SOURCE],
    );

    for (const authUserId of seed.createdAuthUserIds) {
      const { error } = await adminSupabase.auth.admin.deleteUser(authUserId);
      if (error) {
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

test.describe.serial("Visual: lancamento de performance modal", () => {
  test.setTimeout(240000);

  let seed: PerformanceModalSeed | null = null;

  test.beforeAll(async () => {
    seed = await preparePerformanceModalSeed();
  });

  test.afterAll(async () => {
    await cleanupPerformanceModalSeed(seed);
  });

  test("admin abre modal de lancamento no 4 de 5 e captura evidencia visual", async ({
    page,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Validacao visual focada no layout desktop do anexo.",
    );

    if (!seed) {
      throw new Error("Seed ausente para o teste visual do modal.");
    }

    await loginAsAdmin(page);
    await navigateToSessionsHub(page);
    await filterSessionList(page, seed.sessionCode);

    const sessionRow = page
      .locator("tbody tr")
      .filter({ hasText: seed.sessionCode })
      .first();

    await expect(sessionRow).toBeVisible({ timeout: 10000 });

    await sessionRow
      .getByRole("button", { name: /Gerir sessao|Gerir sessão/i })
      .click();

    const hubDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", {
        name: /Gestao da Turma|Gestão da Turma/i,
      }),
    });

    await expect(hubDialog).toBeVisible({ timeout: 15000 });

    const fourthBookingRow = hubDialog.locator("tbody tr").nth(3);
    await expect(fourthBookingRow).toBeVisible({ timeout: 10000 });

    await fourthBookingRow
      .getByRole("button", {
        name: /Lancar resultado|Lançar resultado/i,
      })
      .click();

    const performanceDialog = page.getByRole("dialog").filter({
      has: page.getByRole("heading", {
        name: /Lancamento de Performance Modal|Lançamento de Performance Modal/i,
      }),
    });

    await expect(performanceDialog).toBeVisible({ timeout: 10000 });

    await performanceDialog
      .getByRole("textbox", { name: /Corrida/i })
      .fill("2400");
    await performanceDialog
      .getByRole("textbox", { name: /Flexao|Flexão/i })
      .fill("15");
    await performanceDialog
      .getByRole("textbox", { name: /Abdominal/i })
      .fill("30");

    await performanceDialog.getByRole("button", { name: /^Apto$/i }).click();

    await expect(performanceDialog).toContainText(/Variante\s+4\s+de\s+5/i);
    await expect(
      performanceDialog.getByRole("button", {
        name: /Salvar e Proximo|Salvar e Próximo/i,
      }),
    ).toBeVisible();

    await performanceDialog.screenshot({
      path: "test-results/performance-modal-dialog-desktop.png",
    });

    await page.screenshot({
      path: "test-results/performance-modal-overlay-desktop.png",
      fullPage: true,
    });
  });
});
