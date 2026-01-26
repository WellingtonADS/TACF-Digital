import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useBooking } from "@/hooks/useBooking";
import { fetchSessionsByMonth } from "@/services/api";
import type { SessionWithBookings } from "@/types/database.types";
import { isDateInAllowedWindow } from "@/utils/seasonal";
import toastUi from "@/utils/toast";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  isSameMonth,
  startOfMonth,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Modal from "../ui/Modal";
import CalendarDay from "./CalendarDay";

// Substituir o uso de `any` por um tipo mais específico
interface ConfirmResult {
  success: boolean;
  data?: {
    success: boolean;
    error: string | null;
    booking_id?: string | null;
    order_number?: string;
  };
  error?: string;
}

export default function CalendarGrid({
  onBookingSuccess,
  isAdmin,
  onDayClick,
  refreshKey,
  initialDate,
}: {
  onBookingSuccess?: () => void;
  isAdmin?: boolean;
  onDayClick?: (date: Date) => void;
  refreshKey?: number;
  initialDate?: Date;
}) {
  const [current, setCurrent] = useState<Date>(initialDate ?? new Date());
  const [sessions, setSessions] = useState<SessionWithBookings[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [confirmingSessionId, setConfirmingSessionId] = useState<string | null>(
    null,
  );
  const [loading, setLoading] = useState(false);

  // Função auxiliar para recarregar dados (sem causar loop no effect)
  const reloadSessions = async (date: Date) => {
    setLoading(true);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const res = await fetchSessionsByMonth(year, month);
    if (res.error) setSessions([]);
    else setSessions(res.data ?? []);
    setLoading(false);
  };

  // Effect para carga inicial e mudanças de mês/refreshKey
  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (mounted) setLoading(true);
      const year = current.getFullYear();
      const month = current.getMonth() + 1;
      const res = await fetchSessionsByMonth(year, month);

      if (mounted) {
        if (res.error) setSessions([]);
        else setSessions(res.data ?? []);
        setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [current, refreshKey]);

  const { confirm } = useBooking();

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(current),
      end: endOfMonth(current),
    });
  }, [current]);

  function sessionsForDay(d: Date) {
    const key = format(d, "yyyy-LL-dd");
    return sessions.filter((s) => s.date === key);
  }

  return (
    <Card className="border-0 shadow-none sm:shadow-xl sm:border sm:border-slate-100">
      {/* Header do Calendário */}
      <div className="flex items-center justify-between mb-8 px-2">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl text-primary hidden sm:block">
            <CalendarIcon size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800 capitalize">
              {format(current, "MMMM", { locale: ptBR })}
            </h2>
            <p className="text-slate-500 font-medium">
              {format(current, "yyyy")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-50 p-1 rounded-xl border border-slate-200">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrent(subMonths(current, 1))}
            className="h-9 w-9 p-0"
          >
            <ChevronLeft size={20} />
          </Button>
          <div className="w-px h-5 bg-slate-200" />
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setCurrent(addMonths(current, 1))}
            className="h-9 w-9 p-0"
          >
            <ChevronRight size={20} />
          </Button>
        </div>
      </div>

      {/* Grid de Dias */}
      <div className="grid grid-cols-7 gap-2 sm:gap-4 mb-4">
        {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map((d) => (
          <div
            key={d}
            className="text-center text-xs font-bold text-slate-400 uppercase tracking-wider"
          >
            {d}
          </div>
        ))}

        {days.map((d) => (
          <div
            key={d.toISOString()}
            className={
              !isSameMonth(d, current) ? "opacity-30 pointer-events-none" : ""
            }
          >
            <CalendarDay
              date={d}
              sessions={sessionsForDay(d)}
              isAdmin={isAdmin}
              onSelect={(date) =>
                isAdmin && onDayClick ? onDayClick(date) : setSelectedDate(date)
              }
            />
          </div>
        ))}
      </div>

      {loading && sessions.length === 0 && (
        <div className="text-center py-10 text-slate-400 animate-pulse">
          Carregando disponibilidade...
        </div>
      )}

      {/* Modal de Confirmação */}
      <Modal
        isOpen={!!selectedDate}
        onClose={() => setSelectedDate(null)}
        title={
          selectedDate
            ? `Agendamento: ${format(selectedDate, "dd/MM/yyyy")}`
            : ""
        }
      >
        {selectedDate &&
          sessionsForDay(selectedDate).map((s) => {
            const booked = s.booking_count ?? s.bookings?.length ?? 0;
            const isFull = booked >= (s.max_capacity ?? 0);

            return (
              <div
                key={s.id}
                className="p-4 mb-3 rounded-xl border bg-slate-50 flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-slate-800">
                    {s.period === "morning" ? "Manhã" : "Tarde"}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Vagas: {booked}/{s.max_capacity}
                  </span>
                </div>
                <Button
                  variant="primary"
                  disabled={confirmingSessionId !== null || isFull}
                  isLoading={confirmingSessionId === s.id}
                  onClick={async () => {
                    const sDate = new Date(`${s.date}T00:00:00`);
                    if (!isDateInAllowedWindow(sDate))
                      return toastUi.seasonalInvalid();

                    setConfirmingSessionId(s.id);
                    const result: ConfirmResult = await confirm(
                      s.id,
                      async () => {
                        await reloadSessions(current); // Refresh manual sem depender do effect
                        setSelectedDate(null);
                      },
                    );
                    setConfirmingSessionId(null);

                    if (result.success) {
                      // Removido o uso de `any` e ajustado para usar o tipo `ConfirmResult`
                      const orderNumber =
                        result.data?.order_number || result.data?.booking_id;

                      if (orderNumber) {
                        toastUi.bookingConfirmed(orderNumber);
                      } else {
                        toastUi.genericError(
                          "Erro: Número do pedido não encontrado.",
                        );
                      }

                      onBookingSuccess?.();
                    } else {
                      toastUi.genericError(result.error ?? "Erro ao agendar");
                    }
                  }}
                >
                  {isFull ? "Lotado" : "Confirmar"}
                </Button>
              </div>
            );
          })}
      </Modal>
    </Card>
  );
}
