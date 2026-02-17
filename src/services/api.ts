import type { Database, SessionWithBookings } from "@/types/database.types";
import { endOfMonth, format, startOfMonth } from "date-fns";
import { supabase } from "./supabase";

type ApproveSwapResult = { success: boolean; error: string | null };
type UpdateSessionScoresResult = { success: boolean; error?: string | null };

type SessionAvailabilityRow = {
  session_id: string;
  date: string;
  period: SessionWithBookings["period"];
  max_capacity: number;
  occupied_count: number;
};

// Bookings-related functions re-implemented in `src/services/bookings.ts` and re-exported below.
export {
  confirmBooking,
  getActiveBooking,
  getUserBooking,
  requestSwap,
} from "./bookings";

export async function approveSwap(
  requestId: string,
  adminId: string,
): Promise<ApproveSwapResult> {
  const { data, error } = await supabase.rpc("approve_swap", {
    p_request_id: requestId,
    p_admin_id: adminId,
  } as unknown as never);

  if (error) return { success: false, error: error.message };

  const row = Array.isArray(data)
    ? (data[0] as unknown as ApproveSwapResult)
    : (data as unknown as ApproveSwapResult);
  return { success: row?.success === true, error: row?.error ?? null };
}

export async function updateSessionScores(
  sessionId: string,
  userId: string,
  attendanceConfirmed: boolean,
): Promise<UpdateSessionScoresResult> {
  const { data, error } = await supabase.rpc("update_session_scores", {
    p_session_id: sessionId,
    p_user_id: userId,
    p_attendance_confirmed: attendanceConfirmed,
  } as unknown as never);

  if (error) return { success: false, error: error.message };

  const row = Array.isArray(data)
    ? (data[0] as unknown as UpdateSessionScoresResult)
    : (data as unknown as UpdateSessionScoresResult);
  return { success: row?.success === true, error: row?.error ?? null };
}

export async function fetchSessionsByMonth(
  year: number,
  month: number,
): Promise<{ data: SessionWithBookings[] | null; error: string | null }> {
  // month is 1-12
  const d = new Date(year, month - 1, 1);
  const start = format(startOfMonth(d), "yyyy-LL-dd");
  const end = format(endOfMonth(d), "yyyy-LL-dd");

  // Use server-side RPC that returns counts without PII

  const { data, error } = await supabase.rpc("get_sessions_availability", {
    p_start: start,
    p_end: end,
  } as unknown as never);

  if (error) return { data: null, error: error.message };

  const rows = (data as unknown as SessionAvailabilityRow[]) ?? [];

  const mapped = rows.map((r) => ({
    id: String(r.session_id ?? ""),
    date: String(r.date ?? ""),
    period: r.period ?? ("morning" as const),
    max_capacity: Number(r.max_capacity ?? 0),
    applicators: [] as string[],
    status: "open" as const,
    coordinator_id: null,
    created_at: "",
    updated_at: "",
    bookings: [],
    booking_count: Number(r.occupied_count ?? 0),
  })) as SessionWithBookings[];

  return { data: mapped, error: null };
}

// getUserBooking moved to bookings.ts

export async function fetchFutureSessions(): Promise<{
  data: SessionWithBookings[] | null;
  error: string | null;
}> {
  const today = format(new Date(), "yyyy-LL-dd");
  // Use RPC to get counts for future sessions

  const { data, error } = await supabase.rpc("get_sessions_availability", {
    p_start: today,
    p_end: "9999-12-31",
  } as unknown as never);
  if (error) return { data: null, error: error.message };
  const rows = (data as unknown as SessionAvailabilityRow[]) ?? [];
  const mapped = rows.map((r) => ({
    id: String(r.session_id ?? ""),
    date: String(r.date ?? ""),
    period: r.period ?? ("morning" as const),
    max_capacity: Number(r.max_capacity ?? 0),
    applicators: [] as string[],
    status: "open" as const,
    coordinator_id: null,
    created_at: "",
    updated_at: "",
    bookings: [],
    booking_count: Number(r.occupied_count ?? 0),
  })) as SessionWithBookings[];
  return { data: mapped, error: null };
}

// requestSwap moved to bookings.ts

import { upsertSession as upsertAdminSession } from "./admin/sessions";

export async function createSession(sessionData: {
  date: string;
  period: "morning" | "afternoon";
  max_capacity: number;
}): Promise<{
  data: Database["public"]["Tables"]["sessions"]["Row"] | null;
  error: string | null;
}> {
  // reuse admin upsert to keep DB logic in one place and avoid duplicate typing
  const row = {
    date: sessionData.date,
    period: sessionData.period,
    max_capacity: sessionData.max_capacity,
    applicators: [] as string[],
    status: "open" as const,
  };

  const res = await upsertAdminSession(row);
  if ("error" in res) return { data: null, error: res.error ?? null };

  const created = (res.data ?? [])[0] ?? null;
  return { data: created ?? null, error: null };
}

export async function deleteSession(
  sessionId: string,
): Promise<{ success: boolean; error?: string | null }> {
  const { error } = await supabase
    .from("sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    if (import.meta.env.DEV) {
      console.error("Error deleting session:", error);
    }
    return { success: false, error: error.message };
  }
  return { success: true };
}
