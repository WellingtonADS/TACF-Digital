import type { Database } from "@/types/database.types";
import supabase, { confirmarAgendamentoRPC } from "./supabase";

export async function getSessions() {
  // Placeholder: implementar apenas quando houver uso real.
  // Mantido como lembrete, mas evite implementações até que sejam necessárias.
  return [] as unknown[];
}

export async function createSessions(
  rows: Database["public"]["Tables"]["sessions"]["Insert"][],
): Promise<void> {
  rows.forEach((row) => {
    if (!row.location_id) {
      throw new Error("Local do teste é obrigatório para criar agendamento.");
    }

    if (!row.applicators || row.applicators.length === 0) {
      throw new Error(
        "Instrutor aplicador é obrigatório para criar agendamento.",
      );
    }
  });

  const { error } = await supabase.from("sessions").insert(rows);
  if (error) throw error;
}

export async function confirmBooking(userId: string, sessionId: string) {
  return confirmarAgendamentoRPC(userId, sessionId);
}

export async function fetchSwapRequests() {
  const { data, error } = await supabase
    .from("swap_requests")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data ?? [];
}

export type SwapRequestWithContextRow =
  Database["public"]["Functions"]["get_swap_requests_with_context"]["Returns"][number];

export async function fetchSwapRequestsWithContext(): Promise<
  SwapRequestWithContextRow[]
> {
  const { data, error } = await supabase.rpc("get_swap_requests_with_context");
  if (error) throw error;
  return (data ?? []) as SwapRequestWithContextRow[];
}

export async function updateSwapRequestStatus(
  requestId: string,
  status: Database["public"]["Tables"]["swap_requests"]["Update"]["status"],
  processedBy?: string,
) {
  const payload: Database["public"]["Tables"]["swap_requests"]["Update"] = {
    status,
    processed_at: new Date().toISOString(),
  };

  if (processedBy) {
    payload.processed_by = processedBy;
  }

  const { data, error } = await supabase
    .from("swap_requests")
    .update(payload)
    .eq("id", requestId)
    .select()
    .maybeSingle();
  if (error) throw error;
  return data;
}

export type ApproveSwapResponse = {
  success: boolean;
  error: string | null;
  original_booking_id: string | null;
  new_booking_id: string | null;
  new_session_id: string | null;
  order_number: string | null;
};

export type RejectSwapResponse = {
  success: boolean;
  error: string | null;
  booking_id: string | null;
  user_id: string | null;
  swap_status: Database["public"]["Tables"]["swap_requests"]["Row"]["status"] | null;
};

export type CancelBookingResponse = {
  success: boolean;
  error: string | null;
  booking_id: string | null;
  user_id: string | null;
  booking_status: Database["public"]["Tables"]["bookings"]["Row"]["status"] | null;
  cancelled_swap_requests: number;
};

type SupabaseRpcError = {
  code?: string;
  message?: string;
};

function mapBookingRpcError(error: unknown, rpcName: string): Error {
  const rpcError = error as SupabaseRpcError | null;

  if (
    rpcError?.code === "PGRST202" &&
    typeof rpcError.message === "string" &&
    rpcError.message.includes(rpcName)
  ) {
    return new Error(
      `RPC ${rpcName} indisponivel no ambiente atual. Aplique as migrations do banco (yarn db:apply) e atualize o cache de schema do Supabase.`,
    );
  }

  return error instanceof Error
    ? error
    : new Error("Falha ao executar operacao administrativa de agendamento.");
}

export async function approveSwapRequest(
  requestId: string,
  adminId: string,
): Promise<ApproveSwapResponse> {
  const { data, error } = await supabase.rpc("approve_swap", {
    p_request_id: requestId,
    p_admin_id: adminId,
  });

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : null;

  return {
    success: Boolean(result?.success),
    error: result?.error ?? null,
    original_booking_id: result?.original_booking_id ?? null,
    new_booking_id: result?.new_booking_id ?? null,
    new_session_id: result?.new_session_id ?? null,
    order_number: result?.order_number ?? null,
  };
}

export async function rejectSwapRequest(
  requestId: string,
  adminId: string,
  reason?: string,
): Promise<RejectSwapResponse> {
  const { data, error } = await supabase.rpc("reject_swap", {
    p_request_id: requestId,
    p_admin_id: adminId,
    p_reason: reason ?? null,
  });

  if (error) throw error;

  const result = Array.isArray(data) ? data[0] : null;

  return {
    success: Boolean(result?.success),
    error: result?.error ?? null,
    booking_id: result?.booking_id ?? null,
    user_id: result?.user_id ?? null,
    swap_status: result?.swap_status ?? null,
  };
}

export async function cancelBooking(
  bookingId: string,
  reason?: string,
): Promise<CancelBookingResponse> {
  const { data, error } = await supabase.rpc("cancel_booking", {
    p_booking_id: bookingId,
    p_reason: reason ?? null,
  });

  if (error) {
    throw mapBookingRpcError(error, "cancel_booking");
  }

  const result = Array.isArray(data) ? data[0] : null;

  return {
    success: Boolean(result?.success),
    error: result?.error ?? null,
    booking_id: result?.booking_id ?? null,
    user_id: result?.user_id ?? null,
    booking_status: result?.booking_status ?? null,
    cancelled_swap_requests: Number(result?.cancelled_swap_requests ?? 0),
  };
}

interface SwapRequestParams {
  bookingId: string;
  requestedBy: string;
  newSessionId: string;
  newDate: string; // ISO string
  reasonText: string;
  attachment?: File;
}

// `createSwapRequest` é consumido por `RescheduleDrawer` (src/components/RescheduleDrawer.tsx)
export async function createSwapRequest(params: SwapRequestParams) {
  let attachmentUrl: string | null = null;

  if (params.attachment) {
    const fileExt = params.attachment.name.split(".").pop() || "";
    const fileName = `${params.bookingId}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("swap-attachments")
      .upload(fileName, params.attachment);
    if (uploadError) throw uploadError;

    const { data: urlData } = supabase.storage
      .from("swap-attachments")
      .getPublicUrl(uploadData.path);
    attachmentUrl = urlData.publicUrl;
  }

  const { data, error } = await supabase.rpc(
    "create_swap_request_if_eligible",
    {
      p_booking_id: params.bookingId,
      p_requested_by: params.requestedBy,
      p_new_session_id: params.newSessionId,
      p_reason_text: params.reasonText,
      p_new_date: params.newDate,
      p_attachment_url: attachmentUrl,
    },
  );
  if (error) throw error;
  return data;
}

export type PendingSwapBooking = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  | "id"
  | "user_id"
  | "session_id"
  | "test_date"
  | "swap_reason"
  | "status"
  | "created_at"
>;

export async function fetchPendingSwapBookings(): Promise<
  PendingSwapBooking[]
> {
  const { data, error } = await supabase
    .from("bookings")
    .select("id,user_id,session_id,test_date,swap_reason,status,created_at")
    .not("swap_reason", "is", null)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as PendingSwapBooking[];
}

export type AnalyticsProfileRow = {
  id: string;
  full_name: string | null;
  war_name: string | null;
  email: string | null;
  saram: string | null;
  rank: string | null;
  sector: string | null;
  active: boolean;
};

export type AnalyticsBookingRow = {
  id: string;
  user_id: string | null;
  session_id: string | null;
  score: number | null;
  test_date: string | null;
  created_at: string | null;
  status: string | null;
  result_details: unknown;
};

export type AnalyticsSessionRow = Pick<
  Database["public"]["Tables"]["sessions"]["Row"],
  "id" | "date" | "period" | "max_capacity" | "location_id"
>;

export type AnalyticsLocationRow = Pick<
  Database["public"]["Tables"]["locations"]["Row"],
  "id" | "name"
>;

export async function fetchAnalyticsData(
  fromTs: string,
  toTs: string,
): Promise<{
  profiles: AnalyticsProfileRow[];
  bookings: AnalyticsBookingRow[];
  allBookings: AnalyticsBookingRow[];
  sessions: AnalyticsSessionRow[];
  locations: AnalyticsLocationRow[];
}> {
  const [
    { data: profileData, error: profileError },
    { data: bookingData, error: bookingError },
    { data: allBookingData, error: allBookingError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, war_name, email, saram, rank, sector, active"),
    supabase
      .from("bookings")
      .select(
        "id, user_id, session_id, score, test_date, created_at, status, result_details",
      )
      .eq("status", "agendado")
      .gte("created_at", fromTs)
      .lte("created_at", toTs),
    supabase
      .from("bookings")
      .select(
        "id, user_id, session_id, score, test_date, created_at, status, result_details",
      )
      .eq("status", "agendado")
      .not("result_details", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  if (profileError) throw profileError;
  if (bookingError) throw bookingError;
  if (allBookingError) throw allBookingError;

  const periodSessionIds = Array.from(
    new Set(
      (bookingData ?? [])
        .map((booking) => booking.session_id)
        .filter((sessionId): sessionId is string => Boolean(sessionId)),
    ),
  );

  let sessions: AnalyticsSessionRow[] = [];
  let locations: AnalyticsLocationRow[] = [];

  if (periodSessionIds.length > 0) {
    const { data: sessionsData, error: sessionsError } = await supabase
      .from("sessions")
      .select("id, date, period, max_capacity, location_id")
      .in("id", periodSessionIds);

    if (sessionsError) throw sessionsError;

    sessions = (sessionsData ?? []) as AnalyticsSessionRow[];

    const locationIds = Array.from(
      new Set(
        sessions
          .map((session) => session.location_id)
          .filter((locationId): locationId is string => Boolean(locationId)),
      ),
    );

    if (locationIds.length > 0) {
      const { data: locationsData, error: locationsError } = await supabase
        .from("locations")
        .select("id, name")
        .in("id", locationIds);

      if (locationsError) throw locationsError;

      locations = (locationsData ?? []) as AnalyticsLocationRow[];
    }
  }

  return {
    profiles: (profileData ?? []) as AnalyticsProfileRow[],
    bookings: (bookingData ?? []) as AnalyticsBookingRow[],
    allBookings: (allBookingData ?? []) as AnalyticsBookingRow[],
    sessions,
    locations,
  };
}

export async function fetchPendingSwapsByBookingIds(
  bookingIds: string[],
): Promise<Set<string>> {
  if (bookingIds.length === 0) return new Set();
  const { data, error } = await supabase
    .from("swap_requests")
    .select("booking_id")
    .in("booking_id", bookingIds)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase-generated types mismatch our enum
    .eq("status", "solicitado" as any);
  if (error) throw error;
  const set = new Set<string>();
  (data ?? []).forEach((r) => r.booking_id && set.add(r.booking_id));
  return set;
}

export async function fetchAdminMetrics(): Promise<{
  totalInscritos: number;
  aptosMonth: number;
  pendencias: number;
}> {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);

  const [
    { count: totalCount, error: totalError },
    { count: aptosCount, error: aptosError },
    { count: pendCount, error: pendError },
  ] = await Promise.all([
    supabase.from("bookings").select("id", { count: "exact", head: true }),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .not("score", "is", null)
      .gte("created_at", firstDay.toISOString())
      .lt("created_at", nextMonth.toISOString()),
    supabase
      .from("bookings")
      .select("id", { count: "exact", head: true })
      .not("status", "eq", "agendado"),
  ]);

  if (totalError) throw totalError;
  if (aptosError) throw aptosError;
  if (pendError) throw pendError;

  return {
    totalInscritos: totalCount ?? 0,
    aptosMonth: aptosCount ?? 0,
    pendencias: pendCount ?? 0,
  };
}

export type AdminGovernanceSnapshot = {
  overdueSessions: number;
  pendingResults: number;
  pendingSwapRequests: number;
  completedSessionsLast7Days: number;
  oldestPendingSwapCreatedAt: string | null;
};

export type AdminOperationalSessionSummary = {
  session_id: string;
  date: string;
  period: string;
  max_capacity?: number;
  occupied_count?: number;
  bookings_total?: number;
  results_pending?: number;
  pending_swap_requests?: number;
};

export type AdminOperationalOverview = {
  open_full_sessions: AdminOperationalSessionSummary[];
  ready_to_close_sessions: AdminOperationalSessionSummary[];
};

export async function fetchAdminGovernanceSnapshot(): Promise<AdminGovernanceSnapshot> {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const last7Days = new Date(now);
  last7Days.setDate(last7Days.getDate() - 7);

  const [
    { data: sessionsData, error: sessionsError },
    { data: pendingSwapsData, error: pendingSwapsError },
    { count: completedCount, error: completedError },
  ] = await Promise.all([
    supabase
      .from("sessions")
      .select("id,date,status")
      .lte("date", today)
      .neq("status", "completed"),
    supabase
      .from("swap_requests")
      .select("id,booking_id,created_at")
      .eq("status", "solicitado")
      .order("created_at", { ascending: true }),
    supabase
      .from("sessions")
      .select("id", { count: "exact", head: true })
      .eq("status", "completed")
      .gte("updated_at", last7Days.toISOString()),
  ]);

  if (sessionsError) throw sessionsError;
  if (pendingSwapsError) throw pendingSwapsError;
  if (completedError) throw completedError;

  const overdueSessions = sessionsData ?? [];
  const overdueSessionIds = overdueSessions.map((session) => session.id);

  let pendingResults = 0;

  if (overdueSessionIds.length > 0) {
    const { count: pendingResultsCount, error: pendingResultsError } =
      await supabase
        .from("bookings")
        .select("id", { count: "exact", head: true })
        .in("session_id", overdueSessionIds)
        .neq("status", "cancelado")
        .is("result_details", null);

    if (pendingResultsError) throw pendingResultsError;
    pendingResults = pendingResultsCount ?? 0;
  }

  return {
    overdueSessions: overdueSessions.length,
    pendingResults,
    pendingSwapRequests: (pendingSwapsData ?? []).length,
    completedSessionsLast7Days: completedCount ?? 0,
    oldestPendingSwapCreatedAt: pendingSwapsData?.[0]?.created_at ?? null,
  };
}

export async function fetchAdminOperationalOverview(): Promise<AdminOperationalOverview> {
  const { data, error } = await supabase.rpc("get_admin_operational_overview");
  if (error) throw error;

  const payload =
    data && typeof data === "object" && !Array.isArray(data)
      ? (data as Partial<AdminOperationalOverview>)
      : {};

  return {
    open_full_sessions: Array.isArray(payload.open_full_sessions)
      ? payload.open_full_sessions
      : [],
    ready_to_close_sessions: Array.isArray(payload.ready_to_close_sessions)
      ? payload.ready_to_close_sessions
      : [],
  };
}

export type AppointmentBookingPreview = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  | "id"
  | "user_id"
  | "session_id"
  | "status"
  | "test_date"
  | "order_number"
  | "score"
  | "result_details"
>;

export type AppointmentSessionPreview = Pick<
  Database["public"]["Tables"]["sessions"]["Row"],
  "id" | "date" | "period" | "max_capacity"
> & {
  location_name?: string | null;
  location_address?: string | null;
};

export type AppointmentProfilePreview = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "war_name" | "saram" | "rank" | "sector"
>;

export async function fetchAppointmentContext(params: {
  bookingId: string | null;
  sessionIdInput: string | null;
  userId: string | null;
}): Promise<{
  booking: AppointmentBookingPreview | null;
  session: AppointmentSessionPreview | null;
  profile: AppointmentProfilePreview | null;
  existingBookingForDate: AppointmentBookingPreview | null;
  resolvedSessionId: string | null;
}> {
  let localBooking: AppointmentBookingPreview | null = null;
  let localSessionId = params.sessionIdInput;
  let localUserId = params.userId;

  if (params.bookingId) {
    const { data: bData, error: bErr } = await supabase
      .from("bookings")
      .select(
        "id, user_id, session_id, status, test_date, order_number, score, result_details",
      )
      .eq("id", params.bookingId)
      .maybeSingle<AppointmentBookingPreview>();

    if (bErr || !bData) {
      return {
        booking: null,
        session: null,
        profile: null,
        existingBookingForDate: null,
        resolvedSessionId: params.sessionIdInput,
      };
    }

    localBooking = bData;
    localSessionId = bData.session_id;
    localUserId = bData.user_id;
  }

  const sessionPromise = localSessionId
    ? supabase
        .from("sessions")
        .select(
          "id, date, period, max_capacity, location:locations(name, address), location_id",
        )
        .eq("id", localSessionId)
        .maybeSingle()
    : Promise.resolve({ data: null, error: null });

  const profilePromise = localUserId
    ? supabase
        .from("profiles")
        .select("id, full_name, war_name, saram, rank, sector")
        .eq("id", localUserId)
        .maybeSingle<AppointmentProfilePreview>()
    : Promise.resolve({ data: null, error: null });

  const [{ data: sData }, { data: pData }] = await Promise.all([
    sessionPromise,
    profilePromise,
  ]);

  let session: AppointmentSessionPreview | null = null;
  let existingBookingForDate: AppointmentBookingPreview | null = null;

  if (sData) {
    let locName: string | null = null;
    let locAddress: string | null = null;

    const locRaw = sData.location as
      | { name?: string | null; address?: string | null }[]
      | { name?: string | null; address?: string | null }
      | null;

    const loc = Array.isArray(locRaw) ? locRaw[0] : locRaw;

    if (loc && (loc.name || loc.address)) {
      locName = loc.name ?? null;
      locAddress = loc.address ?? null;
    } else if ((sData as { location_id?: string | null }).location_id) {
      const sessionLocationId = (sData as { location_id?: string | null })
        .location_id;
      if (sessionLocationId) {
        const { data: locationRow, error: locationErr } = await supabase
          .from("locations")
          .select("name, address")
          .eq("id", sessionLocationId)
          .maybeSingle();
        if (!locationErr && locationRow) {
          locName = locationRow.name ?? null;
          locAddress = locationRow.address ?? null;
        }
      }
    }

    session = {
      id: sData.id,
      date: sData.date,
      period: sData.period,
      max_capacity: sData.max_capacity,
      location_name: locName,
      location_address: locAddress,
    };

    if (localUserId) {
      const { data: existing, error: existingErr } = await supabase
        .from("bookings")
        .select("id, user_id, session_id, status, test_date, order_number")
        .eq("user_id", localUserId)
        .eq("test_date", sData.date)
        .eq("status", "agendado")
        .maybeSingle<AppointmentBookingPreview>();

      if (!existingErr && existing) {
        existingBookingForDate = existing;
      }
    }
  }

  return {
    booking: localBooking,
    session,
    profile: pData ?? null,
    existingBookingForDate,
    resolvedSessionId: sData?.id ?? localSessionId ?? null,
  };
}

export type TicketRow = {
  id: string;
  order_number: string | null;
  status: Database["public"]["Tables"]["bookings"]["Row"]["status"] | null;
  session?: {
    date?: string | null;
    period?: string | null;
    location?: { name?: string | null } | null;
  } | null;
  profile?: {
    war_name?: string | null;
    full_name?: string | null;
    saram?: string | null;
  } | null;
};

export async function fetchUserTickets(userId: string): Promise<TicketRow[]> {
  const { data, error } = await supabase
    .from("bookings")
    .select(
      "id, order_number, status, session: sessions(date, period, location:locations(name)), profile: profiles(war_name, full_name, saram)",
    )
    .eq("user_id", userId)
    .eq("status", "agendado")
    .not("order_number", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? (data as TicketRow[]) : [];
}

export default {
  getSessions,
  confirmBooking,
  fetchSwapRequests,
  fetchSwapRequestsWithContext,
  approveSwapRequest,
  cancelBooking,
  rejectSwapRequest,
  updateSwapRequestStatus,
  fetchPendingSwapBookings,
  fetchAdminMetrics,
  fetchAdminOperationalOverview,
};
