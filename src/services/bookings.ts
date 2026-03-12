import type { Database } from "@/types/database.types";
import supabase, { confirmarAgendamentoRPC } from "./supabase";

export async function getSessions() {
  // Placeholder: implementar apenas quando houver uso real.
  // Mantido como lembrete, mas evite implementações até que sejam necessárias.
  return [] as unknown[];
}

export async function confirmBooking(userId: string, sessionId: string) {
  return confirmarAgendamentoRPC(userId, sessionId);
}

export async function fetchSwapRequests() {
  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .not("swap_reason", "is", null);
  if (error) throw error;
  return data ?? [];
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

export default {
  getSessions,
  confirmBooking,
  fetchSwapRequests,
  updateBookingStatus,
};
