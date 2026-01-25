/* eslint-disable @typescript-eslint/no-explicit-any */
import type { SessionWithBookings } from "@/types/database.types";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { supabase } from "./supabase";

type ApproveSwapResult = { success: boolean; error: string | null };

export async function confirmBooking(sessionId: string): Promise<{
  success: boolean;
  error: string | null;
  booking_id?: string | null;
}> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId)
    return { success: false, error: "Not authenticated", booking_id: null };

  // Delegate to backend RPC via confirmarAgendamentoRPC (server enforces capacity/quorum)
  const { confirmarAgendamentoRPC } = await import("./supabase");
  const res = await confirmarAgendamentoRPC(userId, sessionId);
  if (!res.success)
    return {
      success: false,
      error: res.error ?? "Unknown error",
      booking_id: res.booking_id ?? null,
    };
  return { success: true, error: null, booking_id: res.booking_id ?? null };
}

export async function approveSwap(requestId: string, adminId: string) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc("approve_swap", {
    p_request_id: requestId,
    p_admin_id: adminId,
  });
  if (error) return { success: false, error };
  const row = (Array.isArray(data) ? data[0] : data) as
    | ApproveSwapResult
    | undefined;
  return { success: row?.success === true, message: row?.error ?? null };
}

export async function fetchSessionsByMonth(year: number, month: number) {
  // month is 1-12
  const d = new Date(year, month - 1, 1);
  const start = format(startOfMonth(d), "yyyy-LL-dd");
  const end = format(endOfMonth(d), "yyyy-LL-dd");

  // Use server-side RPC that returns counts without PII
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "get_sessions_availability",
    {
      p_start: start,
      p_end: end,
    },
  );

  if (error) return { data: null, error };

  // Map RPC rows to SessionWithBookings-like objects (bookings omitted; booking_count provided)
  const mapped = ((data as Array<Record<string, unknown>>) ?? []).map((r) => ({
    id: String(r.session_id ?? ""),
    date: String(r.date ?? ""),
    period: (r.period as SessionWithBookings["period"]) ?? ("morning" as const),
    max_capacity: Number(r.max_capacity ?? 0),
    applicators: [],
    status: "open",
    coordinator_id: null,
    created_at: "",
    updated_at: "",
    bookings: [],
    booking_count: Number((r.occupied_count as unknown) ?? 0),
  })) as SessionWithBookings[];

  return { data: mapped, error: null };
}

export async function getUserBooking() {
  // fetch a confirmed booking for current user with related session and profile
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return { data: null, error: "Not authenticated" };

  const { data, error } = await supabase
    .from("bookings")
    .select("*, sessions (*), profiles (id, saram, full_name, rank)")
    .eq("user_id", userId)
    .in("status", ["confirmed", "pending_swap"])
    .limit(1)
    .single();

  return { data: data ?? null, error };
}

export async function fetchFutureSessions() {
  const today = format(new Date(), "yyyy-LL-dd");
  // Use RPC to get counts for future sessions
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any).rpc(
    "get_sessions_availability",
    {
      p_start: today,
      p_end: "9999-12-31",
    },
  );
  if (error) return { data: null, error };
  const mapped = ((data as Array<Record<string, unknown>>) ?? []).map((r) => ({
    id: String(r.session_id ?? ""),
    date: String(r.date ?? ""),
    period: (r.period as SessionWithBookings["period"]) ?? ("morning" as const),
    max_capacity: Number(r.max_capacity ?? 0),
    applicators: [],
    status: "open",
    coordinator_id: null,
    created_at: "",
    updated_at: "",
    bookings: [],
    booking_count: Number((r.occupied_count as unknown) ?? 0),
  })) as SessionWithBookings[];
  return { data: mapped, error: null };
}

export async function requestSwap(
  bookingId: string,
  newSessionId: string,
  reason: string,
): Promise<{ success: boolean; error?: string | null }> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId) return { success: false, error: "Not authenticated" };

  try {
    // insert swap request
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("swap_requests").insert({
      booking_id: bookingId,
      requested_by: userId,
      new_session_id: newSessionId,
      reason,
    } as any);

    if (error)
      return {
        success: false,
        error: (error as { message?: string })?.message ?? "Unknown error",
      };

    // optionally update booking status to pending_swap
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updErr } = await (supabase as any)
      .from("bookings")
      .update({ status: "pending_swap" } as any)
      .eq("id", bookingId as any);

    if (updErr) {
      return {
        success: true,
        error: "Swap request saved but failed to update booking status",
      };
    }

    return { success: true };
  } catch (err) {
    const e = err as { message?: string };
    return { success: false, error: e?.message ?? String(err) };
  }
}
