/**
 * @module Domínio
 * @page useDashboard
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\useDashboard.ts
 */

import {
  fetchUserNotifications,
  markUserNotificationAsRead,
} from "@/services/notifications";
import { formatSessionPeriod } from "@/utils/booking";
import { callRpcWithRetry } from "@/utils/rpc";
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
  id?: string;
  title: string;
  description: string;
  source?: "system" | "in_app";
  isRead?: boolean;
  createdAt?: string | null;
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
  next_session_booking_id?: string | null;
  has_pending_swap?: boolean | null;
  current_operational_status?:
    | "agendado"
    | "reagendamento_solicitado"
    | "sem_agendamento_ativo"
    | null;
  latest_swap_status?: "solicitado" | "aprovado" | "cancelado" | null;
};

function mapInboxNotifications(
  inbox: Awaited<ReturnType<typeof fetchUserNotifications>>,
): NotificationItem[] {
  return [...inbox]
    .sort((a, b) => {
      if (a.is_read !== b.is_read) return a.is_read ? 1 : -1;
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    })
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: item.message,
      source: "in_app",
      isRead: item.is_read,
      createdAt: item.created_at ?? null,
      level: item.is_read ? "info" : "warning",
    }));
}

export default function useDashboard() {
  const { user, profile, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(false);
  const [bookingsCount, setBookingsCount] = useState<number>(0);
  const [resultsCount, setResultsCount] = useState<number>(0);
  const [nextSession, setNextSession] = useState<SessionInfo | null>(null);
  const [nextSessionBookingId, setNextSessionBookingId] = useState<
    string | null
  >(null);
  const [hasPendingSwap, setHasPendingSwap] = useState(false);
  const [latestOrderNumber, setLatestOrderNumber] = useState<string | null>(
    null,
  );
  const [currentOperationalStatus, setCurrentOperationalStatus] = useState<
    DashboardPayload["current_operational_status"]
  >(null);
  const [latestSwapStatus, setLatestSwapStatus] = useState<
    DashboardPayload["latest_swap_status"]
  >(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [markingNotificationId, setMarkingNotificationId] = useState<
    string | null
  >(null);
  const [refreshTick, setRefreshTick] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!user && !profile) return;
      setLoading(true);
      try {
        /* try single RPC first to minimize round-trips */
        const { data: rpcData, error: rpcError } =
          await callRpcWithRetry<unknown>(
            "get_user_dashboard_summary",
            {},
            { timeoutMs: 3000, retries: 1 },
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
            setNextSessionBookingId(null);
            setHasPendingSwap(false);
            setLatestOrderNumber(null);
            setCurrentOperationalStatus("sem_agendamento_ativo");
            setLatestSwapStatus(null);
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
            if (cancelled) return;

            if (user?.id) {
              try {
                const inbox = await fetchUserNotifications(user.id, 8);
                const inboxNotes = mapInboxNotifications(inbox);
                setNotifications([...inboxNotes, ...notes]);
              } catch {
                setNotifications(notes);
              }
            } else {
              setNotifications(notes);
            }
            return;
          } else {
            const payload = payloadCandidate as DashboardPayload;
            let resolvedNextSession: SessionInfo | null = null;

            if (payload?.next_session) {
              resolvedNextSession = {
                id: payload.next_session.session_id,
                date: payload.next_session.date,
                period: payload.next_session.period,
                max_capacity: payload.next_session.max_capacity ?? null,
              };
            }

            if (cancelled) return;

            setBookingsCount(Number(payload?.bookings_count ?? 0));
            setResultsCount(Number(payload?.results_count ?? 0));
            setNextSession(resolvedNextSession);
            setNextSessionBookingId(payload?.next_session_booking_id ?? null);
            setHasPendingSwap(Boolean(payload?.has_pending_swap));

            setLatestOrderNumber(payload?.latest_order_number ?? null);
            setCurrentOperationalStatus(
              payload?.current_operational_status ?? null,
            );
            setLatestSwapStatus(payload?.latest_swap_status ?? null);

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

            if (payload?.current_operational_status === "reagendamento_solicitado") {
              notes.unshift({
                title: "Reagendamento em análise",
                description:
                  "Sua solicitação de reagendamento está pendente de avaliação da coordenação.",
                level: "warning",
              });
            } else if (payload?.latest_swap_status === "cancelado") {
              notes.unshift({
                title: "Reagendamento indeferido",
                description:
                  "A solicitação mais recente de reagendamento foi indeferida.",
                level: "warning",
              });
            }

            if (payload?.latest_order_number)
              notes.unshift({
                title: "Bilhete disponível",
                description: `Código: ${payload.latest_order_number}`,
              });

            if (user?.id) {
              try {
                const inbox = await fetchUserNotifications(user.id, 8);
                const inboxNotes = mapInboxNotifications(inbox);
                setNotifications([...inboxNotes, ...notes]);
              } catch {
                setNotifications(notes);
              }
            } else {
              setNotifications(notes);
            }
            return;
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    // refresh when auth/profile changes
    return () => {
      cancelled = true;
    };
  }, [user, profile, refreshTick]);

  return {
    user,
    profile,
    loading: loading || authLoading,
    bookingsCount,
    resultsCount,
    nextSession,
    nextSessionBookingId,
    hasPendingSwap,
    latestOrderNumber,
    currentOperationalStatus,
    latestSwapStatus,
    notifications,
    unreadNotificationsCount: notifications.filter(
      (item) => item.source === "in_app" && !item.isRead,
    ).length,
    markingNotificationId,
    markNotificationAsRead: async (notificationId: string) => {
      if (!user?.id) return;
      setMarkingNotificationId(notificationId);
      try {
        await markUserNotificationAsRead(notificationId, user.id);
        setNotifications((previous) =>
          previous.map((item) =>
            item.id === notificationId
              ? { ...item, isRead: true, level: "info" }
              : item,
          ),
        );
      } finally {
        setMarkingNotificationId(null);
      }
    },
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

    refresh: async () => {
      setRefreshTick((current) => current + 1);
    },
  } as const;
}
