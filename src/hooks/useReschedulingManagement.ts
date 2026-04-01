import {
  updateBookingStatus,
  updateSwapRequestStatus,
} from "@/services/bookings";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type SwapRequestRow = Database["public"]["Tables"]["swap_requests"]["Row"];

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

function parseSwapReason(reason: string | null): {
  text: string;
  newDate: string | null;
  attachmentUrl: string | null;
} {
  if (!reason) {
    return { text: "", newDate: null, attachmentUrl: null };
  }
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

type SwapContextRow =
  Database["public"]["Functions"]["get_swap_requests_with_context"]["Returns"][number];

export default function useReschedulingManagement() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<SwapStatus>("solicitado");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RequestRow | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // RPC consolidada: 1 query ao invés de 4 (swap_requests + bookings + sessions + profiles)
      const { data, error } = await supabase.rpc(
        "get_swap_requests_with_context",
      );

      if (error) throw error;
      if (!data || data.length === 0) {
        setRows([]);
        return;
      }

      const contextRows = (data ?? []) as SwapContextRow[];
      const normalizedRows = contextRows.map((row) => {
        const parsedReason = parseSwapReason(
          typeof row.reason === "string" ? row.reason : null,
        );

        return {
          id: row.id,
          bookingId: row.booking_id,
          status: row.status,
          reasonText: parsedReason.text,
          attachmentUrl: parsedReason.attachmentUrl,
          originalDate: row.original_date ?? null,
          newDate: row.new_date ?? parsedReason.newDate,
          fullName: row.full_name ?? "",
          warName: row.war_name ?? "",
          saram: row.saram ?? "",
        } as RequestRow;
      });

      setRows(normalizedRows);
    } catch (error) {
      console.error(error);
      const authMessage = getAuthorizationErrorMessage(
        error,
        "visualizar solicitações de reagendamento",
      );
      toast.error(authMessage ?? "Falha ao carregar solicitações");
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
        const actionContext =
          status === "aprovado"
            ? "aprovar solicitações de reagendamento"
            : "indeferir solicitações de reagendamento";
        const authMessage = getAuthorizationErrorMessage(error, actionContext);
        toast.error(authMessage ?? "Falha ao atualizar solicitação");
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
