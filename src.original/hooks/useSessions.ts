import { supabase } from "@/services/supabase";
import type { SessionWithBookings } from "@/types/database.types";
import { useCallback, useEffect, useState } from "react";

export type SessionFilters = {
  date?: string;
  period?: "morning" | "afternoon";
};

export default function useSessions(filters?: SessionFilters) {
  const [sessions, setSessions] = useState<SessionWithBookings[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      let query = supabase.from("sessions").select("*, bookings(*)");

      if (filters?.date) query = query.eq("date", filters.date);
      if (filters?.period) query = query.eq("period", filters.period);

      // order by date asc
      // @ts-expect-error supabase typings for chained order on this builder are noisy
      const { data, error } = await (query.order
        ? query.order("date", { ascending: true })
        : query);

      if (error) {
        throw error;
      }

      setSessions((data as unknown as SessionWithBookings[]) || []);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setError(msg ?? "Unknown error");
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refetch: fetchSessions } as const;
}
