/**
 * @module Domínio
 * @page useSessions
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\useSessions.ts
 */

import supabase from "@/services/supabase";
import type { SessionStatus } from "@/types/database.types";
import { useCallback, useEffect, useRef, useState } from "react";

export type SessionAvailability = {
  session_id: string;
  date: string;
  period: string;
  max_capacity: number;
  /** bigint retornado pelo Postgres, mapeado para number no JS */
  occupied_count: number;
  available_count: number;
  status: SessionStatus;
  location_name: string | null;
};

type SessionAvailabilityRpcRow = Omit<
  SessionAvailability,
  "status" | "location_name"
>;

type SessionMetaRow = {
  id: string;
  status: SessionStatus;
  location:
    | {
        name?: string | null;
      }
    | Array<{
        name?: string | null;
      }>
    | null;
};

function extractLocationName(
  location: SessionMetaRow["location"],
): string | null {
  const rawLocation = Array.isArray(location) ? location[0] : location;
  return rawLocation?.name?.trim() || null;
}

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

    const effectiveStartDate =
      startDate ?? new Date().toISOString().split("T")[0];
    const effectiveEndDate =
      endDate ??
      new Date(Date.now() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0];

    try {
      const [availabilityResponse, sessionMetaResponse] = await Promise.all([
        supabase.rpc("get_sessions_availability", {
          p_start: effectiveStartDate,
          p_end: effectiveEndDate,
        }),
        supabase
          .from("sessions")
          .select("id, status, location:locations(name)")
          .gte("date", effectiveStartDate)
          .lte("date", effectiveEndDate),
      ]);

      const { data: rpcRaw, error: rpcError } = availabilityResponse;
      const { data: sessionMetaRows, error: sessionMetaError } =
        sessionMetaResponse;

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
        if (sessionMetaError) {
          console.error("useSessions metadata error:", sessionMetaError);
        }

        const sessionMetaMap = new Map(
          ((sessionMetaRows as SessionMetaRow[] | null) ?? []).map((row) => [
            row.id,
            {
              status: row.status,
              locationName: extractLocationName(row.location),
            },
          ]),
        );

        const normalizedSessions = (rpcRaw as SessionAvailabilityRpcRow[]).map(
          (session) => {
            const sessionMeta = sessionMetaMap.get(session.session_id);

            return {
              ...session,
              status: sessionMeta?.status ?? "open",
              location_name: sessionMeta?.locationName ?? null,
            };
          },
        );

        if (mountedRef.current) setSessions(normalizedSessions);
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
