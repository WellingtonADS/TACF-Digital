import {
  approveSwapRequest,
  fetchSwapRequestsWithContext,
  rejectSwapRequest,
} from "@/services/bookings";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { translateBookingError } from "@/utils/booking";
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
  createdAt: string | null;
  processedAt: string | null;
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

function getSwapActionErrorMessage(error: unknown): string | null {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const message = raw.toLowerCase();

  if (message.includes("swap request already processed")) {
    return "A solicitação já foi processada por outro operador.";
  }

  if (message.includes("session not open")) {
    return "A sessão de destino não está mais aberta para reagendamento.";
  }

  if (message.includes("session full")) {
    return "A sessão de destino ficou sem vagas durante a aprovação.";
  }

  if (message.includes("booking is not active anymore")) {
    return "O agendamento original não está mais ativo.";
  }

  if (message.includes("user already has active booking this semester")) {
    return "O militar já possui outro agendamento ativo neste semestre. Revise o histórico antes de deferir esta solicitação.";
  }

  if (message.includes("user already approved this semester")) {
    return "O militar já foi registrado como apto/aprovado neste semestre e não pode receber novo agendamento.";
  }

  const bookingMessage = translateBookingError(raw);
  if (bookingMessage) {
    return bookingMessage;
  }

  return null;
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
      const swaps = await fetchSwapRequestsWithContext();

      if (swaps.length === 0) {
        setRows([]);
        return;
      }

      const normalizedRows = swaps.map((swap) => {
        const parsedReason = parseSwapReason(swap.reason);

        return {
          id: swap.id,
          bookingId: swap.booking_id,
          status: swap.status,
          reasonText: parsedReason.text,
          attachmentUrl: parsedReason.attachmentUrl,
          createdAt: swap.created_at,
          processedAt: swap.processed_at,
          originalDate: swap.original_date ?? null,
          newDate: swap.new_date ?? parsedReason.newDate,
          fullName: swap.full_name ?? "",
          warName: swap.war_name ?? "",
          saram: swap.saram ?? "",
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
      _bookingId: string,
      status: Extract<SwapStatus, "aprovado" | "cancelado">,
    ) => {
      try {
        const { data } = await supabase.auth.getUser();
        const adminId = data.user?.id;

        if (status === "aprovado") {
          if (!adminId) {
            throw new Error("Usuário não autenticado");
          }

          const result = await approveSwapRequest(requestId, adminId);
          if (!result.success) {
            throw new Error(
              result.error ?? "Falha ao aprovar solicitação de reagendamento",
            );
          }
        } else {
          if (!adminId) {
            throw new Error("Usuário não autenticado");
          }

          const result = await rejectSwapRequest(requestId, adminId);
          if (!result.success) {
            throw new Error(
              result.error ?? "Falha ao indeferir solicitação de reagendamento",
            );
          }
        }

        toast.success(
          status === "aprovado"
            ? "Reagendamento aprovado e novo agendamento ativo criado."
            : "Solicitação de reagendamento indeferida.",
        );
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
        toast.error(
          authMessage ??
            getSwapActionErrorMessage(error) ??
            "Falha ao atualizar solicitação",
        );
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
