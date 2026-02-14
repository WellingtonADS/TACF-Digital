import type { Database, Session, Booking, Profile } from "@/types/database.types";
import { supabase } from "../supabase";

export async function getSessionByDateAndPeriod(
  date: string,
  period: Session["period"],
): Promise<Session | null> {
  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["sessions"]["Row"]>("sessions")
    .select("*")
    .eq("date", date)
    .eq("period", period)
    .limit(1)
    .maybeSingle();

  if (error) return null;
  return (data as Database["public"]["Tables"]["sessions"]["Row"]) ?? null;
}

export async function getSessionWithBookings(date: string, period: Session["period"]) {
  const { data: session } = await supabase
    .from<Database["public"]["Tables"]["sessions"]["Row"]>("sessions")
    .select("*")
    .eq("date", date)
    .eq("period", period)
    .limit(1)
    .maybeSingle();

  if (!session) return null;

  type BookingWithUser = Booking & { user?: Profile };

  const { data: bookings } = await supabase
    .from<Database["public"]["Tables"]["bookings"]["Row"]>("bookings")
    .select("*, user:profiles(*)")
    .eq("session_id", (session as Session).id)
    .eq("status", "confirmed");

  return {
    ...(session as Session),
    bookings: (bookings ?? []) as BookingWithUser[],
  };
}

export async function upsertSession(sessionData: {
  date: string;
  period: Session["period"];
  max_capacity: number;
  applicators: string[];
  status: Session["status"];
}) {
  const { date, period, max_capacity, applicators, status } = sessionData;
  const row = { date, period, max_capacity, applicators, status };

  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["sessions"]["Insert"]>("sessions")
    .upsert(row as Database["public"]["Tables"]["sessions"]["Insert"], { onConflict: ["date", "period"] })
    .select();

  if (error) return { error: error.message };
  return { data: (data as Database["public"]["Tables"]["sessions"]["Row"][]) ?? [] };
}

export async function fetchPendingSwaps(): Promise<any[]> {
  const { data: rows, error } = await supabase
    .from<Database["public"]["Tables"]["swap_requests"]["Row"]>("swap_requests")
    .select("id, reason, booking_id, new_session_id, created_at")
    .eq("status", "pending");

  if (error || !rows) return [];

  const out: any[] = [];

  for (const r of rows as any[]) {
    const bookingRes = await supabase
      .from<Database["public"]["Tables"]["bookings"]["Row"]>("bookings")
      .select("id, user_id, session_id")
      .eq("id", r.booking_id)
      .maybeSingle();
    const booking = bookingRes.data as { id: string; user_id: string; session_id: string } | null;

    const profileRes = await supabase
      .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
      .select("full_name, rank")
      .eq("id", booking?.user_id ?? null)
      .maybeSingle();
    const profile = profileRes.data as { full_name?: string; rank?: string } | null;

    const fromSessionRes = await supabase
      .from<Database["public"]["Tables"]["sessions"]["Row"]>("sessions")
      .select("date, period")
      .eq("id", booking?.session_id ?? null)
      .maybeSingle();
    const fromSession = fromSessionRes.data as { date?: string; period?: "morning" | "afternoon" } | null;

    const toSessionRes = await supabase
      .from<Database["public"]["Tables"]["sessions"]["Row"]>("sessions")
      .select("date, period")
      .eq("id", r.new_session_id)
      .maybeSingle();
    const toSession = toSessionRes.data as { date?: string; period?: "morning" | "afternoon" } | null;

    out.push({
      id: r.id,
      reason: r.reason ?? null,
      created_at: r.created_at,
      booking_id: r.booking_id,
      new_session_id: r.new_session_id,
      full_name: profile?.full_name ?? "—",
      rank: profile?.rank ?? "—",
      from_date: fromSession?.date ?? null,
      from_period: fromSession?.period ?? null,
      to_date: toSession?.date ?? null,
      to_period: toSession?.period ?? null,
    });
  }

  return out;
}
