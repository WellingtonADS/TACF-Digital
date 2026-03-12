import {
  fetchSwapRequests,
  updateBookingStatus,
  updateSwapRequestStatus,
} from "@/services/bookings";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SwapRequestRow = Database["public"]["Tables"]["swap_requests"]["Row"];
type BookingRow = Database["public"]["Tables"]["bookings"]["Row"];

export type SwapStatus = SwapRequestRow["status"];

export type RequestRow = {
  id: string;
  bookingId: string;
  status: SwapStatus;
  reasonText: string;
  attachmentUrl: string | null;
  originalDate: string | null;
  newDate: string | null;
  fullName: string;
  warName: string;
  saram: string;
};

type ReasonPayload = {
  text?: string;
  new_date?: string;
  attachment_url?: string;
};

function parseSwapReason(reason: string): {
  text: string;
  newDate: string | null;
  attachmentUrl: string | null;
} {
  try {
    const parsed = JSON.parse(reason) as ReasonPayload;
    return {
      text: parsed.text ?? reason,
      newDate: parsed.new_date ?? null,
      attachmentUrl: parsed.attachment_url ?? null,
    };
  } catch {
    return { text: reason, newDate: null, attachmentUrl: null };
  }
}

export default function useReschedulingManagement() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SwapStatus>("solicitado");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RequestRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const swaps = (await fetchSwapRequests()) as SwapRequestRow[];

      if (swaps.length === 0) {
        setRows([]);
        return;
      }

      const bookingIds = Array.from(
        new Set(swaps.map((swap) => swap.booking_id)),
      ).filter((id): id is string => Boolean(id));

      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("id,user_id,session_id")
        .in("id", bookingIds);

      if (bookingsError) throw bookingsError;

      const bookings = (bookingsData ?? []) as Pick<
        BookingRow,
        "id" | "user_id" | "session_id"
      >[];
      const bookingsById = new Map<string, (typeof bookings)[number]>(
        bookings.map((booking) => [booking.id, booking]),
      );

      const sessionIds = Array.from(
        new Set([
          ...bookings.map((booking) => booking.session_id),
          ...swaps.map((swap) => swap.new_session_id),
        ]),
      ).filter((id): id is string => Boolean(id));

      const sessionsById = new Map<string, string>();
      if (sessionIds.length > 0) {
        const { data: sessionsData, error: sessionsError } = await supabase
          .from("sessions")
          .select("id,date")
          .in("id", sessionIds);

        if (sessionsError) throw sessionsError;
        sessionsData?.forEach((session) =>
          sessionsById.set(session.id, session.date),
        );
      }

      const userIds = Array.from(
        new Set(bookings.map((booking) => booking.user_id)),
      );
      const profilesByUser = new Map<
        string,
        { full_name: string; war_name: string; saram: string }
      >();

      if (userIds.length > 0) {
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("id,full_name,war_name,saram")
          .in("id", userIds);

        if (profilesError) throw profilesError;

        profilesData?.forEach((profile) => {
          profilesByUser.set(profile.id, {
            full_name: profile.full_name ?? "",
            war_name: profile.war_name ?? "",
            saram: profile.saram ?? "",
          });
        });
      }

      const normalizedRows = swaps.map((swap) => {
        const booking = bookingsById.get(swap.booking_id);
        const profile = booking
          ? profilesByUser.get(booking.user_id)
          : undefined;
        const parsedReason = parseSwapReason(swap.reason);

        return {
          id: swap.id,
          bookingId: swap.booking_id,
          status: swap.status,
          reasonText: parsedReason.text,
          attachmentUrl: parsedReason.attachmentUrl,
          originalDate: booking
            ? (sessionsById.get(booking.session_id) ?? null)
            : null,
          newDate:
            sessionsById.get(swap.new_session_id) ?? parsedReason.newDate,
          fullName: profile?.full_name ?? "",
          warName: profile?.war_name ?? "",
          saram: profile?.saram ?? "",
        } as RequestRow;
      });

      setRows(normalizedRows);
    } catch (error) {
      console.error(error);
      toast.error("Falha ao carregar solicitações");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(
    () =>
      rows.reduce(
        (acc, row) => {
          acc[row.status] += 1;
          return acc;
        },
        { solicitado: 0, aprovado: 0, cancelado: 0 },
      ),
    [rows],
  );

  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return rows.filter((row) => {
      if (row.status !== statusFilter) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const target =
        `${row.fullName} ${row.warName} ${row.saram}`.toLowerCase();
      return target.includes(normalizedQuery);
    });
  }, [rows, statusFilter, query]);

  const changeStatus = useCallback(
    async (
      requestId: string,
      bookingId: string,
      status: Extract<SwapStatus, "aprovado" | "cancelado">,
    ) => {
      try {
        const { data } = await supabase.auth.getUser();
        const adminId = data.user?.id;

        await updateSwapRequestStatus(requestId, status, adminId);

        if (status === "aprovado") {
          await updateBookingStatus(bookingId, "remarcado");
        }

        toast.success("Registro atualizado");
        setRows((currentRows) =>
          currentRows.map((row) =>
            row.id === requestId ? { ...row, status } : row,
          ),
        );
        setSelected((currentSelected) =>
          currentSelected?.id === requestId
            ? { ...currentSelected, status }
            : currentSelected,
        );
      } catch (error) {
        console.error(error);
        toast.error("Falha ao atualizar solicitação");
      }
    },
    [],
  );

  return {
    rows,
    loading,
    statusFilter,
    setStatusFilter,
    query,
    setQuery,
    selected,
    setSelected,
    counts,
    visibleRows,
    changeStatus,
    reload: load,
  } as const;
}
