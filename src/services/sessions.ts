/**
 * @module sessions
 * @description Wrappers de acesso a dados para sessões (CRUD).
 * @path src/services/sessions.ts
 */

import type { Database } from "@/types/database.types";
import type { BookingResultPayload } from "@/utils/bookingResults";
import supabase from "./supabase";

export type SessionForEdit = {
  id: string;
  date: string | null;
  period: string | null;
  max_capacity: number | null;
  capacity: number | null;
  metadata: Database["public"]["Tables"]["sessions"]["Row"]["metadata"];
  location_id: string | null;
  applicators: string[] | null;
  coordinator_id: string | null;
  status: string | null;
};

export type SessionInfo = {
  id: string;
  date: string;
  period: string;
  max_capacity: number | null;
  capacity: number | null;
  location_id: string | null;
  location_name: string | null;
  coordinator_id: string | null;
  status: Database["public"]["Tables"]["sessions"]["Row"]["status"];
};

export type SessionClosureChecklist = {
  bookings_total: number;
  attendance_treated_count: number;
  results_pending: number;
  pending_swap_requests: number;
  can_close: boolean;
  already_completed: boolean;
};

type CloseSessionWithChecklistRow = {
  success: boolean;
  error: string | null;
  checklist: SessionClosureChecklist;
  session_status:
    | Database["public"]["Tables"]["sessions"]["Row"]["status"]
    | null;
};

export type SessionBasic = {
  id: string;
  date: string | null;
  period: string | null;
};

export type SessionProfileLookup = {
  id: string;
  full_name: string | null;
  war_name: string | null;
  saram: string | null;
  rank: string | null;
  email: string | null;
};

export type SessionBookingBasic = {
  id: string;
  session_id: string;
  user_id: string;
  result_details: Database["public"]["Tables"]["bookings"]["Row"]["result_details"];
};

export async function fetchSessionForEdit(sessionId: string): Promise<{
  session: SessionForEdit;
  bookedCount: number;
}> {
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        "id, date, period, max_capacity, capacity, metadata, location_id, applicators, coordinator_id, status",
      )
      .eq("id", sessionId)
      .single(),
    supabase
      .from("bookings")
      .select("*", { count: "exact", head: true })
      .eq("session_id", sessionId)
      .neq("status", "cancelado"),
  ]);
  if (error) throw error;
  if (!data) throw new Error("Turma não encontrada.");
  return { session: data as SessionForEdit, bookedCount: count ?? 0 };
}

export async function updateSession(
  sessionId: string,
  payload: Database["public"]["Tables"]["sessions"]["Update"],
): Promise<void> {
  const { error } = await supabase
    .from("sessions")
    .update(payload)
    .eq("id", sessionId);
  if (error) throw error;
}

export async function fetchSessionById(
  sessionId: string,
): Promise<SessionInfo | null> {
  const { data, error } = await supabase
    .from("sessions")
    .select(
      "id,date,period,max_capacity,capacity,location_id,coordinator_id,status,location:locations(name)",
    )
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  if (!data) return null;

  const sessionData = data as {
    id: string;
    date: string;
    period: string;
    max_capacity: number | null;
    capacity?: number | null;
    location_id?: string | null;
    coordinator_id?: string | null;
    status: Database["public"]["Tables"]["sessions"]["Row"]["status"];
    location?:
      | { name?: string | null }
      | Array<{ name?: string | null }>
      | null;
  };

  const locationRaw = Array.isArray(sessionData.location)
    ? sessionData.location[0]
    : sessionData.location;

  return {
    id: sessionData.id,
    date: sessionData.date,
    period: sessionData.period,
    max_capacity: sessionData.max_capacity,
    capacity: sessionData.capacity ?? null,
    location_id: sessionData.location_id ?? null,
    location_name: locationRaw?.name ?? null,
    coordinator_id: sessionData.coordinator_id ?? null,
    status: sessionData.status,
  };
}

function getChecklistRpcRow(
  data: unknown,
): CloseSessionWithChecklistRow | null {
  if (Array.isArray(data)) {
    return (data[0] as CloseSessionWithChecklistRow | undefined) ?? null;
  }

  return (data as CloseSessionWithChecklistRow | null) ?? null;
}

export async function fetchSessionClosureChecklist(
  sessionId: string,
): Promise<SessionClosureChecklist> {
  const { data, error } = await supabase.rpc("close_session_with_checklist", {
    p_session_id: sessionId,
    p_apply: false,
  });

  if (error) throw error;

  const row = getChecklistRpcRow(data);
  if (!row) {
    throw new Error("Nao foi possivel carregar checklist de encerramento.");
  }

  return row.checklist;
}

export async function closeSessionWithChecklist(
  sessionId: string,
): Promise<CloseSessionWithChecklistRow> {
  const { data, error } = await supabase.rpc("close_session_with_checklist", {
    p_session_id: sessionId,
    p_apply: true,
  });

  if (error) throw error;

  const row = getChecklistRpcRow(data);
  if (!row) {
    throw new Error("Falha ao encerrar sessao.");
  }

  if (!row.success) {
    throw new Error(row.error ?? "Checklist incompleto para encerramento.");
  }

  return row;
}

export async function fetchSessionBookingsWithProfiles(
  sessionId: string,
): Promise<{
  bookings: unknown[];
  profilesById: Map<string, SessionProfileLookup>;
}> {
  const { data: bookingsData, error: bookingsError } = await supabase
    .from("bookings")
    .select("*")
    .eq("session_id", sessionId)
    .order("order_number", { ascending: true, nullsFirst: false });

  if (bookingsError) throw bookingsError;
  const booksRaw = bookingsData ?? [];

  const userIds = Array.from(
    new Set((booksRaw as { user_id: string }[]).map((b) => b.user_id)),
  );
  const profilesById = new Map<string, SessionProfileLookup>();

  if (userIds.length > 0) {
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("id,full_name,war_name,saram,rank,email")
      .in("id", userIds);
    (profilesData ?? []).forEach((p) =>
      profilesById.set(p.id, p as SessionProfileLookup),
    );
  }

  return { bookings: booksRaw, profilesById };
}

export async function updateBookingAttendance(
  bookingId: string,
  attendanceConfirmed: boolean,
): Promise<void> {
  const { error } = await supabase.rpc("set_booking_attendance", {
    p_booking_id: bookingId,
    p_attendance_confirmed: attendanceConfirmed,
  });
  if (error) throw error;
}

export async function fetchRecentSessions(limit = 50): Promise<SessionBasic[]> {
  const { data, error } = await supabase
    .from("sessions")
    .select("id, date, period")
    .order("date", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as SessionBasic[];
}

export async function fetchSessionBookings(sessionId: string): Promise<{
  bookings: SessionBookingBasic[];
  profilesById: Map<
    string,
    Pick<
      SessionProfileLookup,
      "id" | "full_name" | "war_name" | "saram" | "rank"
    >
  >;
}> {
  const { data: bookingData, error: bookingError } = await supabase
    .from("bookings")
    .select("id, session_id, user_id, result_details")
    .eq("session_id", sessionId)
    .order("created_at", { ascending: true });

  if (bookingError) throw bookingError;
  const bookings = (bookingData ?? []) as SessionBookingBasic[];

  const userIds = [...new Set(bookings.map((b) => b.user_id))];
  const profilesById = new Map<
    string,
    Pick<
      SessionProfileLookup,
      "id" | "full_name" | "war_name" | "saram" | "rank"
    >
  >();

  if (userIds.length > 0) {
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("id, full_name, war_name, saram, rank")
      .in("id", userIds);
    if (profileError) throw profileError;
    (profileData ?? []).forEach((p) =>
      profilesById.set(
        p.id,
        p as Pick<
          SessionProfileLookup,
          "id" | "full_name" | "war_name" | "saram" | "rank"
        >,
      ),
    );
  }

  return { bookings, profilesById };
}

export async function updateBookingResult(
  bookingId: string,
  resultDetails: string | BookingResultPayload,
): Promise<void> {
  const { error } = await supabase.rpc("set_booking_result", {
    p_booking_id: bookingId,
    p_result:
      typeof resultDetails === "string"
        ? resultDetails
        : resultDetails.result_status,
    p_result_payload: typeof resultDetails === "string" ? null : resultDetails,
  });
  if (error) throw error;
}
