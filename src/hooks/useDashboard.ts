/**
 * @module Domínio
 * @page useDashboard
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\useDashboard.ts
 */


import { supabase } from "@/services/supabase";
import { formatSessionPeriod } from "@/utils/booking";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import useAuth from "./useAuth";

type SessionInfo = {
  id: string;
  date: string; // ISO date
  period: string;
  max_capacity?: number | null;
};

type NotificationItem = {
  title: string;
  description: string;
  level?: "info" | "warning" | "error";
};

type NextSessionRpc = {
  session_id: string;
  date: string;
  period: string;
  max_capacity?: number | null;
};

type DashboardPayload = {
  bookings_count?: number | null;
  results_count?: number | null;
  next_session?: NextSessionRpc | null;
  latest_order_number?: string | null;
};

export default function useDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [resultsCount, setResultsCount] = useState<number>(0);
  const [nextSession, setNextSession] = useState<SessionInfo | null>(null);
  const [latestOrderNumber, setLatestOrderNumber] = useState<string | null>(
    null,
  );
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  useEffect(() => {
    async function load() {
      if (!user && !profile) return;
      setLoading(true);
      try {
        /* try single RPC first to minimize round-trips */
        const { data: rpcData, error: rpcError } = await supabase.rpc(
          "get_user_dashboard_summary",
        );
        if (!rpcError && rpcData) {
          const payloadCandidate = Array.isArray(rpcData)
            ? rpcData[0]
            : (rpcData as unknown as DashboardPayload);

          const isValid = (p: unknown): p is DashboardPayload => {
            if (!p || typeof p !== "object") return false;
            // basic structural checks: counts are present (may be null) and next_session if present is an object
            const okCounts = true; // counts may be absent depending on RPC, accept and validate later
            const okNext =
              !("next_session" in p) || typeof p.next_session === "object";
            return okCounts && okNext;
          };

          if (!isValid(payloadCandidate)) {
            console.warn(
              "get_user_dashboard_summary RPC returned unexpected shape",
              { sample: payloadCandidate },
            );
            toast.error(
              "Resposta inesperada do servidor ao carregar o resumo do dashboard.",
            );
            // do not run client-side fallbacks here; prefer a single source of truth (RPC)
            setBookingsCount(0);
            setResultsCount(0);
            setNextSession(null);
            setLatestOrderNumber(null);
            // derive minimal notifications from profile only
            const notes: NotificationItem[] = [];
            const inspsau = (
              profile as { inspsau_valid_until?: string | null } | null
            )?.inspsau_valid_until;
            if (inspsau) {
              const d = new Date(
                typeof inspsau === "string" ? inspsau : inspsau,
              );
              const now = new Date();
              const days = Math.ceil(
                (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              if (days <= 0)
                notes.push({
                  title: "Inspeção de Saúde vencida",
                  description:
                    "Sua INSPSAU está vencida — procure a OM para atualizar.",
                  level: "warning",
                });
              else if (days <= 45)
                notes.push({
                  title: "Inspeção de Saúde próxima",
                  description: `Sua INSPSAU vence em ${days} dias.`,
                  level: "info",
                });
            }
            setNotifications(notes);
            setLoading(false);
            return;
          } else {
            const payload = payloadCandidate as DashboardPayload;
            setBookingsCount(Number(payload?.bookings_count ?? 0));
            setResultsCount(Number(payload?.results_count ?? 0));
            if (payload?.next_session) {
              setNextSession({
                id: payload.next_session.session_id,
                date: payload.next_session.date,
                period: payload.next_session.period,
                max_capacity: payload.next_session.max_capacity ?? null,
              });
            } else {
              setNextSession(null);
            }

            setLatestOrderNumber(payload?.latest_order_number ?? null);

            const notes: NotificationItem[] = [];
            const inspsau = (
              profile as { inspsau_valid_until?: string | null } | null
            )?.inspsau_valid_until;
            if (inspsau) {
              const d = new Date(
                typeof inspsau === "string" ? inspsau : inspsau,
              );
              const now = new Date();
              const days = Math.ceil(
                (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
              );
              if (days <= 0)
                notes.push({
                  title: "Inspeção de Saúde vencida",
                  description:
                    "Sua INSPSAU está vencida — procure a OM para atualizar.",
                  level: "warning",
                });
              else if (days <= 45)
                notes.push({
                  title: "Inspeção de Saúde próxima",
                  description: `Sua INSPSAU vence em ${days} dias.`,
                  level: "info",
                });
            }

            if (payload?.next_session)
              notes.push({
                title: "Próximo Agendamento",
                description: `Você tem agendamento em ${payload.next_session.date} (${formatSessionPeriod(payload.next_session.period)}).`,
                level: "info",
              });
            else if (Number(payload?.bookings_count ?? 0) === 0)
              notes.push({
                title: "Sem agendamentos",
                description: "Você ainda não tem agendamento confirmado.",
                level: "info",
              });

            if (payload?.latest_order_number)
              notes.unshift({
                title: "Bilhete disponível",
                description: `Código: ${payload.latest_order_number}`,
              });

            setNotifications(notes);
            setLoading(false);
            return;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    load();
    // refresh when auth/profile changes
  }, [user, profile]);

  return {
    user,
    profile,
    loading: loading || authLoading,
    bookingsCount,
    resultsCount,
    nextSession,
    latestOrderNumber,
    notifications,
    // Derived status for INSPSAU to avoid duplicating presentation logic in components
    inspsauStatus: (() => {
      const inspsau = (
        profile as { inspsau_valid_until?: string | null } | null
      )?.inspsau_valid_until;
      const defaultStatus = {
        label: "Inapto",
        color: "text-white bg-error border border-error",
      } as const;

      if (!inspsau) return defaultStatus;
      const parsed = new Date(typeof inspsau === "string" ? inspsau : inspsau);
      if (isNaN(parsed.getTime())) return defaultStatus;
      if (parsed.getTime() > Date.now())
        return {
          label: "Apto",
          color: "text-white bg-success border border-success",
        } as const;
      return defaultStatus;
    })(),

    refresh: async () => {},
  } as const;
}
