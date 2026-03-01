import type { Database } from "@/types/database.types";
import supabase, { confirmarAgendamentoRPC } from "./supabase";

export async function getSessions() {
  // placeholder: implement real call to supabase RPC or table
  return [] as unknown[];
}

export async function confirmBooking(userId: string, sessionId: string) {
  return confirmarAgendamentoRPC(userId, sessionId);
}

export async function fetchSwapRequests() {
  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["bookings"]["Row"]>("bookings")
    .select("*")
    .not("swap_reason", "is", null);
  if (error) throw error;
  return data ?? [];
}

export async function updateBookingStatus(bookingId: string, status: string) {
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

export async function createSwapRequest(params: SwapRequestParams) {
  let attachmentUrl: string | null = null;

  if (params.attachment) {
    const fileExt = params.attachment.name.split(".").pop() || "";
    const fileName = `${params.bookingId}_${Date.now()}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("swap-attachments")
      .upload(fileName, params.attachment);
    if (uploadError) throw uploadError;

    const { publicURL } = supabase.storage
      .from("swap-attachments")
      .getPublicUrl(uploadData.path);
    attachmentUrl = publicURL;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const payload: any = {
    booking_id: params.bookingId,
    requested_by: params.requestedBy,
    new_session_id: null,
    reason: JSON.stringify({
      text: params.reasonText,
      new_date: params.newDate,
      attachment_url: attachmentUrl,
    }),
  };

  const { data, error } = await supabase
    .from("swap_requests")
    .insert([payload]);
  if (error) throw error;
  return data;
}

export default {
  getSessions,
  confirmBooking,
  fetchSwapRequests,
  updateBookingStatus,
};
