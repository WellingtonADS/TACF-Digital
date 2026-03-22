/**
 * @module sessions
 * @description Wrappers de acesso a dados para sessões (CRUD).
 * @path src/services/sessions.ts
 */

import type { Database } from "@/types/database.types";
import supabase from "./supabase";

export type SessionForEdit = {
  id: string;
  date: string | null;
  period: string | null;
  max_capacity: number | null;
  location_id: string | null;
  applicators: string[] | null;
  status: string | null;
};

export type SessionInfo = {
  id: string;
  date: string;
  period: string;
  max_capacity: number | null;
  location_id: string | null;
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
  result_details: string | null;
};

export async function fetchSessionForEdit(sessionId: string): Promise<{
  session: SessionForEdit;
  bookedCount: number;
}> {
  const [{ data, error }, { count }] = await Promise.all([
    supabase
      .from("sessions")
      .select(
        "id, date, period, max_capacity, location_id, applicators, status",
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
    .select("id,date,period,max_capacity,location_id")
    .eq("id", sessionId)
    .single();
  if (error) throw error;
  return data as SessionInfo | null;
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
  const { error } = await supabase
    .from("bookings")
    .update({ attendance_confirmed: attendanceConfirmed })
    .eq("id", bookingId);
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
  resultDetails: string,
): Promise<void> {
  const { error } = await supabase
    .from("bookings")
    .update({ result_details: resultDetails })
    .eq("id", bookingId);
  if (error) throw error;
}
