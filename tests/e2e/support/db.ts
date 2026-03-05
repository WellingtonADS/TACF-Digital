import dotenv from "dotenv";
import { Client } from "pg";

dotenv.config();

function resolveConnectionString(): string | null {
  if (process.env.DATABASE_URL) return process.env.DATABASE_URL;
  if (process.env.SUPABASE_DB_URL) return process.env.SUPABASE_DB_URL;

  if (process.env.PGHOST) {
    const host = process.env.PGHOST;
    const port = process.env.PGPORT || "5432";
    const user = process.env.PGUSER || process.env.USER || "";
    const password = process.env.PGPASSWORD || "";
    const database = process.env.PGDATABASE || "";
    return `postgresql://${user}:${encodeURIComponent(password)}@${host}:${port}/${database}`;
  }

  return null;
}

const connectionString = resolveConnectionString();

export function hasDbConnection(): boolean {
  return Boolean(connectionString);
}

async function withClient<T>(fn: (client: Client) => Promise<T>): Promise<T> {
  if (!connectionString) {
    throw new Error(
      "Conexão de banco ausente: informe DATABASE_URL, SUPABASE_DB_URL ou PG* no .env.",
    );
  }

  const client = new Client({ connectionString });
  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.end();
  }
}

export type SchedulingTableMap = {
  bookingsExists: boolean;
  sessionsExists: boolean;
  locationsExists: boolean;
  schedulesExists: boolean;
};

export async function mapSchedulingTables(): Promise<SchedulingTableMap> {
  return withClient(async (client) => {
    const { rows } = await client.query<{
      table_name: string;
    }>(
      `
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name IN ('bookings', 'sessions', 'locations', 'location_schedules')
      `,
    );

    const set = new Set(rows.map((row) => row.table_name));

    return {
      bookingsExists: set.has("bookings"),
      sessionsExists: set.has("sessions"),
      locationsExists: set.has("locations"),
      schedulesExists: set.has("location_schedules"),
    };
  });
}

export type AvailableSessionRow = {
  session_id: string;
  date: string;
  period: string;
  max_capacity: number;
  occupied_count: number;
  available_count: number;
};

export async function getUserIdByEmail(email: string): Promise<string | null> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `SELECT id::text FROM auth.users WHERE lower(email) = lower($1) LIMIT 1`,
      [email],
    );

    return rows[0]?.id ?? null;
  });
}

export async function listAvailableSessionsForUser(
  userId?: string,
): Promise<AvailableSessionRow[]> {
  return withClient(async (client) => {
    const hasUserFilter = Boolean(userId);

    const { rows } = await client.query<AvailableSessionRow>(
      hasUserFilter
        ? `
      SELECT
        s.id::text AS session_id,
        s.date::text AS date,
        s.period::text AS period,
        s.max_capacity,
        COUNT(b.id)::int AS occupied_count,
        (s.max_capacity - COUNT(b.id))::int AS available_count
      FROM public.sessions s
      LEFT JOIN public.bookings b
        ON b.session_id = s.id
       AND b.status = 'confirmed'
      WHERE s.date >= CURRENT_DATE
        AND COALESCE(s.status::text, 'open') = 'open'
        AND NOT EXISTS (
          SELECT 1
          FROM public.bookings ub
          WHERE ub.user_id = $1::uuid
            AND ub.session_id = s.id
        )
      GROUP BY s.id, s.date, s.period, s.max_capacity
      HAVING (s.max_capacity - COUNT(b.id)) > 0
      ORDER BY s.date ASC, s.period ASC
      LIMIT 20
      `
        : `
      SELECT
        s.id::text AS session_id,
        s.date::text AS date,
        s.period::text AS period,
        s.max_capacity,
        COUNT(b.id)::int AS occupied_count,
        (s.max_capacity - COUNT(b.id))::int AS available_count
      FROM public.sessions s
      LEFT JOIN public.bookings b
        ON b.session_id = s.id
       AND b.status = 'confirmed'
      WHERE s.date >= CURRENT_DATE
        AND COALESCE(s.status::text, 'open') = 'open'
      GROUP BY s.id, s.date, s.period, s.max_capacity
      HAVING (s.max_capacity - COUNT(b.id)) > 0
      ORDER BY s.date ASC, s.period ASC
      LIMIT 20
      `,
      hasUserFilter ? [userId] : [],
    );

    return rows;
  });
}

export type PersistedTicketRecord = {
  bookingId: string;
  orderNumber: string;
  status: string;
  sessionId: string;
  sessionDate: string;
  sessionPeriod: string;
  militaryName: string;
  saram: string;
  locationName: string | null;
};

export async function findBookingByOrderNumber(
  orderNumber: string,
): Promise<PersistedTicketRecord | null> {
  return withClient(async (client) => {
    const { rows } = await client.query<{
      booking_id: string;
      order_number: string;
      status: string;
      session_id: string;
      session_date: string;
      session_period: string;
      military_name: string;
      saram: string;
      location_name: string | null;
    }>(
      `
      SELECT
        b.id::text AS booking_id,
        b.order_number,
        b.status::text AS status,
        b.session_id::text AS session_id,
        s.date::text AS session_date,
        s.period::text AS session_period,
        COALESCE(p.war_name, p.full_name, '') AS military_name,
        COALESCE(p.saram, '') AS saram,
        l.name AS location_name
      FROM public.bookings b
      INNER JOIN public.sessions s ON s.id = b.session_id
      INNER JOIN public.profiles p ON p.id = b.user_id
      LEFT JOIN public.locations l ON l.id = s.location_id
      WHERE b.order_number = $1
      ORDER BY b.created_at DESC
      LIMIT 1
      `,
      [orderNumber],
    );

    const row = rows[0];
    if (!row) return null;

    return {
      bookingId: row.booking_id,
      orderNumber: row.order_number,
      status: row.status,
      sessionId: row.session_id,
      sessionDate: row.session_date,
      sessionPeriod: row.session_period,
      militaryName: row.military_name,
      saram: row.saram,
      locationName: row.location_name,
    };
  });
}

export async function deleteBookingById(bookingId: string): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `DELETE FROM public.bookings WHERE id = $1::uuid`,
      [bookingId],
    );
    return res.rowCount ?? 0;
  });
}

export async function deleteBookingsByUserId(userId: string): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `DELETE FROM public.bookings WHERE user_id = $1::uuid`,
      [userId],
    );
    return res.rowCount ?? 0;
  });
}

export type EphemeralSession = {
  sessionId: string;
  date: string;
  period: "morning" | "afternoon";
};

function toIsoDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

export async function createEphemeralOpenSession(): Promise<EphemeralSession> {
  return withClient(async (client) => {
    const periods: Array<"morning" | "afternoon"> = ["morning", "afternoon"];

    for (let offset = 14; offset <= 45; offset += 1) {
      const date = toIsoDate(offset);
      for (const period of periods) {
        try {
          const { rows } = await client.query<{ id: string }>(
            `
            INSERT INTO public.sessions (date, period, max_capacity, status, applicators)
            VALUES ($1::date, $2::session_period, 21, 'open'::session_status, ARRAY[]::text[])
            RETURNING id::text AS id
            `,
            [date, period],
          );

          const id = rows[0]?.id;
          if (id) {
            return {
              sessionId: id,
              date,
              period,
            };
          }
        } catch {
          continue;
        }
      }
    }

    throw new Error(
      "Não foi possível criar sessão temporária para o E2E (conflitos de data/período ou permissão).",
    );
  });
}

export async function deleteSessionById(sessionId: string): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `DELETE FROM public.sessions WHERE id = $1::uuid`,
      [sessionId],
    );
    return res.rowCount ?? 0;
  });
}

export async function getBookingResultDetails(
  bookingId: string,
): Promise<string | null> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ result_details: string | null }>(
      `
      SELECT
        CASE
          WHEN result_details IS NULL THEN NULL
          WHEN jsonb_typeof(result_details) = 'string'
            THEN trim(both '"' from result_details::text)
          ELSE result_details::text
        END AS result_details
      FROM public.bookings
      WHERE id = $1::uuid
      `,
      [bookingId],
    );
    return rows[0]?.result_details ?? null;
  });
}

export async function updateBookingResultDetails(
  bookingId: string,
  resultDetails: string | null,
): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `
      UPDATE public.bookings
      SET result_details = CASE
        WHEN $2::text IS NULL THEN NULL
        ELSE to_jsonb($2::text)
      END
      WHERE id = $1::uuid
      `,
      [bookingId, resultDetails],
    );
    return res.rowCount ?? 0;
  });
}

export type SessionWithStatus = {
  session_id: string;
  date: string;
  period: "morning" | "afternoon";
  pending_count: number;
};

export async function listSessionsWithPendingBookings(): Promise<
  SessionWithStatus[]
> {
  return withClient(async (client) => {
    const { rows } = await client.query<SessionWithStatus>(
      `
      SELECT
        s.id::text AS session_id,
        s.date::text AS date,
        s.period::session_period AS period,
        COUNT(b.id) FILTER (WHERE b.result_details IS NULL)::int AS pending_count
      FROM public.sessions s
      LEFT JOIN public.bookings b ON b.session_id = s.id
      WHERE s.date >= CURRENT_DATE
        AND s.status = 'open'
      GROUP BY s.id, s.date, s.period
      HAVING COUNT(b.id) FILTER (WHERE b.result_details IS NULL) > 0
      ORDER BY s.date ASC, s.period ASC
      LIMIT 20
      `,
    );
    return rows;
  });
}

export type PendingBooking = {
  booking_id: string;
  user_id: string;
  full_name: string;
  war_name: string | null;
  saram: string | null;
};

export async function listPendingBookingsInSession(
  sessionId: string,
): Promise<PendingBooking[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<PendingBooking>(
      `
      SELECT
        b.id::text AS booking_id,
        b.user_id::text AS user_id,
        COALESCE(
          NULLIF(TRIM(p.full_name::text), ''),
          NULLIF(TRIM(p.war_name::text), ''),
          NULLIF(TRIM(p.saram::text), ''),
          p.id::text
        ) AS full_name,
        NULLIF(TRIM(p.war_name::text), '') AS war_name,
        NULLIF(TRIM(p.saram::text), '') AS saram
      FROM public.bookings b
      INNER JOIN public.profiles p ON p.id = b.user_id
      WHERE b.session_id = $1::uuid
        AND b.result_details IS NULL
      ORDER BY p.full_name ASC
      LIMIT 10
      `,
      [sessionId],
    );
    return rows;
  });
}

export async function createPendingBookingsForSession(
  sessionId: string,
  count: number = 3,
): Promise<number> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ id: string }>(
      `
      SELECT id::text FROM public.profiles
      WHERE NOT EXISTS (
        SELECT 1 FROM public.bookings
        WHERE session_id = $1::uuid AND user_id = profiles.id
      )
        AND COALESCE(
          NULLIF(TRIM(full_name::text), ''),
          NULLIF(TRIM(war_name::text), ''),
          NULLIF(TRIM(saram::text), '')
        ) IS NOT NULL
      LIMIT $2
      `,
      [sessionId, count],
    );

    const userIds = rows.map((r) => r.id);
    let created = 0;

    for (const userId of userIds) {
      const res = await client.query(
        `
        INSERT INTO public.bookings (
          session_id,
          user_id,
          status,
          semester,
          result_details,
          test_date
        )
        SELECT
          s.id,
          $2::uuid,
          'confirmed'::booking_status,
          CASE
            WHEN EXTRACT(MONTH FROM s.date) <= 6 THEN '1'::semester_type
            ELSE '2'::semester_type
          END,
          NULL,
          s.date
        FROM public.sessions s
        WHERE s.id = $1::uuid
        `,
        [sessionId, userId],
      );
      created += res.rowCount ?? 0;
    }

    return created;
  });
}

export type PendingRescheduleRequest = {
  booking_id: string;
  session_id: string;
  military_name: string;
  saram: string;
  original_date: string;
  requested_date: string;
  reason: string;
};

export async function createEphemeralPendingRescheduleRequest(): Promise<{
  sessionId: string;
  request: PendingRescheduleRequest;
}> {
  const ephemeral = await createEphemeralOpenSession();
  const sessionId = ephemeral.sessionId;

  const created = await createPendingBookingsForSession(sessionId, 1);
  if (created === 0) {
    throw new Error(
      "Não foi possível criar booking para cenário de reagendamento.",
    );
  }

  return withClient(async (client) => {
    const requestedDate = (() => {
      const date = new Date(ephemeral.date);
      date.setDate(date.getDate() + 7);
      return date.toISOString().split("T")[0];
    })();

    const reason = `E2E REAGENDAMENTO ${Date.now()}`;

    const { rows: targetRows } = await client.query<{
      booking_id: string;
      user_id: string;
      military_name: string;
      saram: string;
    }>(
      `
      SELECT
        b.id::text AS booking_id,
        b.user_id::text AS user_id,
        COALESCE(
          NULLIF(TRIM(p.war_name::text), ''),
          NULLIF(TRIM(p.full_name::text), ''),
          p.id::text
        ) AS military_name,
        COALESCE(NULLIF(TRIM(p.saram::text), ''), '000000') AS saram
      FROM public.bookings b
      INNER JOIN public.profiles p ON p.id = b.user_id
      WHERE b.session_id = $1::uuid
      ORDER BY b.created_at DESC
      LIMIT 1
      `,
      [sessionId],
    );

    const target = targetRows[0];
    if (!target) {
      throw new Error("Booking alvo não encontrado para reagendamento.");
    }

    await client.query(
      `
      UPDATE public.bookings
      SET
        status = 'pending_swap'::booking_status,
        swap_reason = $2::text,
        test_date = $3::date
      WHERE id = $1::uuid
      `,
      [target.booking_id, reason, requestedDate],
    );

    return {
      sessionId,
      request: {
        booking_id: target.booking_id,
        session_id: sessionId,
        military_name: target.military_name,
        saram: target.saram,
        original_date: ephemeral.date,
        requested_date: requestedDate,
        reason,
      },
    };
  });
}

export async function getRescheduleRequestState(bookingId: string): Promise<{
  status: string | null;
  requested_date: string | null;
  reason: string | null;
}> {
  return withClient(async (client) => {
    const { rows } = await client.query<{
      status: string | null;
      requested_date: string | null;
      reason: string | null;
    }>(
      `
      SELECT
        status::text AS status,
        test_date::text AS requested_date,
        swap_reason AS reason
      FROM public.bookings
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [bookingId],
    );

    return (
      rows[0] ?? {
        status: null,
        requested_date: null,
        reason: null,
      }
    );
  });
}

export type PersonnelSearchTarget = {
  user_id: string;
  full_name: string;
  display_name: string;
  war_name: string | null;
  saram: string;
  status: "APTO" | "INAPTO" | "VENCIDO";
};

export async function getPersonnelSearchTargets(): Promise<{
  byName: PersonnelSearchTarget;
  byId: PersonnelSearchTarget;
}> {
  return withClient(async (client) => {
    const { rows } = await client.query<PersonnelSearchTarget>(
      `
      WITH latest_booking AS (
        SELECT DISTINCT ON (b.user_id)
          b.user_id,
          COALESCE(b.test_date::timestamp, b.created_at)::date AS last_date,
          b.score AS last_score
        FROM public.bookings b
        ORDER BY b.user_id, COALESCE(b.test_date::timestamp, b.created_at) DESC
      )
      SELECT
        p.id::text AS user_id,
        COALESCE(NULLIF(TRIM(p.full_name::text), ''), p.id::text) AS full_name,
        COALESCE(
          NULLIF(TRIM(p.war_name::text), ''),
          NULLIF(TRIM(p.full_name::text), ''),
          p.id::text
        ) AS display_name,
        NULLIF(TRIM(p.war_name::text), '') AS war_name,
        TRIM(p.saram::text) AS saram,
        CASE
          WHEN COALESCE(p.active, false) = false THEN 'INAPTO'
          WHEN lb.last_date IS NULL THEN 'INAPTO'
          WHEN (CURRENT_DATE - lb.last_date) > 365 THEN 'VENCIDO'
          WHEN lb.last_score IS NULL THEN 'INAPTO'
          ELSE 'APTO'
        END::text AS status
      FROM public.profiles p
      LEFT JOIN latest_booking lb ON lb.user_id = p.id
      WHERE COALESCE(NULLIF(TRIM(p.full_name::text), ''), NULLIF(TRIM(p.saram::text), '')) IS NOT NULL
        AND NULLIF(TRIM(p.saram::text), '') IS NOT NULL
      ORDER BY
        CASE
          WHEN COALESCE(p.active, false) = true THEN 0
          ELSE 1
        END,
        p.created_at DESC
      LIMIT 30
      `,
    );

    if (rows.length === 0) {
      throw new Error(
        "Nenhum militar disponível no banco para cenário de efetivo.",
      );
    }

    const byName = rows[0];
    const byId = rows.find((row) => row.user_id !== byName.user_id) ?? byName;

    return { byName, byId };
  });
}

export async function getPersonnelBySaram(
  saram: string,
): Promise<PersonnelSearchTarget | null> {
  return withClient(async (client) => {
    const { rows } = await client.query<PersonnelSearchTarget>(
      `
      WITH latest_booking AS (
        SELECT DISTINCT ON (b.user_id)
          b.user_id,
          COALESCE(b.test_date::timestamp, b.created_at)::date AS last_date,
          b.score AS last_score
        FROM public.bookings b
        ORDER BY b.user_id, COALESCE(b.test_date::timestamp, b.created_at) DESC
      )
      SELECT
        p.id::text AS user_id,
        COALESCE(NULLIF(TRIM(p.full_name::text), ''), p.id::text) AS full_name,
        COALESCE(
          NULLIF(TRIM(p.war_name::text), ''),
          NULLIF(TRIM(p.full_name::text), ''),
          p.id::text
        ) AS display_name,
        NULLIF(TRIM(p.war_name::text), '') AS war_name,
        TRIM(p.saram::text) AS saram,
        CASE
          WHEN COALESCE(p.active, false) = false THEN 'INAPTO'
          WHEN lb.last_date IS NULL THEN 'INAPTO'
          WHEN (CURRENT_DATE - lb.last_date) > 365 THEN 'VENCIDO'
          WHEN lb.last_score IS NULL THEN 'INAPTO'
          ELSE 'APTO'
        END::text AS status
      FROM public.profiles p
      LEFT JOIN latest_booking lb ON lb.user_id = p.id
      WHERE NULLIF(TRIM(p.saram::text), '') = $1
      LIMIT 1
      `,
      [saram],
    );

    return rows[0] ?? null;
  });
}

export type AuditLogRecord = {
  id: string;
  action: string | null;
  entity: string | null;
  user_id: string | null;
  user_name: string | null;
  details: string | null;
  created_at: string | null;
};

export async function listRecentAuditLogs(
  minutes: number = 30,
): Promise<AuditLogRecord[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<AuditLogRecord>(
      `
      SELECT
        id::text,
        action,
        entity,
        user_id::text,
        user_name,
        details,
        created_at::text
      FROM public.audit_logs
      WHERE created_at >= (NOW() - make_interval(mins => $1::int))
      ORDER BY created_at DESC
      LIMIT 500
      `,
      [minutes],
    );
    return rows;
  });
}

export async function waitForRecentRelevantAuditLog(options?: {
  minutes?: number;
  timeoutMs?: number;
  pollIntervalMs?: number;
}): Promise<AuditLogRecord | null> {
  const minutes = options?.minutes ?? 30;
  const timeoutMs = options?.timeoutMs ?? 60000;
  const pollIntervalMs = options?.pollIntervalMs ?? 5000;

  const startedAt = Date.now();

  while (Date.now() - startedAt < timeoutMs) {
    const logs = await listRecentAuditLogs(minutes);

    const found = logs.find((log) => {
      const action = (log.action ?? "").toUpperCase();
      const entity = (log.entity ?? "").toLowerCase();
      const hasRelevantAction =
        action.includes("UPDATE") ||
        action.includes("INSERT") ||
        action.includes("CREATE") ||
        action.includes("DELETE");
      const hasRelevantEntity =
        entity.includes("book") ||
        entity.includes("agend") ||
        entity.includes("result") ||
        entity.includes("profile") ||
        entity.includes("session");

      return hasRelevantAction && hasRelevantEntity;
    });

    if (found) return found;

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  return null;
}

export async function createEphemeralAuditLogEntry(input?: {
  action?: string;
  entity?: string;
  userName?: string;
  details?: string;
}): Promise<AuditLogRecord> {
  return withClient(async (client) => {
    const { rows } = await client.query<AuditLogRecord>(
      `
      INSERT INTO public.audit_logs (
        action,
        entity,
        user_name,
        details,
        created_at
      )
      VALUES (
        $1::text,
        $2::text,
        $3::text,
        $4::text,
        NOW()
      )
      RETURNING
        id::text,
        action,
        entity,
        user_id::text,
        user_name,
        details,
        created_at::text
      `,
      [
        input?.action ?? "UPDATE_BOOKING_STATUS",
        input?.entity ?? "bookings",
        input?.userName ?? "E2E Admin",
        input?.details ?? JSON.stringify({ source: "e2e", type: "audit-test" }),
      ],
    );

    const row = rows[0];
    if (!row) {
      throw new Error("Falha ao criar log de auditoria temporário.");
    }
    return row;
  });
}

export async function deleteAuditLogById(id: string): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `DELETE FROM public.audit_logs WHERE id = $1::uuid`,
      [id],
    );
    return res.rowCount ?? 0;
  });
}

export type UserProfileSnapshot = {
  id: string;
  full_name: string | null;
  war_name: string | null;
  saram: string | null;
  sector: string | null;
  phone_number: string | null;
  email: string | null;
};

export async function getUserProfileByEmail(
  email: string,
): Promise<UserProfileSnapshot | null> {
  return withClient(async (client) => {
    const { rows } = await client.query<UserProfileSnapshot>(
      `
      SELECT
        p.id::text AS id,
        p.full_name,
        p.war_name,
        p.saram,
        p.sector,
        p.phone_number,
        p.email
      FROM public.profiles p
      WHERE LOWER(p.email) = LOWER($1)
      LIMIT 1
      `,
      [email],
    );

    return rows[0] ?? null;
  });
}

export async function updateUserPhoneById(
  userId: string,
  phoneNumber: string | null,
): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `
      UPDATE public.profiles
      SET phone_number = $2::text
      WHERE id = $1::uuid
      `,
      [userId, phoneNumber],
    );

    return res.rowCount ?? 0;
  });
}

export type E2ELocationSeed = {
  id: string;
  name: string;
  address: string;
  status: "active" | "maintenance" | "inactive";
  max_capacity: number;
};

export async function createE2ELocation(input?: {
  name?: string;
  address?: string;
  status?: "active" | "maintenance" | "inactive";
  maxCapacity?: number;
}): Promise<E2ELocationSeed> {
  return withClient(async (client) => {
    const now = Date.now();
    const name =
      input?.name ??
      `E2E Config Local ${new Date(now).toISOString().slice(0, 19)}`;
    const address = input?.address ?? `Base E2E ${now}`;
    const status = input?.status ?? "active";
    const maxCapacity = input?.maxCapacity ?? 30;

    const { rows } = await client.query<E2ELocationSeed>(
      `
      INSERT INTO public.locations (name, address, status, max_capacity, facilities)
      VALUES ($1::text, $2::text, $3::text, $4::int, ARRAY['Pista']::text[])
      RETURNING id::text, name, address, status, max_capacity
      `,
      [name, address, status, maxCapacity],
    );

    const row = rows[0];
    if (!row) {
      throw new Error("Falha ao criar location de apoio para E2E.");
    }
    return row;
  });
}

export type LocationScheduleSeed = {
  id: string;
  location_id: string;
  day_of_week: number;
  period: "morning" | "afternoon";
  start_time: string;
  is_active: boolean;
};

export async function upsertLocationSchedule(
  locationId: string,
  input: {
    dayOfWeek: number;
    period: "morning" | "afternoon";
    startTime: string;
    isActive: boolean;
  },
): Promise<LocationScheduleSeed> {
  return withClient(async (client) => {
    const { rows } = await client.query<LocationScheduleSeed>(
      `
      INSERT INTO public.location_schedules (
        location_id,
        day_of_week,
        period,
        start_time,
        is_active
      )
      VALUES ($1::uuid, $2::int, $3::session_period, $4::time, $5::boolean)
      ON CONFLICT (location_id, day_of_week, period)
      DO UPDATE SET
        start_time = EXCLUDED.start_time,
        is_active = EXCLUDED.is_active
      RETURNING id::text, location_id::text, day_of_week, period, start_time::text, is_active
      `,
      [
        locationId,
        input.dayOfWeek,
        input.period,
        input.startTime,
        input.isActive,
      ],
    );

    const row = rows[0];
    if (!row) {
      throw new Error("Falha ao upsert de horário de localização no E2E.");
    }

    return {
      ...row,
      start_time: row.start_time.slice(0, 5),
    };
  });
}

export async function listLocationSchedulesByLocationId(
  locationId: string,
): Promise<LocationScheduleSeed[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<LocationScheduleSeed>(
      `
      SELECT
        id::text,
        location_id::text,
        day_of_week,
        period,
        start_time::text,
        is_active
      FROM public.location_schedules
      WHERE location_id = $1::uuid
      ORDER BY day_of_week ASC, period ASC
      `,
      [locationId],
    );

    return rows.map((row) => ({
      ...row,
      start_time: row.start_time.slice(0, 5),
    }));
  });
}

function toIsoDateWithOffset(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

export type E2ESessionSeed = {
  id: string;
  location_id: string | null;
  date: string;
  period: "morning" | "afternoon";
  status: string | null;
};

export async function createE2ESessionForLocation(input: {
  locationId: string;
  preferredPeriod?: "morning" | "afternoon";
  minOffsetDays?: number;
  maxOffsetDays?: number;
  maxCapacity?: number;
  targetSemester?: "1" | "2";
}): Promise<E2ESessionSeed> {
  return withClient(async (client) => {
    const preferred = input.preferredPeriod ?? "morning";
    const periods: Array<"morning" | "afternoon"> =
      preferred === "morning"
        ? ["morning", "afternoon"]
        : ["afternoon", "morning"];

    const minOffset = input.minOffsetDays ?? 14;
    const maxOffset = input.maxOffsetDays ?? 260;
    const requestedCapacity = input.maxCapacity ?? 21;
    const maxCapacity = Math.max(8, Math.min(21, requestedCapacity));
    const targetSemester = input.targetSemester;

    for (let offset = minOffset; offset <= maxOffset; offset += 1) {
      const date = toIsoDateWithOffset(offset);
      if (targetSemester) {
        const month = Number(date.split("-")[1]);
        const semester = month <= 6 ? "1" : "2";
        if (semester !== targetSemester) continue;
      }

      for (const period of periods) {
        try {
          const { rows } = await client.query<E2ESessionSeed>(
            `
            INSERT INTO public.sessions (
              date,
              period,
              max_capacity,
              status,
              location_id,
              applicators
            )
            VALUES (
              $1::date,
              $2::session_period,
              $3::int,
              'open'::session_status,
              $4::uuid,
              ARRAY[]::text[]
            )
            RETURNING
              id::text,
              location_id::text,
              date::text,
              period,
              status::text
            `,
            [date, period, maxCapacity, input.locationId],
          );

          const row = rows[0];
          if (row) {
            return row;
          }
        } catch {
          continue;
        }
      }
    }

    throw new Error(
      "Não foi possível criar sessão de apoio para o cenário de configurações.",
    );
  });
}

export async function listConfirmedSemestersByUserId(
  userId: string,
): Promise<Array<"1" | "2">> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ semester: "1" | "2" }>(
      `
      SELECT DISTINCT semester::text AS semester
      FROM public.bookings
      WHERE user_id = $1::uuid
        AND status = 'confirmed'
        AND semester IS NOT NULL
      `,
      [userId],
    );

    return rows
      .map((row) => row.semester)
      .filter(
        (semester): semester is "1" | "2" =>
          semester === "1" || semester === "2",
      );
  });
}

export async function getSessionById(
  sessionId: string,
): Promise<E2ESessionSeed | null> {
  return withClient(async (client) => {
    const { rows } = await client.query<E2ESessionSeed>(
      `
      SELECT
        id::text,
        location_id::text,
        date::text,
        period,
        status::text
      FROM public.sessions
      WHERE id = $1::uuid
      LIMIT 1
      `,
      [sessionId],
    );

    return rows[0] ?? null;
  });
}

export async function deleteBookingsBySessionAndUser(
  sessionId: string,
  userId: string,
): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `
      DELETE FROM public.bookings
      WHERE session_id = $1::uuid
        AND user_id = $2::uuid
      `,
      [sessionId, userId],
    );

    return res.rowCount ?? 0;
  });
}

export async function deleteLocationSchedulesByLocationId(
  locationId: string,
): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `DELETE FROM public.location_schedules WHERE location_id = $1::uuid`,
      [locationId],
    );

    return res.rowCount ?? 0;
  });
}

export async function deleteLocationById(locationId: string): Promise<number> {
  return withClient(async (client) => {
    const res = await client.query(
      `DELETE FROM public.locations WHERE id = $1::uuid`,
      [locationId],
    );

    return res.rowCount ?? 0;
  });
}

export type AccessProfileSummary = {
  id: string;
  name: string;
  role: "user" | "admin" | "coordinator";
};

export async function getAccessProfilesByRoles(
  roles: Array<"user" | "admin" | "coordinator">,
): Promise<AccessProfileSummary[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<AccessProfileSummary>(
      `
      SELECT id::text, name, role
      FROM public.access_profiles
      WHERE role = ANY($1::user_role[])
        AND COALESCE(is_active, true) = true
      ORDER BY role ASC, name ASC
      `,
      [roles],
    );

    return rows;
  });
}

export type PermissionSummary = {
  id: string;
  name: string;
};

export async function listPermissions(): Promise<PermissionSummary[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<PermissionSummary>(
      `
      SELECT id::text, name
      FROM public.permissions
      ORDER BY name ASC
      `,
    );

    return rows;
  });
}

export async function listPermissionIdsByAccessProfile(
  accessProfileId: string,
): Promise<string[]> {
  return withClient(async (client) => {
    const { rows } = await client.query<{ permission_id: string }>(
      `
      SELECT permission_id::text
      FROM public.access_profile_permissions
      WHERE access_profile_id = $1::uuid
      ORDER BY permission_id ASC
      `,
      [accessProfileId],
    );

    return rows.map((row) => row.permission_id);
  });
}

export type AccessProfilePermissionsSnapshot = {
  accessProfileId: string;
  permissionIds: string[];
};

export async function snapshotAccessProfilePermissions(
  accessProfileId: string,
): Promise<AccessProfilePermissionsSnapshot> {
  const permissionIds = await listPermissionIdsByAccessProfile(accessProfileId);
  return {
    accessProfileId,
    permissionIds,
  };
}

export async function restoreAccessProfilePermissions(
  snapshot: AccessProfilePermissionsSnapshot,
): Promise<void> {
  await withClient(async (client) => {
    await client.query("BEGIN");
    try {
      await client.query(
        `
        DELETE FROM public.access_profile_permissions
        WHERE access_profile_id = $1::uuid
        `,
        [snapshot.accessProfileId],
      );

      if (snapshot.permissionIds.length > 0) {
        for (const permissionId of snapshot.permissionIds) {
          await client.query(
            `
            INSERT INTO public.access_profile_permissions (
              access_profile_id,
              permission_id
            )
            VALUES ($1::uuid, $2::uuid)
            ON CONFLICT DO NOTHING
            `,
            [snapshot.accessProfileId, permissionId],
          );
        }
      }

      await client.query("COMMIT");
    } catch (err) {
      await client.query("ROLLBACK");
      throw err;
    }
  });
}
