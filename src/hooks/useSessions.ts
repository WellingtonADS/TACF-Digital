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
  location_id: string | null;
  location_name: string | null;
  status: SessionStatus;
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
  const EMPTY_RESULT_RETRY_DELAY_MS = 1000;
  const mountedRef = useRef(true);

  const fetchSessions = useCallback(async () => {
    async function loadSessions(attempt = 0): Promise<SessionAvailability[]> {
      const resolvedStart = startDate ?? new Date().toISOString().split("T")[0];
      const resolvedEnd =
        endDate ??
        new Date(Date.now() + DEFAULT_RANGE_DAYS * 24 * 60 * 60 * 1000)
          .toISOString()
          .split("T")[0];

      const { data: sessionsData, error: sessionsError } = await supabase
        .from("sessions")
        .select(
          "id, date, period, max_capacity, location_id, status, location:locations(name)",
        )
        .gte("date", resolvedStart)
        .lte("date", resolvedEnd)
        .order("date", { ascending: true })
        .order("period", { ascending: true });

      if (sessionsError) {
        throw sessionsError;
      }

      const baseSessions = (sessionsData ?? []) as Array<{
        id: string;
        date: string;
        period: string;
        max_capacity: number;
        location_id: string | null;
        status: SessionStatus;
        location:
          | { name?: string | null }
          | Array<{ name?: string | null }>
          | null;
      }>;

      const sessionIds = baseSessions.map((session) => session.id);
      let bookingsBySessionId = new Map<string, number>();

      if (sessionIds.length > 0) {
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("session_id, status")
          .in("session_id", sessionIds);

        if (bookingsError) {
          throw bookingsError;
        }

        bookingsBySessionId = (bookingsData ?? []).reduce((acc, booking) => {
          if (booking.status === "cancelado") {
            return acc;
          }

          acc.set(booking.session_id, (acc.get(booking.session_id) ?? 0) + 1);
          return acc;
        }, new Map<string, number>());
      }

      const nextSessions: SessionAvailability[] = baseSessions.map(
        (session) => {
          const occupied_count = bookingsBySessionId.get(session.id) ?? 0;
          const locationRaw = Array.isArray(session.location)
            ? session.location[0]
            : session.location;

          return {
            session_id: session.id,
            date: session.date,
            period: session.period,
            max_capacity: session.max_capacity,
            location_id: session.location_id,
            location_name: locationRaw?.name ?? null,
            status: session.status,
            occupied_count,
            available_count: Math.max(session.max_capacity - occupied_count, 0),
          };
        },
      );

      if (nextSessions.length === 0 && attempt === 0) {
        await new Promise((resolve) => {
          setTimeout(resolve, EMPTY_RESULT_RETRY_DELAY_MS);
        });
        return loadSessions(attempt + 1);
      }

      return nextSessions;
    }

    if (mountedRef.current) setLoading(true);
    if (mountedRef.current) setError(null);
    try {
      const nextSessions = await loadSessions();

      if (mountedRef.current) {
        setSessions(nextSessions);
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
