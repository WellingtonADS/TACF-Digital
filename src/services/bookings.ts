import type { BookingWithDetails } from "@/types/database.types";
import { supabase } from "./supabase";

export async function getUserBooking(userId: string) {
  // Buscamos o agendamento que não esteja cancelado para o usuário
  const { data, error } = await supabase
    .from("bookings")
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

  return data as BookingWithDetails | null;
}

// Backwards-compatible alias / clearer name
export const getActiveBooking = getUserBooking;
