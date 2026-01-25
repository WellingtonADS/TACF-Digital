import type { SessionWithBookings } from "@/types/database.types";
import { supabase } from "./supabase";

export async function getAvailableSessions() {
  // Buscamos as sessões e usamos o recurso do Supabase para contar os bookings relacionados
  const { data, error } = await supabase
    .from("sessions")
    .select(
      `
      *,
      bookings(count)
    `,
    )
    .eq("status", "open")
    .order("date", { ascending: true });

  if (error) throw error;

  // Formatamos o retorno para facilitar o uso no componente
  return (data || []).map((session: any) => ({
    ...session,
    booking_count: (session.bookings as any)?.[0]?.count ?? 0,
  })) as SessionWithBookings[];
}
