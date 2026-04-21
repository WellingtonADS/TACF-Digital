import { expect, type Locator, type Page, test } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { Client } from "pg";
import { LoginPage } from "./pages/LoginPage";

const MANUAL_RESCHEDULE_SOURCE = "e2e-manual-user-reschedule";
const MANUAL_RESCHEDULE_REASON =
  "Teste E2E visual com usuário real para validar reagendamento.";

type ManualRescheduleSeed = {
  userId: string;
  createdBookingIds: string[];
  createdSessionIds: string[];
};

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) throw new Error(`Variável obrigatória ausente: ${name}`);
  return value;
}

function getOptionalEnv(name: string) {
  return process.env[name];
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

function getCurrentSemester(date: Date) {
  return date.getMonth() < 6 ? "1" : "2";
}

async function getNextEligibleDate(
  client: Client,
  minOffset: number,
  blockedDates: Set<string>,
) {
  for (let offset = minOffset; offset <= 45; offset += 1) {
    const candidate = addDays(new Date(), offset);
    if (candidate.getDay() === 0) continue;

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
    "Não foi possível encontrar datas elegíveis para a massa do reagendamento visual.",
  );
}

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 60000,
  });
}

async function getBackendDashboardSummary(email: string, password: string) {
  const url = requireEnv("VITE_SUPABASE_URL");
  const anonKey = requireEnv("VITE_SUPABASE_ANON_KEY");

  const supabase = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (signInError) throw signInError;

  const { data, error } = await supabase.rpc("get_user_dashboard_summary");
  if (error) throw error;

  return data as {
    bookings_count?: number | null;
    next_session_booking_id?: string | null;
    next_session?: { date?: string | null } | null;
    has_pending_swap?: boolean | null;
  };
}

async function cleanupManualRescheduleSeed(seed: ManualRescheduleSeed | null) {
  if (!seed) return;

  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
    await client.query(
      `
      DELETE FROM public.swap_requests
      WHERE requested_by = $1::uuid
        AND reason = $2
      `,
      [seed.userId, MANUAL_RESCHEDULE_REASON],
    );

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
  } finally {
    await client.end();
  }
}

async function prepareManualRescheduleSeed(
  email: string,
): Promise<ManualRescheduleSeed> {
  const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
  await client.connect();

  try {
    const userRes = await client.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM auth.users
      WHERE email = $1
      LIMIT 1
      `,
      [email],
    );

    const userId = userRes.rows[0]?.id;
    if (!userId) {
      throw new Error("Usuário do teste manual não encontrado em auth.users.");
    }

    const previousBookingIdsRes = await client.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM public.bookings
      WHERE metadata ->> 'source' = $1
      `,
      [MANUAL_RESCHEDULE_SOURCE],
    );

    const previousSessionIdsRes = await client.query<{ id: string }>(
      `
      SELECT id::text AS id
      FROM public.sessions
      WHERE metadata ->> 'source' = $1
      `,
      [MANUAL_RESCHEDULE_SOURCE],
    );

    const previousBookingIds = previousBookingIdsRes.rows.map(({ id }) => id);
    const previousSessionIds = previousSessionIdsRes.rows.map(({ id }) => id);

    await client.query(
      `
      DELETE FROM public.swap_requests
      WHERE requested_by = $1::uuid
        AND reason = $2
      `,
      [userId, MANUAL_RESCHEDULE_REASON],
    );

    if (previousBookingIds.length > 0) {
      await client.query(
        `
        DELETE FROM public.bookings
        WHERE id = ANY($1::uuid[])
        `,
        [previousBookingIds],
      );
    }

    if (previousSessionIds.length > 0) {
      await client.query(
        `
        DELETE FROM public.sessions
        WHERE id = ANY($1::uuid[])
        `,
        [previousSessionIds],
      );
    }

    const reservedDates = new Set<string>();
    const bookedDate = await getNextEligibleDate(client, 2, reservedDates);
    const alternativeDate = await getNextEligibleDate(client, 4, reservedDates);
    const semester = getCurrentSemester(new Date());

    const bookedSessionRes = await client.query<{ id: string }>(
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
      [bookedDate, MANUAL_RESCHEDULE_SOURCE],
    );

    const alternativeSessionRes = await client.query<{ id: string }>(
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
      [alternativeDate, MANUAL_RESCHEDULE_SOURCE],
    );

    const bookedSessionId = bookedSessionRes.rows[0]?.id;
    const alternativeSessionId = alternativeSessionRes.rows[0]?.id;

    if (!bookedSessionId || !alternativeSessionId) {
      throw new Error(
        "Falha ao criar as sessões de apoio para o reagendamento visual.",
      );
    }

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
      [bookedSessionId, userId, semester, MANUAL_RESCHEDULE_SOURCE],
    );

    const bookingId = bookingRes.rows[0]?.id;
    if (!bookingId) {
      throw new Error(
        "Falha ao criar o booking válido para o reagendamento visual.",
      );
    }

    return {
      userId,
      createdBookingIds: [bookingId],
      createdSessionIds: [bookedSessionId, alternativeSessionId],
    };
  } finally {
    await client.end();
  }
}

async function getAvailableCalendarDays(page: Page) {
  const locator = page.locator('[data-state="available"]');
  const testIds = await locator.evaluateAll((elements) =>
    elements.map((element) => element.getAttribute("data-testid") || ""),
  );

  return testIds
    .map((value) => value.replace("calendar-day-", ""))
    .filter(Boolean);
}

async function findAlternativeAvailableDate(page: Page, currentDate: string) {
  let availableDates = await getAvailableCalendarDays(page);
  let candidate = availableDates.find((date) => date !== currentDate);

  if (candidate) return candidate;

  const nextMonthButton = page.locator(
    '[data-testid="calendar-next-month"], button:has([data-lucide="chevron-right"])',
  );

  if (await nextMonthButton.count()) {
    await nextMonthButton.first().click();
    await page.waitForTimeout(1500);
    availableDates = await getAvailableCalendarDays(page);
    candidate = availableDates.find((date) => date !== currentDate);
  }

  if (!candidate) {
    throw new Error(
      "Não foi encontrada uma data alternativa disponível para validar o reagendamento.",
    );
  }

  return candidate;
}

async function fillDateInput(input: Locator, value: string) {
  await input.fill(value);
  await input.dispatchEvent("input");
  await input.dispatchEvent("change");
}

async function waitForToastText(page: Page, patterns: RegExp[]) {
  const notificationRegion = page.getByRole("region", {
    name: /Notifications/i,
  });

  for (const pattern of patterns) {
    const toast = notificationRegion.getByText(pattern);
    if (await toast.isVisible({ timeout: 1000 }).catch(() => false)) {
      return;
    }
  }

  await Promise.any(
    patterns.map((pattern) =>
      notificationRegion.getByText(pattern).waitFor({ state: "visible" }),
    ),
  );
}

test.describe("Prático visual: usuário militar solicita reagendamento", () => {
  test.setTimeout(240000);

  const email = getOptionalEnv("E2E_USER_EMAIL") ?? getOptionalEnv("SEED_USER_EMAIL");
  const password =
    getOptionalEnv("E2E_USER_PASSWORD") ?? getOptionalEnv("SEED_USER_PASSWORD");
  let manualSeed: ManualRescheduleSeed | null = null;

  test.beforeAll(async () => {
    if (!email || !password) return;
    manualSeed = await prepareManualRescheduleSeed(email);
  });

  test.afterAll(async () => {
    await cleanupManualRescheduleSeed(manualSeed);
  });

  test("usuário real abre o agendamento existente e solicita reagendamento", async ({
    page,
  }) => {
    test.skip(
      !email || !password,
      "Teste manual requer E2E_USER_EMAIL e E2E_USER_PASSWORD configurados.",
    );

    const backendSummary = await getBackendDashboardSummary(email, password);

    expect(backendSummary.bookings_count ?? 0).toBeGreaterThan(0);
    expect(backendSummary.next_session_booking_id).toBeTruthy();

    const loginPage = new LoginPage(page);

    await page.goto("/login");
    await waitForPageReady(page);
    await expect(loginPage.emailInput).toBeVisible({ timeout: 60000 });
    await loginPage.login(email, password);

    await expect(page).toHaveURL(/\/app(\/)?$/, { timeout: 60000 });
    await waitForPageReady(page);
    await expect(page.getByTestId("operational-dashboard")).toBeVisible({
      timeout: 30000,
    });

    await page.goto("/app/ticket");
    await waitForPageReady(page);
    await expect(page.getByText(/Comprovante de Agendamento/i)).toBeVisible({
      timeout: 30000,
    });

    const rescheduleButton = page.getByRole("button", {
      name: /Solicitar Reagendamento/i,
    });
    await expect(rescheduleButton).toBeVisible({ timeout: 30000 });

    await page.screenshot({
      path: "test-results/manual-user-reschedule-dashboard.png",
      fullPage: true,
    });

    await rescheduleButton.click();

    const currentDateInput = page.locator("#current-date");
    await expect(currentDateInput).toBeVisible({ timeout: 15000 });
    const currentDate = await currentDateInput.inputValue();

    await page.goto("/app/agendamentos");
    await waitForPageReady(page);
    await expect(page.getByTestId("scheduling-page")).toBeVisible({
      timeout: 30000,
    });

    const rescheduleDate = await findAlternativeAvailableDate(page, currentDate);

    await page.goto("/app/ticket");
    await waitForPageReady(page);
    await page
      .getByRole("button", { name: /Solicitar Reagendamento/i })
      .click();

    await expect(
      page.getByRole("heading", { name: /Solicitar Reagendamento/i }),
    ).toBeVisible({ timeout: 15000 });

    await fillDateInput(page.locator("#new-date"), rescheduleDate);
    await expect
      .poll(async () => page.locator("#session-select option").count(), {
        timeout: 15000,
      })
      .toBeGreaterThan(1);
    await page.locator("#session-select").selectOption({ index: 1 });
    await page
      .locator("#reason")
      .fill(MANUAL_RESCHEDULE_REASON);

    await page.screenshot({
      path: "test-results/manual-user-reschedule-filled.png",
      fullPage: true,
    });

    await page.getByRole("button", { name: /^Enviar$/i }).click();

    await waitForToastText(page, [
      /Solicitação enviada/i,
      /Já existe uma solicitação pendente/i,
    ]);

    await page.goto("/app/ticket");
    await waitForPageReady(page);
    await expect(page.getByText(/Reagendamento pendente/i)).toBeVisible({
      timeout: 30000,
    });

    await page.screenshot({
      path: "test-results/manual-user-reschedule-success.png",
      fullPage: true,
    });
  });
});
