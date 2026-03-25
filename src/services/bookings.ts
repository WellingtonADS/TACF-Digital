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

export async function updateBookingStatus(
  bookingId: string,
  status: Database["public"]["Tables"]["bookings"]["Update"]["status"],
) {
  const { data, error } = await supabase
    .from("bookings")
    .update({ status })
    .eq("id", bookingId);
  if (error) throw error;
  return data;
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

  type SwapInsertStrict =
    Database["public"]["Tables"]["swap_requests"]["Insert"];

  const payload: SwapInsertStrict = {
    booking_id: params.bookingId,
    requested_by: params.requestedBy,
    new_session_id: params.newSessionId,
    reason: JSON.stringify({
      text: params.reasonText,
      new_date: params.newDate,
      attachment_url: attachmentUrl,
    }),
  };

  const { data, error } = await supabase
    .from("swap_requests")
    .insert([payload]);
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
  saram: string | null;
  rank: string | null;
  sector: string | null;
  active: boolean;
};

export type AnalyticsBookingRow = {
  id: string;
  user_id: string | null;
  score: number | null;
  test_date: string | null;
  created_at: string | null;
  status: string | null;
  result_details: string | null;
};

export async function fetchAnalyticsData(
  fromTs: string,
  toTs: string,
): Promise<{
  profiles: AnalyticsProfileRow[];
  bookings: AnalyticsBookingRow[];
  allBookings: AnalyticsBookingRow[];
}> {
  const [
    { data: profileData, error: profileError },
    { data: bookingData, error: bookingError },
    { data: allBookingData, error: allBookingError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, war_name, saram, rank, sector, active"),
    supabase
      .from("bookings")
      .select(
        "id, user_id, score, test_date, created_at, status, result_details",
      )
      .eq("status", "agendado")
      .gte("created_at", fromTs)
      .lte("created_at", toTs),
    supabase
      .from("bookings")
      .select(
        "id, user_id, score, test_date, created_at, status, result_details",
      )
      .eq("status", "agendado")
      .not("result_details", "is", null)
      .order("created_at", { ascending: false }),
  ]);

  if (profileError) throw profileError;
  if (bookingError) throw bookingError;
  if (allBookingError) throw allBookingError;

  return {
    profiles: (profileData ?? []) as AnalyticsProfileRow[],
    bookings: (bookingData ?? []) as AnalyticsBookingRow[],
    allBookings: (allBookingData ?? []) as AnalyticsBookingRow[],
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
  status: string | null;
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
    .not("order_number", "is", null)
    .order("created_at", { ascending: false });

  if (error) throw error;
  return Array.isArray(data) ? (data as TicketRow[]) : [];
}

export default {
  getSessions,
  confirmBooking,
  fetchSwapRequests,
  updateSwapRequestStatus,
  updateBookingStatus,
  fetchPendingSwapBookings,
  fetchAdminMetrics,
};
