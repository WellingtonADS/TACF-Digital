import { expect, test, type Locator, type Page } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { adminCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

const ADMIN_RESCHED_SOURCE = "e2e-admin-rescheduling-crud";
const APPROVE_REASON_TEXT =
  "Teste E2E visual admin para deferir reagendamento no hub.";
const REJECT_REASON_TEXT =
  "Teste E2E visual admin para indeferir reagendamento no hub.";

type RescheduleRequestSeed = {
  requestId: string;
  bookingId: string;
  searchTerm: string;
  reasonText: string;
};

type SeedUserDraft = {
  fullName: string;
  warName: string;
  saram: string;
  semester: "1" | "2";
  email: string;
};

type AdminReschedulingSeed = {
  createdAuthUserIds: string[];
  createdSessionIds: string[];
  createdBookingIds: string[];
  createdRequestIds: string[];
  approveRequest: RescheduleRequestSeed;
  rejectRequest: RescheduleRequestSeed;
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

function buildSeedUser(kind: "approve" | "reject"): SeedUserDraft {
  const suffix = `${Date.now()}${Math.floor(Math.random() * 1000)}`;

  if (kind === "approve") {
    return {
      fullName: "E2E Militar Aprovação",
      warName: "Aprova",
      saram: `E2EAPR${suffix.slice(-6)}`,
      semester: "1",
      email: `e2e.reschedule.approve.${suffix}@example.com`,
    };
  }

  return {
    fullName: "E2E Militar Indeferimento",
    warName: "Recusa",
    saram: `E2EREJ${suffix.slice(-6)}`,
    semester: "2",
    email: `e2e.reschedule.reject.${suffix}@example.com`,
  };
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
  for (let offset = minOffset; offset <= 45; offset += 1) {
    const candidate = addDays(new Date(), offset);
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
    "Não foi possível encontrar datas elegíveis para o CRUD visual de reagendamentos.",
  );
}

async function cleanupAdminReschedulingSeed(
  seed: AdminReschedulingSeed | null,
) {
  if (!seed) return;

  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  const adminSupabase = getAdminSupabase();
  await client.connect();

  try {
    if (seed.createdRequestIds.length > 0) {
      await client.query(
        `
        DELETE FROM public.swap_requests
        WHERE id = ANY($1::uuid[])
        `,
        [seed.createdRequestIds],
      );
    }

    if (seed.createdBookingIds.length > 0) {
      await client.query(
        `
        DELETE FROM public.bookings
        WHERE id = ANY($1::uuid[])
        `,
        [seed.createdBookingIds],
      );
    }

    if (seed.createdSessionIds.length > 0) {
      await client.query(
        `
        DELETE FROM public.sessions
        WHERE id = ANY($1::uuid[])
        `,
        [seed.createdSessionIds],
      );
    }

    for (const userId of seed.createdAuthUserIds) {
      const { error } = await adminSupabase.auth.admin.deleteUser(userId);
      if (error) {
        throw error;
      }
    }
  } finally {
    await client.end();
  }
}

async function prepareAdminReschedulingSeed(): Promise<AdminReschedulingSeed> {
  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
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

    if (!adminRes.rows[0]?.id) {
      throw new Error("Admin user não encontrado em auth.users.");
    }

    await client.query(
      `
      DELETE FROM public.swap_requests
      WHERE reason::text LIKE $1
      `,
      [`%${ADMIN_RESCHED_SOURCE}%`],
    );

    await client.query(
      `
      DELETE FROM public.bookings
      WHERE metadata ->> 'source' = $1
      `,
      [ADMIN_RESCHED_SOURCE],
    );

    await client.query(
      `
      DELETE FROM public.sessions
      WHERE metadata ->> 'source' = $1
      `,
      [ADMIN_RESCHED_SOURCE],
    );

    const adminSupabase = getAdminSupabase();
    const approveUserSeed = buildSeedUser("approve");
    const rejectUserSeed = buildSeedUser("reject");

    const createdUsers = [] as Array<{ id: string; draft: SeedUserDraft }>;

    for (const draft of [approveUserSeed, rejectUserSeed]) {
      const { data, error } = await adminSupabase.auth.admin.createUser({
        email: draft.email,
        password: `E2e!${Date.now()}${Math.floor(Math.random() * 1000)}`,
        email_confirm: true,
      });

      if (error || !data.user?.id) {
        throw error ?? new Error("Falha ao criar usuário auth para o seed.");
      }

      createdUsers.push({ id: data.user.id, draft });
    }

    for (const createdUser of createdUsers) {
      await client.query(
        `
        UPDATE public.profiles
        SET
          saram = $2::text,
          full_name = $3::text,
          rank = 'Soldado',
          role = 'user',
          semester = $4::semester_type,
          active = true,
          war_name = $5::text,
          metadata = jsonb_build_object('source', $6::text)
        WHERE id = $1::uuid
        `,
        [
          createdUser.id,
          createdUser.draft.saram,
          createdUser.draft.fullName,
          createdUser.draft.semester,
          createdUser.draft.warName,
          ADMIN_RESCHED_SOURCE,
        ],
      );
    }

    const [
      { id: approveUserId, draft: approveUserDraft },
      { id: rejectUserId, draft: rejectUserDraft },
    ] = createdUsers;
    const approveUser = { id: approveUserId, ...approveUserDraft };
    const rejectUser = { id: rejectUserId, ...rejectUserDraft };

    const blockedDates = new Set<string>();
    const sessionDates = await Promise.all([
      getNextAvailableDate(client, 3, blockedDates),
      getNextAvailableDate(client, 5, blockedDates),
      getNextAvailableDate(client, 7, blockedDates),
      getNextAvailableDate(client, 9, blockedDates),
    ]);

    const createdSessionIds: string[] = [];
    for (const sessionDate of sessionDates) {
      const sessionRes = await client.query<{ id: string }>(
        `
        INSERT INTO public.sessions (
          date,
          period,
          max_capacity,
          status,
          applicators,
          metadata
        )
        VALUES (
          $1::date,
          'manha'::session_period,
          21,
          'open'::session_status,
          ARRAY[]::text[],
          jsonb_build_object('source', $2::text)
        )
        RETURNING id::text AS id
        `,
        [sessionDate, ADMIN_RESCHED_SOURCE],
      );

      const sessionId = sessionRes.rows[0]?.id;
      if (!sessionId) {
        throw new Error("Falha ao criar sessão de apoio para reagendamentos.");
      }

      createdSessionIds.push(sessionId);
    }

    const [
      approveOriginalSessionId,
      approveNewSessionId,
      rejectOriginalSessionId,
      rejectNewSessionId,
    ] = createdSessionIds;

    const bookingSeeds = [
      {
        user: approveUser,
        originalSessionId: approveOriginalSessionId,
      },
      {
        user: rejectUser,
        originalSessionId: rejectOriginalSessionId,
      },
    ] as const;

    const createdBookingIds: string[] = [];
    for (const bookingSeed of bookingSeeds) {
      const bookingRes = await client.query<{ id: string }>(
        `
        INSERT INTO public.bookings (
          session_id,
          user_id,
          status,
          semester,
          attendance_confirmed,
          result_details,
          metadata
        )
        VALUES (
          $1::uuid,
          $2::uuid,
          'agendado'::booking_status,
          $3::semester_type,
          false,
          NULL,
          jsonb_build_object('source', $4::text)
        )
        RETURNING id::text AS id
        `,
        [
          bookingSeed.originalSessionId,
          bookingSeed.user.id,
          bookingSeed.user.semester,
          ADMIN_RESCHED_SOURCE,
        ],
      );

      const bookingId = bookingRes.rows[0]?.id;
      if (!bookingId) {
        throw new Error(
          "Falha ao criar booking para a massa de reagendamentos.",
        );
      }

      createdBookingIds.push(bookingId);
    }

    const approveReason = JSON.stringify({
      text: APPROVE_REASON_TEXT,
      new_date: sessionDates[1],
      source: ADMIN_RESCHED_SOURCE,
    });

    const rejectReason = JSON.stringify({
      text: REJECT_REASON_TEXT,
      new_date: sessionDates[3],
      source: ADMIN_RESCHED_SOURCE,
    });

    const approveRequestRes = await client.query<{ id: string }>(
      `
      INSERT INTO public.swap_requests (
        booking_id,
        requested_by,
        new_session_id,
        reason,
        status
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3::uuid,
        $4::text,
        'solicitado'::swap_status
      )
      RETURNING id::text AS id
      `,
      [createdBookingIds[0], approveUserId, approveNewSessionId, approveReason],
    );

    const rejectRequestRes = await client.query<{ id: string }>(
      `
      INSERT INTO public.swap_requests (
        booking_id,
        requested_by,
        new_session_id,
        reason,
        status
      )
      VALUES (
        $1::uuid,
        $2::uuid,
        $3::uuid,
        $4::text,
        'solicitado'::swap_status
      )
      RETURNING id::text AS id
      `,
      [createdBookingIds[1], rejectUserId, rejectNewSessionId, rejectReason],
    );

    const approveRequestId = approveRequestRes.rows[0]?.id;
    const rejectRequestId = rejectRequestRes.rows[0]?.id;

    if (!approveRequestId || !rejectRequestId) {
      throw new Error(
        "Falha ao criar solicitações de reagendamento para o teste visual.",
      );
    }

    return {
      createdAuthUserIds: [approveUserId, rejectUserId],
      createdSessionIds,
      createdBookingIds,
      createdRequestIds: [approveRequestId, rejectRequestId],
      approveRequest: {
        requestId: approveRequestId,
        bookingId: createdBookingIds[0],
        searchTerm: approveUserDraft.saram,
        reasonText: APPROVE_REASON_TEXT,
      },
      rejectRequest: {
        requestId: rejectRequestId,
        bookingId: createdBookingIds[1],
        searchTerm: rejectUserDraft.saram,
        reasonText: REJECT_REASON_TEXT,
      },
    };
  } finally {
    await client.end();
  }
}

async function assertDatabaseStatus(
  requestId: string,
  bookingId: string,
  requestStatus: "aprovado" | "cancelado",
  bookingStatus: "agendado" | "remarcado",
) {
  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
    await expect
      .poll(
        async () => {
          const requestRes = await client.query<{ status: string }>(
            `
            SELECT status::text AS status
            FROM public.swap_requests
            WHERE id = $1::uuid
            `,
            [requestId],
          );

          const bookingRes = await client.query<{ status: string }>(
            `
            SELECT status::text AS status
            FROM public.bookings
            WHERE id = $1::uuid
            `,
            [bookingId],
          );

          return {
            requestStatus: requestRes.rows[0]?.status,
            bookingStatus: bookingRes.rows[0]?.status,
          };
        },
        {
          timeout: 15000,
          intervals: [500, 1000, 2000],
        },
      )
      .toEqual({
        requestStatus,
        bookingStatus,
      });
  } finally {
    await client.end();
  }
}

async function loginAsAdmin(loginPage: LoginPage) {
  await loginPage.goto();
  await loginPage.login(adminCredentials.email, adminCredentials.password);
  await expect(loginPage.page).toHaveURL(/\/app(\/admin)?/, {
    timeout: 15000,
  });
  await waitForPageReady(loginPage.page);
}

async function navigateToReschedulingHub(page: Page) {
  await page.goto("/app/turmas?tab=reagendamentos");
  await waitForPageReady(page);

  await expect(page.getByTestId("sessions-management-page")).toBeVisible({
    timeout: 15000,
  });
  await expect(
    page.getByRole("button", { name: /reagendamentos/i }),
  ).toBeVisible({ timeout: 10000 });
}

async function filterRequestList(page: Page, searchTerm: string) {
  const searchInput = page.getByPlaceholder(
    /Buscar por SARAM, nome ou nome de guerra/i,
  );

  await expect(searchInput).toBeVisible({ timeout: 10000 });
  await searchInput.fill(searchTerm);
  await searchInput.blur();
}

async function expectRequestVisible(
  page: Page,
  searchTerm: string,
): Promise<Locator> {
  const requestRow = page
    .getByTestId("rescheduling-request-row")
    .filter({ hasText: searchTerm })
    .first();

  await expect(requestRow).toBeVisible({ timeout: 10000 });
  return requestRow;
}

async function openReasonDetails(
  page: Page,
  requestRow: Locator,
  reasonText: string,
) {
  await requestRow.click();

  const dialog = page.getByRole("dialog", {
    name: /Solicitação de Reagendamento/i,
  });

  await expect(dialog).toBeVisible({ timeout: 10000 });
  await expect(dialog.getByText(reasonText)).toBeVisible({ timeout: 10000 });

  await page.screenshot({
    path: "test-results/admin-rescheduling-reason-open.png",
    fullPage: true,
  });

  return dialog;
}

async function clickStatusFilter(page: Page, name: RegExp) {
  const button = page.getByRole("button", { name }).first();
  await expect(button).toBeVisible({ timeout: 10000 });
  await button.click();
}

async function assertBadgeVisible(page: Page, label: RegExp) {
  await expect(page.getByText(label).first()).toBeVisible({ timeout: 10000 });
}

async function performRequestDecision(
  page: Page,
  options: {
    searchTerm: string;
    reasonText: string;
    action: "approve" | "reject";
  },
) {
  await filterRequestList(page, options.searchTerm);
  const requestRow = await expectRequestVisible(page, options.searchTerm);
  const dialog = await openReasonDetails(page, requestRow, options.reasonText);

  const actionButton = dialog
    .getByRole("button", {
      name: options.action === "approve" ? /^Deferir$/i : /^Indeferir$/i,
    })
    .first();

  await expect(actionButton).toBeVisible({ timeout: 10000 });
  await page.screenshot({
    path:
      options.action === "approve"
        ? "test-results/admin-rescheduling-before-approve.png"
        : "test-results/admin-rescheduling-before-reject.png",
    fullPage: true,
  });
  await actionButton.click();

  await dialog.getByRole("button", { name: /fechar/i }).click();
  await expect(dialog).toHaveCount(0, { timeout: 10000 });
}

test.describe("CRUD visual: admin gerencia reagendamentos no hub", () => {
  test.setTimeout(240000);

  let adminSeed: AdminReschedulingSeed | null = null;

  test.beforeAll(async () => {
    adminSeed = await prepareAdminReschedulingSeed();
  });

  test.afterAll(async () => {
    await cleanupAdminReschedulingSeed(adminSeed);
  });

  test("admin visualiza a estrutura do hub de reagendamentos", async ({
    page,
  }) => {
    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);
    await navigateToReschedulingHub(page);

    await expect(
      page.getByText(/Exibindo \d+ de \d+ solicitacoes/i),
    ).toBeVisible({
      timeout: 10000,
    });
    await expect(page.getByText(/^Pendentes$/i).first()).toBeVisible({
      timeout: 10000,
    });

    await page.screenshot({
      path: "test-results/admin-rescheduling-hub-overview.png",
      fullPage: true,
    });
  });

  test("CRUD operacional: visualizar justificativa, deferir e indeferir solicitações", async ({
    page,
  }) => {
    if (!adminSeed) {
      throw new Error("Seed admin de reagendamentos não inicializado.");
    }

    const loginPage = new LoginPage(page);
    await loginAsAdmin(loginPage);
    await navigateToReschedulingHub(page);

    await clickStatusFilter(page, /^Pendentes$/i);

    await performRequestDecision(page, {
      searchTerm: adminSeed.approveRequest.searchTerm,
      reasonText: adminSeed.approveRequest.reasonText,
      action: "approve",
    });

    await assertDatabaseStatus(
      adminSeed.approveRequest.requestId,
      adminSeed.approveRequest.bookingId,
      "aprovado",
      "remarcado",
    );

    await clickStatusFilter(page, /^Aprovados$/i);
    await filterRequestList(page, adminSeed.approveRequest.searchTerm);
    await expectRequestVisible(page, adminSeed.approveRequest.searchTerm);
    await assertBadgeVisible(page, /Aprovado/i);

    await page.screenshot({
      path: "test-results/admin-rescheduling-approved.png",
      fullPage: true,
    });

    await clickStatusFilter(page, /^Pendentes$/i);

    await performRequestDecision(page, {
      searchTerm: adminSeed.rejectRequest.searchTerm,
      reasonText: adminSeed.rejectRequest.reasonText,
      action: "reject",
    });

    await assertDatabaseStatus(
      adminSeed.rejectRequest.requestId,
      adminSeed.rejectRequest.bookingId,
      "cancelado",
      "agendado",
    );

    await clickStatusFilter(page, /^Recusados$/i);
    await filterRequestList(page, adminSeed.rejectRequest.searchTerm);
    await expectRequestVisible(page, adminSeed.rejectRequest.searchTerm);
    await assertBadgeVisible(page, /Recusado/i);

    await page.screenshot({
      path: "test-results/admin-rescheduling-rejected.png",
      fullPage: true,
    });
  });
});
