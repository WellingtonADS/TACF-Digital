/**
 * @module Domínio
 * @page useDashboard
 * @description Descrição concisa da funcionalidade.
 * @path src\hooks\useDashboard.ts
 */

import { fetchUserDashboardFallbackSummary } from "@/services/bookings";
import {
  fetchUserNotifications,
  markUserNotificationAsRead,
} from "@/services/notifications";
import type { NotificationLevel, UserNotification } from "@/types";
import { formatSessionPeriod } from "@/utils/booking";
import { callRpcWithRetry } from "@/utils/rpc";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import useAuth from "./useAuth";

type SessionInfo = {
  id: string;
  date: string; // ISO date
  period: string;
  max_capacity?: number | null;
};

type NotificationItem = {
  id: string;
  title: string;
  description: string;
  level?: NotificationLevel;
  isRead?: boolean;
  createdAt?: string | null;
  source: "system" | "inbox";
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
};

const DASHBOARD_REQUEST_TIMEOUT_MS = 10000;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number) {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error("Dashboard request timeout"));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
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
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [markingNotificationId, setMarkingNotificationId] = useState<
    string | null
  >(null);
  const [refreshTick, setRefreshTick] = useState(0);

  const buildNotifications = useCallback(
    (payload: {
      nextSession: SessionInfo | null;
      bookingsCount: number;
      latestOrderNumber: string | null;
    }) => {
      const notes: NotificationItem[] = [];
      const inspsau = (
        profile as { inspsau_valid_until?: string | null } | null
      )?.inspsau_valid_until;
      if (inspsau) {
        const d = new Date(typeof inspsau === "string" ? inspsau : inspsau);
        const now = new Date();
        const days = Math.ceil(
          (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
        );
        if (days <= 0)
          notes.push({
            id: "inspsau-expirada",
            title: "Inspeção de Saúde vencida",
            description:
              "Sua INSPSAU está vencida — procure a OM para atualizar.",
            level: "warning",
            source: "system",
          });
        else if (days <= 45)
          notes.push({
            id: "inspsau-proxima",
            title: "Inspeção de Saúde próxima",
            description: `Sua INSPSAU vence em ${days} dias.`,
            level: "info",
            source: "system",
          });
      }

      if (payload.nextSession)
        notes.push({
          id: `next-session-${payload.nextSession.id}`,
          title: "Próximo Agendamento",
          description: `Você tem agendamento em ${payload.nextSession.date} (${formatSessionPeriod(payload.nextSession.period)}).`,
          level: "info",
          source: "system",
        });
      else if (payload.bookingsCount === 0)
        notes.push({
          id: "no-bookings",
          title: "Sem agendamentos",
          description: "Você ainda não tem agendamento confirmado.",
          level: "info",
          source: "system",
        });

      if (payload.latestOrderNumber)
        notes.unshift({
          id: `latest-ticket-${payload.latestOrderNumber}`,
          title: "Bilhete disponível",
          description: `Código: ${payload.latestOrderNumber}`,
          source: "system",
        });

      return notes;
    },
    [profile],
  );

  const mapUserNotification = useCallback(
    (item: UserNotification): NotificationItem => ({
      id: item.id,
      title: item.title,
      description: item.message,
      level: item.level,
      isRead: item.is_read,
      createdAt: item.created_at ?? null,
      source: "inbox",
    }),
    [],
  );

  const sortNotifications = useCallback((items: NotificationItem[]) => {
    return [...items].sort((a, b) => {
      const aUnread = a.source === "inbox" && !a.isRead;
      const bUnread = b.source === "inbox" && !b.isRead;
      if (aUnread !== bUnread) {
        return aUnread ? -1 : 1;
      }

      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aTime !== bTime) {
        return bTime - aTime;
      }

      return a.title.localeCompare(b.title);
    });
  }, []);

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
            { timeoutMs: 10000, retries: 2, backoffMs: 500 },
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
                  id: "inspsau-expirada",
                  title: "Inspeção de Saúde vencida",
                  description:
                    "Sua INSPSAU está vencida — procure a OM para atualizar.",
                  level: "warning",
                  source: "system",
                });
              else if (days <= 45)
                notes.push({
                  id: "inspsau-proxima",
                  title: "Inspeção de Saúde próxima",
                  description: `Sua INSPSAU vence em ${days} dias.`,
                  level: "info",
                  source: "system",
                });
            }
            if (cancelled) return;
            setNotifications(notes);
            return;
          } else {
            let payload = payloadCandidate as DashboardPayload;
            let resolvedNextSession: SessionInfo | null = null;

            if (payload?.next_session) {
              resolvedNextSession = {
                id: payload.next_session.session_id,
                date: payload.next_session.date,
                period: payload.next_session.period,
                max_capacity: payload.next_session.max_capacity ?? null,
              };
            }

            if (
              user?.id &&
              Number(payload?.bookings_count ?? 0) === 0 &&
              !resolvedNextSession
            ) {
              try {
                const fallback = await withTimeout(
                  fetchUserDashboardFallbackSummary(user.id),
                  DASHBOARD_REQUEST_TIMEOUT_MS,
                );

                if (fallback.bookingsCount > 0 || fallback.nextSession) {
                  payload = {
                    ...payload,
                    bookings_count: fallback.bookingsCount,
                    results_count: fallback.resultsCount,
                    next_session: fallback.nextSession
                      ? {
                          session_id: fallback.nextSession.sessionId,
                          date: fallback.nextSession.date,
                          period: fallback.nextSession.period,
                          max_capacity:
                            fallback.nextSession.maxCapacity ?? null,
                        }
                      : null,
                    next_session_booking_id:
                      fallback.nextSession?.bookingId ?? null,
                    has_pending_swap: fallback.hasPendingSwap,
                    latest_order_number:
                      fallback.nextSession?.orderNumber ?? null,
                  };

                  resolvedNextSession = fallback.nextSession
                    ? {
                        id: fallback.nextSession.sessionId,
                        date: fallback.nextSession.date,
                        period: fallback.nextSession.period,
                        max_capacity: fallback.nextSession.maxCapacity ?? null,
                      }
                    : null;
                }
              } catch (fallbackError) {
                console.warn(
                  "Dashboard fallback summary failed",
                  fallbackError,
                );
              }
            }

            if (cancelled) return;

            setBookingsCount(Number(payload?.bookings_count ?? 0));
            setResultsCount(Number(payload?.results_count ?? 0));
            setNextSession(resolvedNextSession);
            setNextSessionBookingId(payload?.next_session_booking_id ?? null);
            setHasPendingSwap(Boolean(payload?.has_pending_swap));

            setLatestOrderNumber(payload?.latest_order_number ?? null);
            const [systemNotifications, inboxNotifications] = await Promise.all(
              [
                Promise.resolve(
                  buildNotifications({
                    nextSession: resolvedNextSession,
                    bookingsCount: Number(payload?.bookings_count ?? 0),
                    latestOrderNumber: payload?.latest_order_number ?? null,
                  }),
                ),
                withTimeout(
                  fetchUserNotifications(),
                  DASHBOARD_REQUEST_TIMEOUT_MS,
                )
                  .then((items) => items.map(mapUserNotification))
                  .catch((notificationsError) => {
                    console.error(notificationsError);
                    return [];
                  }),
              ],
            );

            if (cancelled) return;
            setNotifications(
              sortNotifications([
                ...inboxNotifications,
                ...systemNotifications,
              ]),
            );
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
  }, [
    user,
    profile,
    refreshTick,
    buildNotifications,
    mapUserNotification,
    sortNotifications,
  ]);

  return {
    user,
    profile,
    loading: loading || Boolean(authLoading),
    bookingsCount,
    resultsCount,
    nextSession,
    nextSessionBookingId,
    hasPendingSwap,
    latestOrderNumber,
    notifications,
    unreadNotificationsCount: notifications.filter(
      (item) => item.source === "inbox" && !item.isRead,
    ).length,
    markingNotificationId,
    markNotificationAsRead: async (notificationId: string) => {
      setMarkingNotificationId(notificationId);
      try {
        await markUserNotificationAsRead(notificationId);
        setNotifications((current) =>
          sortNotifications(
            current.map((item) =>
              item.id === notificationId ? { ...item, isRead: true } : item,
            ),
          ),
        );
      } catch (error) {
        console.error(error);
        toast.error("Nao foi possivel marcar a notificacao como lida.");
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
