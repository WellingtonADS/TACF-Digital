import { expect, test, type Page } from "@playwright/test";
import { Client } from "pg";
import { adminCredentials, userCredentials } from "./fixtures/auth";
import { LoginPage } from "./pages/LoginPage";

type Scenario = {
  locationId: string;
  locationName: string;
  sessionId: string;
  backupSessionId: string;
  bookingId: string;
  swapRequestId: string;
  userId: string;
  userDisplayName: string;
  userSaram: string | null;
  cancelReason: string;
  reusedBooking: boolean;
  originalBooking: {
    sessionId: string;
    status: string;
    attendanceConfirmed: boolean;
    resultDetails: unknown;
    metadata: unknown;
    testDate: string | null;
  } | null;
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
  startOffsetDays = 3,
): Promise<{ date: string; period: "manha" | "tarde" }> {
  for (let offset = startOffsetDays; offset < startOffsetDays + 30; offset += 1) {
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

  throw new Error("Nao foi encontrado slot livre para sessao de teste E2E.");
}

async function waitForPageReady(page: Page) {
  await expect(page.getByTestId("full-page-loading")).toHaveCount(0, {
    timeout: 15000,
  });
}

async function cleanupStaleE2eBookingsForUser(client: Client, userId: string) {
  const staleBookingIdsRes = await client.query<{ id: string }>(
    `
      select b.id::text as id
      from public.bookings b
      where b.user_id = $1::uuid
        and b.status = 'agendado'::booking_status
        and b.metadata->>'source' = 'e2e-admin-booking-cancel'
    `,
    [userId],
  );

  const staleBookingIds = staleBookingIdsRes.rows.map((row) => row.id);

  if (staleBookingIds.length === 0) {
    return;
  }

  await client.query(
    `
      delete from public.swap_requests
      where booking_id = any($1::uuid[])
    `,
    [staleBookingIds],
  );

  await client.query(
    `
      delete from public.user_notifications
      where type = 'booking_cancelled'
        and metadata->>'booking_id' = any($1::text[])
    `,
    [staleBookingIds],
  );

  await client.query(
    `
      update public.bookings
      set status = 'cancelado',
          attendance_confirmed = false,
          updated_at = now()
      where id = any($1::uuid[])
    `,
    [staleBookingIds],
  );
}

async function login(
  page: Page,
  email: string,
  password: string,
  expectedUrl: RegExp,
) {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login(email, password);
  await expect(page).toHaveURL(expectedUrl, { timeout: 15000 });
  await waitForPageReady(page);
}

async function createScenario(client: Client): Promise<Scenario> {
  const runId = `e2e-cancel-booking-${Date.now()}`;
  const usedSlots = new Set<string>();
  const primarySlot = await findAvailableSessionSlot(client, usedSlots, 3);
  const backupSlot = await findAvailableSessionSlot(client, usedSlots, 4);

  const sessionDate = primarySlot.date;
  const backupSessionDate = backupSlot.date;
  const cancelReason = `Cancelamento de teste ${runId}`;
  const locationName = `OM E2E Cancel ${runId}`;

  const userRes = await client.query<{
    id: string;
    full_name: string | null;
    war_name: string | null;
    saram: string | null;
  }>(
    `
      select id::text as id, full_name, war_name, saram
      from public.profiles
      where email = $1
      limit 1
    `,
    [userCredentials.email],
  );

  if (userRes.rowCount !== 1) {
    throw new Error("Usuario seed de E2E nao encontrado em public.profiles.");
  }

  const user = userRes.rows[0];
  const userDisplayName = user.war_name ?? user.full_name ?? userCredentials.email;

  await cleanupStaleE2eBookingsForUser(client, user.id);

  const activeSemesterRes = await client.query<{ semester: "1" | "2" }>(
    `
      select semester
      from public.bookings
      where user_id = $1::uuid
        and status = 'agendado'::booking_status
    `,
    [user.id],
  );

  const activeSemesters = new Set(activeSemesterRes.rows.map((row) => row.semester));
  const semester = (["1", "2"] as const).find(
    (candidate) => !activeSemesters.has(candidate),
  );

  if (!semester) {
    const reusableBookingRes = await client.query<{
      id: string;
      session_id: string;
      status: string;
      attendance_confirmed: boolean;
      result_details: unknown;
      metadata: unknown;
      test_date: string | null;
      pending_swaps: number;
      metadata_source: string | null;
    }>(
      `
        select
          b.id::text as id,
          b.session_id::text as session_id,
          b.status::text as status,
          b.attendance_confirmed,
          b.result_details,
          b.metadata,
          b.test_date::text as test_date,
          count(sr.id) filter (where sr.status = 'solicitado')::int as pending_swaps,
          b.metadata->>'source' as metadata_source
        from public.bookings b
        left join public.swap_requests sr
          on sr.booking_id = b.id
        where b.user_id = $1::uuid
          and b.status = 'agendado'::booking_status
        group by b.id
        order by b.created_at desc
      `,
      [user.id],
    );

    const reusableBooking = reusableBookingRes.rows.find(
      (row) => row.pending_swaps === 0,
    ) ??
      reusableBookingRes.rows.find(
        (row) =>
          row.metadata_source === "e2e-admin-booking-cancel",
      );

    if (!reusableBooking) {
      throw new Error(
        "Usuario seed nao possui semestre livre nem booking ativo reutilizavel sem swap pendente.",
      );
    }

    if (reusableBooking.pending_swaps > 0) {
      await client.query(
        `
          delete from public.swap_requests
          where booking_id = $1::uuid
            and status = 'solicitado'
        `,
        [reusableBooking.id],
      );
    }

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
          array['pista', 'barra']::text[],
          jsonb_build_object('source', 'e2e-admin-booking-cancel', 'run_id', $3::text)
        )
        returning id::text as id
      `,
      [locationName, `Endereco ${runId}`, runId],
    );

    const locationId = locationRes.rows[0]?.id;

    const sessionRes = await client.query<{ id: string }>(
      `
        insert into public.sessions (
          title,
          summary,
          date,
          period,
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
          21,
          'open'::session_status,
          $5::uuid,
          array[]::text[],
          jsonb_build_object('source', 'e2e-admin-booking-cancel', 'run_id', $6::text)
        )
        returning id::text as id
      `,
      [
        `Sessao E2E Cancelamento ${runId}`,
        "Sessao principal do teste de cancelamento administrativo.",
        sessionDate,
        primarySlot.period,
        locationId,
        runId,
      ],
    );

    const backupSessionRes = await client.query<{ id: string }>(
      `
        insert into public.sessions (
          title,
          summary,
          date,
          period,
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
          21,
          'open'::session_status,
          $5::uuid,
          array[]::text[],
          jsonb_build_object('source', 'e2e-admin-booking-cancel', 'run_id', $6::text)
        )
        returning id::text as id
      `,
      [
        `Sessao E2E Swap ${runId}`,
        "Sessao alternativa para swap pendente no teste de cancelamento.",
        backupSessionDate,
        backupSlot.period,
        locationId,
        runId,
      ],
    );

    const sessionId = sessionRes.rows[0]?.id;
    const backupSessionId = backupSessionRes.rows[0]?.id;

    await client.query(
      `
        update public.bookings
        set session_id = $1::uuid,
            test_date = $2::date,
            attendance_confirmed = false,
            result_details = null,
            metadata = jsonb_build_object(
              'source', 'e2e-admin-booking-cancel',
              'run_id', $3::text,
              'reused_booking', true
            ),
            updated_at = now()
        where id = $4::uuid
      `,
      [sessionId, sessionDate, runId, reusableBooking.id],
    );

    const swapRes = await client.query<{ id: string }>(
      `
        insert into public.swap_requests (
          booking_id,
          requested_by,
          new_session_id,
          reason,
          status
        )
        values (
          $1::uuid,
          $2::uuid,
          $3::uuid,
          $4,
          'solicitado'::swap_status
        )
        returning id::text as id
      `,
      [
        reusableBooking.id,
        user.id,
        backupSessionId,
        `Swap pendente de teste ${runId}`,
      ],
    );

    return {
      locationId,
      locationName,
      sessionId,
      backupSessionId,
      bookingId: reusableBooking.id,
      swapRequestId: swapRes.rows[0]?.id,
      userId: user.id,
      userDisplayName,
      userSaram: user.saram,
      cancelReason,
      reusedBooking: true,
      originalBooking: {
        sessionId: reusableBooking.session_id,
        status: reusableBooking.status,
        attendanceConfirmed: reusableBooking.attendance_confirmed,
        resultDetails: reusableBooking.result_details,
        metadata: reusableBooking.metadata,
        testDate: reusableBooking.test_date,
      },
    };
  }

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
        array['pista', 'barra']::text[],
        jsonb_build_object('source', 'e2e-admin-booking-cancel', 'run_id', $3::text)
      )
      returning id::text as id
    `,
    [locationName, `Endereco ${runId}`, runId],
  );

  const locationId = locationRes.rows[0]?.id;

  const sessionRes = await client.query<{ id: string }>(
    `
      insert into public.sessions (
        title,
        summary,
        date,
        period,
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
          21,
          'open'::session_status,
          $5::uuid,
          array[]::text[],
          jsonb_build_object('source', 'e2e-admin-booking-cancel', 'run_id', $6::text)
        )
        returning id::text as id
      `,
      [
        `Sessao E2E Cancelamento ${runId}`,
        "Sessao principal do teste de cancelamento administrativo.",
        sessionDate,
        primarySlot.period,
        locationId,
        runId,
      ],
  );

  const backupSessionRes = await client.query<{ id: string }>(
    `
      insert into public.sessions (
        title,
        summary,
        date,
        period,
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
          21,
          'open'::session_status,
          $5::uuid,
          array[]::text[],
          jsonb_build_object('source', 'e2e-admin-booking-cancel', 'run_id', $6::text)
        )
        returning id::text as id
      `,
      [
        `Sessao E2E Swap ${runId}`,
        "Sessao alternativa para swap pendente no teste de cancelamento.",
        backupSessionDate,
        backupSlot.period,
        locationId,
        runId,
      ],
  );

  const sessionId = sessionRes.rows[0]?.id;
  const backupSessionId = backupSessionRes.rows[0]?.id;

  const existingSemesterBookingRes = await client.query<{
    id: string;
    session_id: string;
    status: string;
    attendance_confirmed: boolean;
    result_details: unknown;
    metadata: unknown;
    test_date: string | null;
  }>(
    `
      select
        b.id::text as id,
        b.session_id::text as session_id,
        b.status::text as status,
        b.attendance_confirmed,
        b.result_details,
        b.metadata,
        b.test_date::text as test_date
      from public.bookings b
      where b.user_id = $1::uuid
        and b.semester = $2::semester_type
      order by b.created_at desc
      limit 1
    `,
    [user.id, semester],
  );

  let bookingId: string;
  let reusedBooking = false;
  let originalBooking: Scenario["originalBooking"] = null;

  const existingSemesterBooking = existingSemesterBookingRes.rows[0];

  if (existingSemesterBooking) {
    reusedBooking = true;
    originalBooking = {
      sessionId: existingSemesterBooking.session_id,
      status: existingSemesterBooking.status,
      attendanceConfirmed: existingSemesterBooking.attendance_confirmed,
      resultDetails: existingSemesterBooking.result_details,
      metadata: existingSemesterBooking.metadata,
      testDate: existingSemesterBooking.test_date,
    };

    await client.query(
      `
        update public.bookings
        set session_id = $1::uuid,
            status = 'agendado'::booking_status,
            attendance_confirmed = false,
            result_details = null,
            metadata = jsonb_build_object(
              'source', 'e2e-admin-booking-cancel',
              'run_id', $2::text,
              'reused_booking', true
            ),
            test_date = $3::date,
            updated_at = now()
        where id = $4::uuid
      `,
      [sessionId, runId, sessionDate, existingSemesterBooking.id],
    );

    bookingId = existingSemesterBooking.id;
  } else {
    const bookingRes = await client.query<{ id: string }>(
      `
        insert into public.bookings (
          user_id,
          session_id,
          status,
          semester,
          attendance_confirmed,
          result_details,
          metadata,
          test_date
        )
        values (
          $1::uuid,
          $2::uuid,
          'agendado'::booking_status,
          $3::semester_type,
          false,
          null,
          jsonb_build_object('source', 'e2e-admin-booking-cancel', 'run_id', $4::text),
          $5::date
        )
        returning id::text as id
      `,
      [user.id, sessionId, semester, runId, sessionDate],
    );

    bookingId = bookingRes.rows[0]?.id;
  }

  const swapRes = await client.query<{ id: string }>(
    `
      insert into public.swap_requests (
        booking_id,
        requested_by,
        new_session_id,
        reason,
        status
      )
      values (
        $1::uuid,
        $2::uuid,
        $3::uuid,
        $4,
        'solicitado'::swap_status
      )
      returning id::text as id
    `,
    [
      bookingId,
      user.id,
      backupSessionId,
      `Swap pendente de teste ${runId}`,
    ],
  );

  return {
    locationId,
    locationName,
    sessionId,
    backupSessionId,
    bookingId,
    swapRequestId: swapRes.rows[0]?.id,
    userId: user.id,
    userDisplayName,
    userSaram: user.saram,
    cancelReason,
    reusedBooking,
    originalBooking,
  };
}

async function cleanupScenario(client: Client, scenario: Scenario | null) {
  if (!scenario) return;

  const resultDetailsJson =
    scenario.originalBooking?.resultDetails == null
      ? null
      : JSON.stringify(scenario.originalBooking.resultDetails);
  const metadataJson =
    scenario.originalBooking?.metadata == null
      ? null
      : JSON.stringify(scenario.originalBooking.metadata);

  await client.query(
    `
      delete from public.swap_requests
      where id = $1::uuid
         or booking_id = $2::uuid
    `,
    [scenario.swapRequestId, scenario.bookingId],
  );

  await client.query(
    `
      delete from public.user_notifications
      where recipient_user_id = $1::uuid
        and type = 'booking_cancelled'
        and metadata->>'booking_id' = $2
    `,
    [scenario.userId, scenario.bookingId],
  );

  await client.query(
    scenario.reusedBooking
      ? `
          update public.bookings
          set session_id = $1::uuid,
              status = $2::booking_status,
              attendance_confirmed = $3,
              result_details = $4::jsonb,
              metadata = $5::jsonb,
              test_date = $6::date,
              updated_at = now()
          where id = $7::uuid
        `
      : `
          delete from public.bookings
          where id = $1::uuid
        `,
    scenario.reusedBooking
      ? [
          scenario.originalBooking?.sessionId,
          scenario.originalBooking?.status,
          scenario.originalBooking?.attendanceConfirmed,
          resultDetailsJson,
          metadataJson,
          scenario.originalBooking?.testDate,
          scenario.bookingId,
        ]
      : [scenario.bookingId],
  );

  await client.query(
    `
      delete from public.sessions
      where id in ($1::uuid, $2::uuid)
    `,
    [scenario.sessionId, scenario.backupSessionId],
  );

  await client.query(
    `
      delete from public.locations
      where id = $1::uuid
    `,
    [scenario.locationId],
  );
}

async function fetchBookingAndSwapState(client: Client, bookingId: string) {
  const result = await client.query<{
    booking_status: string;
    cancellation_source: string | null;
    cancellation_reason: string | null;
    swap_status: string | null;
  }>(
    `
      select
        b.status::text as booking_status,
        b.metadata->>'cancellation_source' as cancellation_source,
        b.metadata->>'cancellation_reason' as cancellation_reason,
        (
          select sr.status::text
          from public.swap_requests sr
          where sr.booking_id = b.id
          order by sr.created_at desc
          limit 1
        ) as swap_status
      from public.bookings b
      where b.id = $1::uuid
    `,
    [bookingId],
  );

  return result.rows[0] ?? null;
}

test.describe("Fluxo E2E: cancelamento administrativo de booking", () => {
  test("admin cancela booking com motivo, limpa swap pendente e reflete no dashboard/historico do militar", async ({
    browser,
  }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop-1440",
      "Fluxo estabilizado sobre a tabela desktop da gestão de turma.",
    );
    test.slow();

    const client = new Client({ connectionString: requireEnv("DATABASE_URL") });
    await client.connect();

    let scenario: Scenario | null = null;
    const adminContext = await browser.newContext();
    const userContext = await browser.newContext();

    try {
      scenario = await createScenario(client);

      const adminPage = await adminContext.newPage();
      const adminPageErrors: string[] = [];
      const adminRequestFailures: string[] = [];
      adminPage.on("pageerror", (error) => {
        adminPageErrors.push(error.message);
      });
      adminPage.on("requestfailed", (request) => {
        adminRequestFailures.push(
          `${request.method()} ${request.url()} :: ${request.failure()?.errorText ?? "erro_desconhecido"}`,
        );
      });
      await login(
        adminPage,
        adminCredentials.email,
        adminCredentials.password,
        /\/app(\/admin)?/,
      );

      await adminPage.goto(`/app/turmas/${scenario.sessionId}/agendamentos`);
      await waitForPageReady(adminPage);
      if (adminPageErrors.length > 0) {
        throw new Error(
          `Falha de renderizacao na tela admin: ${adminPageErrors.join(" | ")}`,
        );
      }

      const userIdentifier = scenario.userSaram ?? scenario.userDisplayName;
      const adminRow = adminPage.locator("tbody tr").filter({
        hasText: userIdentifier,
      });

      await expect(adminRow).toHaveCount(1, { timeout: 15000 });
      await expect(adminRow).toContainText(/Agendado/i, { timeout: 10000 });

      const cancelRpcPromise = adminPage.waitForResponse(
        (response) =>
          response.request().method() === "POST" &&
          response.url().includes("/rest/v1/rpc/cancel_booking"),
        {
          timeout: 10000,
        },
      );

      const button = adminRow.getByRole("button", { name: /^Cancelar$/ });
      await expect(button).toBeVisible({ timeout: 10000 });

      await adminPage.evaluate((reason) => {
        const promptCalls: string[] = [];
        Object.defineProperty(window, "__cancelPromptCalls", {
          value: promptCalls,
          configurable: true,
        });

        window.prompt = (message?: string) => {
          promptCalls.push(message ?? "");
          return reason;
        };
      }, scenario.cancelReason);

      await button.click();
      await expect
        .poll(
          async () =>
            adminPage.evaluate(
              () =>
                ((window as typeof window & { __cancelPromptCalls?: string[] })
                  .__cancelPromptCalls ?? []).length,
            ),
          { timeout: 5000 },
        )
        .toBe(1);

      const cancelRpcResponse = await cancelRpcPromise;
      const cancelRpcStatus = cancelRpcResponse.status();
      const cancelRpcBody = await cancelRpcResponse.text();

      if (cancelRpcStatus >= 400) {
        throw new Error(
          `RPC cancel_booking retornou erro HTTP ${cancelRpcStatus}: ${cancelRpcBody}${
            adminRequestFailures.length > 0
              ? ` | requestfailed: ${adminRequestFailures.join(" | ")}`
              : ""
          }`,
        );
      }

      const cancelRpcPayload = JSON.parse(cancelRpcBody) as
        | Array<{ success?: boolean; error?: string | null }>
        | { success?: boolean; error?: string | null };
      const cancelRpcResult = Array.isArray(cancelRpcPayload)
        ? cancelRpcPayload[0]
        : cancelRpcPayload;

      if (!cancelRpcResult?.success) {
        throw new Error(
          `RPC cancel_booking retornou sucesso=false: ${cancelRpcBody}`,
        );
      }

      await expect
        .poll(async () => {
          const state = await fetchBookingAndSwapState(client, scenario!.bookingId);
          return state
            ? `${state.booking_status}|${state.swap_status}|${state.cancellation_source}|${state.cancellation_reason}`
            : null;
        }, { timeout: 15000 })
        .toBe(
          `cancelado|cancelado|admin|${scenario.cancelReason}`,
        );

      await expect(adminRow).toContainText(/Cancelado/i, {
        timeout: 10000,
      });
      await expect(
        adminRow.getByRole("button", { name: /^Cancelar$/ }),
      ).toHaveCount(0);

      const userPage = await userContext.newPage();
      await login(
        userPage,
        userCredentials.email,
        userCredentials.password,
        /\/app(\/)?$/,
      );

      await expect(userPage.getByTestId("operational-dashboard")).toBeVisible({
        timeout: 15000,
      });
      await expect(
        userPage.getByText("Nenhum agendamento pendente"),
      ).toBeVisible({ timeout: 15000 });
      await expect(userPage.getByText("Sem agendamento ativo")).toBeVisible({
        timeout: 15000,
      });

      await userPage.goto("/app/resultados");
      await waitForPageReady(userPage);

      const historyRow = userPage.locator("tr").filter({
        hasText: scenario.locationName,
      });

      await expect(historyRow).toHaveCount(1, { timeout: 15000 });
      await expect(
        historyRow.getByText("Cancelado pela coordenação"),
      ).toBeVisible({ timeout: 15000 });
    } finally {
      await adminContext.close();
      await userContext.close();
      await cleanupScenario(client, scenario);
      await client.end();
    }
  });
});
