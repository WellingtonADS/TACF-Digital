import type {
  Booking,
  Database,
  Profile,
  Session,
} from "@/types/database.types";
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

export async function getSessionWithBookings(
  date: string,
  period: Session["period"],
) {
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
    .upsert(row as Database["public"]["Tables"]["sessions"]["Insert"], {
      onConflict: ["date", "period"],
    })
    .select();

  if (error) return { error: error.message };
  return {
    data: (data as Database["public"]["Tables"]["sessions"]["Row"][]) ?? [],
  };
}

export type PendingSwapView = {
  id: string;
  reason: string | null;
  created_at: string;
  booking_id: string;
  new_session_id: string;
  full_name: string;
  rank: string;
  from_date: string | null;
  from_period: "morning" | "afternoon" | null;
  to_date: string | null;
  to_period: "morning" | "afternoon" | null;
};
export async function approveSwap(
  swapRequestId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from<Database["public"]["Tables"]["swap_requests"]["Row"]>("swap_requests")
    .update({ status: "approved" })
    .eq("id", swapRequestId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function rejectSwap(
  swapRequestId: string,
): Promise<{ success: boolean; error?: string }> {
  const { error } = await supabase
    .from<Database["public"]["Tables"]["swap_requests"]["Row"]>("swap_requests")
    .update({ status: "rejected" })
    .eq("id", swapRequestId);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function fetchDashboardStats(): Promise<{
  totalUsers: number;
  totalScheduled: number;
  pendingSwaps: number;
}> {
  // Total de usuários (profiles)
  const { count: userCount } = await supabase
    .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
    .select("*", { count: "exact", head: true });

  // Total de reservas confirmadas
  const { count: bookingCount } = await supabase
    .from<Database["public"]["Tables"]["bookings"]["Row"]>("bookings")
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");

  // Swaps pendentes
  const { count: swapCount } = await supabase
    .from<Database["public"]["Tables"]["swap_requests"]["Row"]>("swap_requests")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");

  return {
    totalUsers: userCount ?? 0,
    totalScheduled: bookingCount ?? 0,
    pendingSwaps: swapCount ?? 0,
  };
}

export async function fetchPendingSwaps(): Promise<PendingSwapView[]> {
  type SwapRequestRow = Database["public"]["Tables"]["swap_requests"]["Row"];

  const { data: rows, error } = await supabase
    .from<SwapRequestRow>("swap_requests")
    .select("id, reason, booking_id, new_session_id, created_at")
    .eq("status", "pending");

  if (error || !rows) return [];

  const out: PendingSwapView[] = [];

  for (const r of rows as SwapRequestRow[]) {
    const bookingRes = await supabase
      .from<Database["public"]["Tables"]["bookings"]["Row"]>("bookings")
      .select("id, user_id, session_id")
      .eq("id", r.booking_id)
      .maybeSingle();
    const booking = bookingRes.data as {
      id: string;
      user_id: string;
      session_id: string;
    } | null;

    const profileRes = await supabase
      .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
      .select("full_name, rank")
      .eq("id", booking?.user_id ?? null)
      .maybeSingle();
    const profile = profileRes.data as {
      full_name?: string;
      rank?: string;
    } | null;

    const fromSessionRes = await supabase
      .from<Database["public"]["Tables"]["sessions"]["Row"]>("sessions")
      .select("date, period")
      .eq("id", booking?.session_id ?? null)
      .maybeSingle();
    const fromSession = fromSessionRes.data as {
      date?: string;
      period?: "morning" | "afternoon";
    } | null;

    const toSessionRes = await supabase
      .from<Database["public"]["Tables"]["sessions"]["Row"]>("sessions")
      .select("date, period")
      .eq("id", r.new_session_id)
      .maybeSingle();
    const toSession = toSessionRes.data as {
      date?: string;
      period?: "morning" | "afternoon";
    } | null;

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

export type AnalyticsSessionRow = {
  id: string;
  date: string;
  max_capacity: number;
};

export type AnalyticsBookingRow = {
  session_id: string;
  status: "confirmed" | "cancelled" | "pending_swap";
};

export type AnalyticsSnapshot = {
  sessions: AnalyticsSessionRow[];
  bookings: AnalyticsBookingRow[];
  swapRequests: number;
};

export async function fetchAnalyticsSnapshot(
  startDate: string,
  endDate: string,
): Promise<{ data: AnalyticsSnapshot | null; error: string | null }> {
  const { data: sessions, error: sessionsError } = await supabase
    .from<Database["public"]["Tables"]["sessions"]["Row"]>("sessions")
    .select("id, date, max_capacity")
    .gte("date", startDate)
    .lte("date", endDate);

  if (sessionsError) {
    return { data: null, error: sessionsError.message };
  }

  const sessionRows = (sessions ?? []) as AnalyticsSessionRow[];
  const sessionIds = sessionRows.map((s) => s.id);

  let bookingRows: AnalyticsBookingRow[] = [];
  if (sessionIds.length > 0) {
    const { data: bookings, error: bookingsError } = await supabase
      .from<Database["public"]["Tables"]["bookings"]["Row"]>("bookings")
      .select("session_id, status")
      .in("session_id", sessionIds);

    if (bookingsError) {
      return { data: null, error: bookingsError.message };
    }

    bookingRows = (bookings ?? []) as AnalyticsBookingRow[];
  }

  const { count: swapCount, error: swapError } = await supabase
    .from<Database["public"]["Tables"]["swap_requests"]["Row"]>("swap_requests")
    .select("id", { count: "exact", head: true })
    .gte("created_at", startDate)
    .lte("created_at", endDate);

  if (swapError) {
    return { data: null, error: swapError.message };
  }

  return {
    data: {
      sessions: sessionRows,
      bookings: bookingRows,
      swapRequests: swapCount ?? 0,
    },
    error: null,
  };
}
