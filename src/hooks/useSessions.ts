import supabase from "@/services/supabase";
import { useCallback, useEffect, useState } from "react";

export type SessionAvailability = {
  session_id: string;
  date: string;
  period: string;
  max_capacity: number;
  occupied_count: number;
  available_count: number;
};

export function useSessions(startDate?: string, endDate?: string) {
  const [sessions, setSessions] = useState<SessionAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: rpcError } = await supabase.rpc(
        "get_sessions_availability",
        {
          p_start: startDate ?? new Date().toISOString().split("T")[0],
          p_end:
            endDate ??
            new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
        },
      );

      if (rpcError) {
        setError(rpcError.message);
        setSessions([]);
      } else {
        setSessions((data as SessionAvailability[]) ?? []);
      }
    } catch (err) {
      setError(String(err));
      setSessions([]);
    } finally {
      setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    fetchSessions();
  }, [fetchSessions]);

  return { sessions, loading, error, refresh: fetchSessions };
}

export default useSessions;
