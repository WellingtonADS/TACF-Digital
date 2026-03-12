/**
 * @module Domínio
 * @page useSessions
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\useSessions.ts
 */


import supabase from "@/services/supabase";
import { useCallback, useEffect, useRef, useState } from "react";

export type SessionAvailability = {
  session_id: string;
  date: string;
  period: string;
  max_capacity: number;
  /** bigint retornado pelo Postgres, mapeado para number no JS */
  occupied_count: number;
  available_count: number;
};

export function useSessions(startDate?: string, endDate?: string) {
  const [sessions, setSessions] = useState<SessionAvailability[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // número de dias padrão para range quando não informado (reutilizável localmente)
  const DEFAULT_RANGE_DAYS = 60;
  const mountedRef = useRef(true);

  const fetchSessions = useCallback(async () => {
    if (mountedRef.current) setLoading(true);
    if (mountedRef.current) setError(null);
    try {
      const { data: rpcRaw, error: rpcError } = await supabase.rpc(
        "get_sessions_availability",
        {
          p_start: startDate ?? new Date().toISOString().split("T")[0],
          p_end:
            endDate ??
            new Date(Date.now() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000)
              .toISOString()
              .split("T")[0],
        },
      );

      if (rpcError) {
        if (mountedRef.current) setError(rpcError.message);
        console.error("useSessions RPC error:", rpcError);
        if (mountedRef.current) setSessions([]);
      } else if (!Array.isArray(rpcRaw)) {
        // if RPC returns unexpected shape, log and fallback
        console.warn(
          "get_sessions_availability RPC returned unexpected shape",
          {
            sample: rpcRaw,
          },
        );
        if (mountedRef.current) setError("Resposta inesperada do servidor");
        if (mountedRef.current) setSessions([]);
      } else {
        if (mountedRef.current)
          setSessions((rpcRaw as SessionAvailability[]) ?? []);
      }
    } catch (err) {
      if (mountedRef.current) setError(String(err));
      if (mountedRef.current) setSessions([]);
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, [startDate, endDate]);

  useEffect(() => {
    mountedRef.current = true;
    fetchSessions();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchSessions]);

  return { sessions, loading, error, refresh: fetchSessions };
}

export default useSessions;
