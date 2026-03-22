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

  const payload: Partial<SwapInsertStrict> = {
    booking_id: params.bookingId,
    requested_by: params.requestedBy,
    reason: JSON.stringify({
      text: params.reasonText,
      new_date: params.newDate,
      attachment_url: attachmentUrl,
    }),
  };

  // only include new_session_id when available (DB types may differ between generated types and runtime)
  if (params.newDate) {
    // here we don't have a session id, so we intentionally omit new_session_id (keeps compatibility)
  }

  const { data, error } = await supabase
    .from("swap_requests")
    .insert([payload as SwapInsertStrict]);
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

export default {
  getSessions,
  confirmBooking,
  fetchSwapRequests,
  updateSwapRequestStatus,
  updateBookingStatus,
  fetchPendingSwapBookings,
  fetchAdminMetrics,
};
