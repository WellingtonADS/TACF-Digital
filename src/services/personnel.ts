/**
 * @module personnel
 * @description Acesso a perfis, histórico e listagens de efetivo.
 * @path src/services/personnel.ts
 */

import supabase from "@/services/supabase";
import type { BookingRow, Profile } from "@/types";

export async function getProfileById(id: string) {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data as Profile | null;
}

export async function updateProfile(id: string, payload: Partial<Profile>) {
  const { error } = await supabase
    .from("profiles")
    .update(payload)
    .eq("id", id);
  if (error) throw error;
  return true;
}

export type PersonnelListProfile = {
  id: string;
  full_name: string | null;
  war_name: string | null;
  rank: string | null;
  sector: string | null;
  saram: string | null;
  active: boolean;
};

export type PersonnelLatestBooking = {
  id: string;
  user_id: string;
  test_date: string | null;
  score: string | null;
  result_details: unknown;
  created_at: string | null;
};

export async function fetchPersonnelList(): Promise<{
  profiles: PersonnelListProfile[];
  latestBookings: Map<
    string,
    Pick<
      PersonnelLatestBooking,
      "test_date" | "score" | "result_details" | "created_at"
    >
  >;
}> {
  const [
    { data: profileData, error: profileError },
    { data: bookingData, error: bookingError },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, war_name, rank, sector, saram, active"),
    supabase
      .from("bookings")
      .select("id, user_id, test_date, score, result_details, created_at")
      .order("test_date", { ascending: false, nullsFirst: false }),
  ]);

  if (profileError) throw profileError;
  if (bookingError) throw bookingError;

  const latestBookings = new Map<
    string,
    Pick<
      PersonnelLatestBooking,
      "test_date" | "score" | "result_details" | "created_at"
    >
  >();

  ((bookingData ?? []) as PersonnelLatestBooking[]).forEach((booking) => {
    const current = latestBookings.get(booking.user_id);
    const bookingDate = booking.test_date ?? booking.created_at;
    const currentDate = current?.test_date ?? current?.created_at ?? null;
    if (
      !current ||
      (bookingDate && (!currentDate || bookingDate > currentDate))
    ) {
      latestBookings.set(booking.user_id, {
        id: booking.id,
        test_date: booking.test_date,
        score: booking.score,
        result_details: booking.result_details,
        created_at: booking.created_at,
      });
    }
  });

  return {
    profiles: (profileData ?? []) as PersonnelListProfile[],
    latestBookings,
  };
}

export type ProfileWithHistory = {
  id: string;
  full_name: string | null;
  war_name: string | null;
  rank: string | null;
  sector: string | null;
  saram: string | null;
  email: string | null;
  phone_number: string | null;
  role: string | null;
  active: boolean;
  birth_date: string | null;
  physical_group: string | null;
  inspsau_valid_until: string | null;
  inspsau_last_inspection: string | null;
  created_at: string | null;
  testHistory: Array<{
    id: string;
    date: string | null;
    score: string | null;
    status: string;
    resultDetails: BookingRow["result_details"];
  }>;
};

export async function getProfileWithHistory(
  userId: string,
): Promise<ProfileWithHistory | null> {
  const [{ data, error }, { data: bookings, error: bookingError }] =
    await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
      supabase
        .from("bookings")
        .select("id, test_date, score, status, result_details, created_at")
        .eq("user_id", userId)
        .neq("status", "cancelado")
        .order("test_date", { ascending: false, nullsFirst: false })
        .limit(10),
    ]);

  if (error) throw error;
  if (bookingError) throw bookingError;
  if (!data) return null;

  const p = data as {
    id: string;
    full_name?: string | null;
    war_name?: string | null;
    rank?: string | null;
    sector?: string | null;
    saram?: string | null;
    email?: string | null;
    phone_number?: string | null;
    role?: string | null;
    active?: boolean;
    birth_date?: string | null;
    physical_group?: string | null;
    inspsau_valid_until?: string | null;
    inspsau_last_inspection?: string | null;
    created_at?: string | null;
  };

  const testHistory = (
    (bookings ?? []) as {
      id: string;
      test_date?: string | null;
      score?: string | null;
      status: string;
      result_details?: BookingRow["result_details"];
      created_at?: string | null;
    }[]
  ).map((b) => ({
    id: b.id,
    date: b.test_date ?? b.created_at ?? null,
    score: b.score ?? null,
    status: b.status,
    resultDetails: b.result_details ?? null,
  }));

  return {
    id: p.id,
    full_name: p.full_name ?? null,
    war_name: p.war_name ?? null,
    rank: p.rank ?? null,
    sector: p.sector ?? null,
    saram: p.saram ?? null,
    email: p.email ?? null,
    phone_number: p.phone_number ?? null,
    role: p.role ?? null,
    active: Boolean(p.active),
    birth_date: p.birth_date ?? null,
    physical_group: p.physical_group ?? null,
    inspsau_valid_until: p.inspsau_valid_until ?? null,
    inspsau_last_inspection: p.inspsau_last_inspection ?? null,
    created_at: p.created_at ?? null,
    testHistory,
  };
}

export type Coordinator = {
  id: string;
  full_name: string | null;
  war_name: string | null;
  rank: string | null;
};

export async function fetchCoordinators(): Promise<Coordinator[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, war_name, rank")
    .eq("role", "coordinator")
    .eq("active", true)
    .order("full_name", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Coordinator[];
}

export async function fetchAllProfilesForAccess(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from("profiles")
    .select(
      "id, full_name, war_name, email, rank, role, active, sector, metadata, updated_at, created_at",
    )
    .order("role")
    .order("full_name");
  if (error) throw error;
  return (data ?? []) as Profile[];
}

export type BookingEvaluationUpdateInput = Pick<
  BookingRow,
  "test_date" | "score" | "result_details"
>;

export async function updateBookingEvaluation(
  bookingId: string,
  payload: BookingEvaluationUpdateInput,
) {
  const { error } = await supabase
    .from("bookings")
    .update({
      test_date: payload.test_date,
      score: payload.score,
      result_details: payload.result_details,
    })
    .eq("id", bookingId);

  if (error) throw error;
  return true;
}
