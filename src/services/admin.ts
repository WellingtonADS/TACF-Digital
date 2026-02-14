import type {
  Booking,
  Database,
  Profile,
  Session,
  SwapRequestUpdate,
} from "@/types/database.types";
import { supabase } from "./supabase";

export async function fetchDashboardStats() {
  // total users
  const totalUsersRes = await supabase
    .from("profiles" as const)
    .select("*", { count: "exact", head: true });
  const totalUsers = totalUsersRes.count ?? 0;

  // total scheduled (confirmed)
  const totalScheduledRes = await supabase
    .from("bookings" as const)
    .select("*", { count: "exact", head: true })
    .eq("status", "confirmed");
  const totalScheduled = totalScheduledRes.count ?? 0;

  // pending swaps
  const pendingSwapsRes = await supabase
    .from("swap_requests" as const)
    .select("*", { count: "exact", head: true })
    .eq("status", "pending");
  const pendingSwaps = pendingSwapsRes.count ?? 0;

  return { totalUsers, totalScheduled, pendingSwaps };
}

export type SessionRow = Session;

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

export async function getSessionWithBookings(date: string, period: string) {
  // Returns session row with confirmed bookings including user profile
  const { data: session } = await supabase
    .from("sessions" as const)
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

  // Attach bookings (may be undefined)
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

  // Use upsert assuming a unique constraint on (date, period)
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

export async function fetchPendingSwaps(): Promise<PendingSwapView[]> {
  type SwapRequestRow = {
    id: string;
    reason?: string;
    booking_id: string;
    new_session_id: string;
    created_at: string;
  };

  const { data: rows, error } = await supabase
    .from<Database["public"]["Tables"]["swap_requests"]["Row"]>("swap_requests")
    .select("id, reason, booking_id, new_session_id, created_at")
    .eq("status", "pending");

  if (error || !rows) return [];

  const out: PendingSwapView[] = [];

  const swapRows = rows as SwapRequestRow[];

  for (const r of swapRows) {
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

// Fetch all profiles (optional search handled client-side)

export async function fetchProfiles(
  includeInactive = false,
): Promise<Profile[] | null> {
  const query = supabase
    .from<Database["public"]["Tables"]["profiles"]["Row"]>("profiles")
    .select("*")
    .order("full_name", { ascending: true });

  const q = includeInactive ? query : query.eq("active", true);

  const { data, error } = await q;
  if (error) return null;
  return data as Profile[] | null;
}

export async function updateProfile(
  id: string,
  updates: {
    full_name?: string;
    rank?: string;
    saram?: string;
    semester?: string;
    email?: string | null;
    role?: "user" | "admin" | "coordinator";
    active?: boolean;
  },
): Promise<{
  data?: Profile;
  error?: string;
}> {
  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["profiles"]["Update"]>("profiles")
    .update(updates)
    .eq("id", id)
    .select()
    .maybeSingle();
  if (error) return { error: error.message };
  return { data: data as Profile };
}

export async function deleteProfile(id: string) {
  const { error } = await supabase.from("profiles").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}

export async function createProfile(profile: {
  full_name: string;
  rank: string;
  saram: string;
  semester: string;
  email: string | null;
  role: "user" | "admin" | "coordinator";
  active: boolean;
}): Promise<{ data?: Profile; error?: string }> {
  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["profiles"]["Insert"]>("profiles")
    .insert(profile)
    .select()
    .maybeSingle();

  if (error) return { error: error.message };
  return { data: data as Profile };
}
export async function approveSwap(requestId: string) {
  // get current admin id from auth
  const { data: userData } = await supabase.auth.getUser();
  const admin_id = userData?.user?.id ?? null;

  type ApproveResult = { success: boolean; error?: string | null };
  const { data, error } = await supabase.rpc<ApproveResult[]>("approve_swap", {
    request_id: requestId,
    admin_id,
  });
  if (error) return { error: error.message };
  return { data };
}

export async function rejectSwap(requestId: string) {
  // get current admin id from auth
  const { data: userData } = await supabase.auth.getUser();
  const admin_id = userData?.user?.id ?? null;

  const updates: Partial<SwapRequestUpdate> = {
    status: "rejected",
    processed_at: new Date().toISOString(),
    processed_by: admin_id,
  };

  const { data, error } = await supabase
    .from<
      Database["public"]["Tables"]["swap_requests"]["Update"]
    >("swap_requests")
    .update(updates)
    .eq("id", requestId)
    .select();
  if (error) return { error: error.message };

  // reset booking status to confirmed if it had been set to pending_swap
  const bookingId = data?.[0]?.booking_id;
  if (bookingId) {
    const { error: e2 } = await supabase
      .from<Database["public"]["Tables"]["bookings"]["Update"]>("bookings")
      .update({ status: "confirmed" })
      .eq("id", bookingId);
    if (e2) return { error: e2.message };
  }

  return { data };
}
