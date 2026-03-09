import supabase from "@/services/supabase";
import { formatSessionPeriod } from "@/utils/booking";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import useAuth from "./useAuth";

export type TicketData = {
  name: string;
  saram: string;
  location: string;
  date: string;
  time: string;
  code: string;
  confirmed?: boolean;
};

interface TicketRouteState {
  bookingId?: string;
  orderNumber?: string | null;
  sessionId?: string;
}

/**
 * Hook encarregado de carregar os dados do bilhete digital. A fonte
 * primária de informação é o estado passado via rota (`bookingId`
 * / `orderNumber`), mas o hook também consegue abrir o último agendamento
 * do usuário quando nenhum ID é fornecido.
 *
 * Se a propriedade `initial` for passada, ela será utilizada como
 * fallback imediato (por exemplo, quando o componente pai já tiver os
 * dados em cache) e o código de validação será sobrescrito pelo
 * `orderNumber` do estado da rota caso esteja presente.
 */
export default function useTicket(initial?: TicketData) {
  const { user } = useAuth();
  const location = useLocation();
  const routeState = (location.state as TicketRouteState | null) ?? null;

  const [ticket, setTicket] = useState<TicketData | null>(initial ?? null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      try {
        const bookingId = routeState?.bookingId;

        // caso não haja bookingId e exista ticket inicial, usamos ele
        if (!bookingId && initial) {
          setTicket((prev) => ({
            ...(prev ?? initial),
            code: routeState?.orderNumber ?? initial.code,
            confirmed: true,
          }));
          return;
        }

        let resolvedBookingId = bookingId;

        // se ainda não temos um id, tentamos achar o último agendamento do
        // usuário logado (require user.id)
        if (!resolvedBookingId) {
          const uid = user?.id;
          if (!uid) return; // nada que fazer se não houver usuário

          const { data: latestBooking } = await supabase
            .from("bookings")
            .select("id, order_number")
            .eq("user_id", uid)
            .order("created_at", { ascending: false })
            .limit(1)
            .maybeSingle();

          if (!latestBooking) return;
          resolvedBookingId = latestBooking.id;
        }

        const { data: bookingData } = await supabase
          .from("bookings")
          .select("id, user_id, session_id, order_number, status")
          .eq("id", resolvedBookingId)
          .maybeSingle();

        if (!bookingData || cancelled) return;

        const [sessionResp, profileResp] = await Promise.all([
          supabase
            .from("sessions")
            .select("id, date, period, location:locations(name)")
            .eq("id", bookingData.session_id)
            .maybeSingle(),
          supabase
            .from("profiles")
            .select("id, war_name, full_name, saram")
            .eq("id", bookingData.user_id)
            .maybeSingle(),
        ]);

        if (cancelled) return;

        const sessionData = sessionResp.data;
        const profileData = profileResp.data;

        const locRaw = sessionData?.location as
          | { name?: string | null }[]
          | { name?: string | null }
          | null
          | undefined;
        const locName = Array.isArray(locRaw)
          ? (locRaw[0]?.name ?? null)
          : (locRaw?.name ?? null);

        setTicket((prev) => ({
          ...(prev ?? {}),
          name:
            profileData?.war_name ?? profileData?.full_name ?? prev?.name ?? "",
          saram: profileData?.saram ?? prev?.saram ?? "",
          location: locName ?? prev?.location ?? "",
          date: sessionData?.date
            ? formatTicketDate(sessionData.date)
            : (prev?.date ?? ""),
          time: sessionData?.period
            ? formatSessionPeriod(sessionData.period)
            : (prev?.time ?? ""),
          code:
            bookingData.order_number ??
            routeState?.orderNumber ??
            prev?.code ??
            "",
          confirmed: bookingData.status === "confirmed",
        }));
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();

    return () => {
      cancelled = true;
    };
  }, [routeState?.bookingId, routeState?.orderNumber, initial, user?.id]);

  return { ticket, loading } as const;
}

// utilidade isolada para manter o hook enxuto
function formatTicketDate(date: string): string {
  return new Date(date)
    .toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    .replace(".", "")
    .toUpperCase();
}
