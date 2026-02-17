import type { Database, SessionWithBookings } from "@/types/database.types";
import { supabase } from "./supabase";

export async function getAvailableSessions(): Promise<SessionWithBookings[]> {
  // Buscamos as sessões e usamos o recurso do Supabase para contar os bookings relacionados
  const { data, error } = await supabase
    .from<Database["public"]["Tables"]["sessions"]["Row"]>("sessions")
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
  return (data || []).map((session) => {
    const s = session as unknown as Record<string, unknown> & {
      bookings?: Array<{ count?: number }>;
    };
    const booking_count =
      Array.isArray(s.bookings) && s.bookings.length > 0
        ? Number(s.bookings[0].count ?? 0)
        : 0;

    return {
      ...(s as unknown as SessionWithBookings),
      booking_count,
    } as SessionWithBookings;
  });
}
