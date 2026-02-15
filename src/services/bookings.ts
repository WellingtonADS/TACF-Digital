import type { BookingWithDetails, Database } from "@/types/database.types";
import { supabase } from "./supabase";

export async function getUserBooking(
  userId: string,
): Promise<BookingWithDetails | null> {
  // Buscamos o agendamento que não esteja cancelado para o usuário
  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["bookings"]["Row"]>("bookings")
    .select(
      `
      *,
      session:sessions(*)
    `,
    )
    .eq("user_id", userId)
    .neq("status", "cancelled")
    .maybeSingle(); // Retorna nulo se não existir, sem disparar erro

  if (error) {
    console.error("Erro ao buscar agendamento:", error);
    return null;
  }

  return (data as unknown as BookingWithDetails) ?? null;
}

// Backwards-compatible alias / clearer name
export const getActiveBooking = getUserBooking;

import { confirmarAgendamentoRPC } from "./supabase";

export async function confirmBooking(sessionId: string): Promise<{
  success: boolean;
  error: string | null;
  booking_id?: string | null;
  order_number?: string | null;
}> {
  const { data: userData } = await supabase.auth.getUser();
  const userId = userData?.user?.id;
  if (!userId)
    return { success: false, error: "Not authenticated", booking_id: null };

  const res = await confirmarAgendamentoRPC(userId, sessionId);
  if (!res.success)
    return {
      success: false,
      error: res.error ?? "Unknown error",
      booking_id: res.booking_id ?? null,
      order_number: res.order_number ?? null,
    };

  return {
    success: true,
    error: null,
    booking_id: res.booking_id ?? null,
    order_number: res.order_number ?? null,
  };
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
    const { error } = await supabase
      .from<
        Database["public"]["Tables"]["swap_requests"]["Insert"]
      >("swap_requests")
      .insert({
        booking_id: bookingId,
        requested_by: userId,
        new_session_id: newSessionId,
        reason,
      });

    if (error)
      return {
        success: false,
        error: (error as { message?: string })?.message ?? "Unknown error",
      };

    const { error: updErr } = await supabase
      .from<Database["public"]["Tables"]["bookings"]["Update"]>("bookings")
      .update({ status: "pending_swap" })
      .eq("id", bookingId);

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
