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
  return (data || []).map((session: unknown) => {
    const s = session as Record<string, unknown>;
    const bookings = s.bookings as unknown;
    let booking_count = 0;
    if (Array.isArray(bookings) && bookings.length > 0) {
      const first = bookings[0] as Record<string, unknown>;
      booking_count = Number(first.count ?? 0);
    }
    return {
      ...(s as unknown as SessionWithBookings),
      booking_count,
    } as SessionWithBookings;
  });
}
