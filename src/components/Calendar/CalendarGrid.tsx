import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "@/components/ui/icons";
import { fetchSessionsByMonth } from "@/services/api";
import type { SessionWithBookings } from "@/types/database.types";
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
import { useMemo, useState } from "react";

import BookingConfirmationModal from "@/components/Booking/BookingConfirmationModal";
import useSupabaseQuery from "@/hooks/useSupabaseQuery";
import { confirmBooking } from "@/services/api";
import { isDateInAllowedWindow } from "@/utils/seasonal";
import { toast } from "sonner";
import CalendarDay from "./CalendarDay";

export default function CalendarGrid({
  isAdmin,
  onDayClick,
  onDateSelect,
  sessions: sessionsProp,
  refreshKey,
  initialDate,
}: {
  onBookingSuccess?: () => void;
  isAdmin?: boolean;
  onDayClick?: (date: Date) => void;
  onDateSelect?: (dateString: string) => void;
  sessions?: SessionWithBookings[];
  refreshKey?: number;
  initialDate?: Date;
}) {
  const [current, setCurrent] = useState<Date>(initialDate ?? new Date());
  // local loading kept for compatibility with previous UI, but primary loading comes from query hook
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySessions, setDaySessions] = useState<SessionWithBookings[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [localRefresh, setLocalRefresh] = useState(0);

  // Use generic query hook to fetch sessions by month when parent doesn't provide sessions
  const year = current.getFullYear();
  const month = current.getMonth() + 1;

  const {
    data: monthResult,
    loading: monthLoading,
    refetch: refetchMonth,
  } = useSupabaseQuery(
    () => fetchSessionsByMonth(year, month),
    [current, refreshKey, localRefresh, sessionsProp],
  );

  // keep an explicit loading flag for compatibility with previous UI
  const effectiveLoading = monthLoading;

  const displayedSessions = sessionsProp ?? monthResult?.data ?? [];

  const days = useMemo(() => {
    return eachDayOfInterval({
      start: startOfMonth(current),
      end: endOfMonth(current),
    });
  }, [current]);

  function sessionsForDay(d: Date) {
    const key = format(d, "yyyy-LL-dd");
    return displayedSessions.filter((s) => s.date === key);
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
              onSelect={(date) => {
                // Admin explicit day handler
                if (isAdmin && onDayClick) return onDayClick(date);

                // If parent wants the date, notify parent (format yyyy-LL-dd)
                if (onDateSelect) {
                  const dateStr = format(date, "yyyy-LL-dd");
                  return onDateSelect(dateStr);
                }

                // Fallback: open internal modal for backward compatibility
                const dateStr = format(date, "yyyy-LL-dd");
                setSelectedDate(dateStr);
                setDaySessions(sessionsForDay(date));
                setIsModalOpen(true);
              }}
            />
          </div>
        ))}
      </div>

      {effectiveLoading && displayedSessions.length === 0 && (
        <div className="text-center py-10 text-slate-400 animate-pulse">
          Carregando disponibilidade...
        </div>
      )}

      <BookingConfirmationModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedDate(null);
        }}
        onConfirm={async (sessionId) => {
          // prevent booking outside seasonal window
          if (selectedDate) {
            const dateObj = new Date(selectedDate);
            if (!isDateInAllowedWindow(dateObj)) {
              toast.error("Data fora da janela de agendamento");
              return;
            }
          }
          try {
            setConfirmLoading(true);
            const res = await confirmBooking(sessionId);
            if (res.success) {
              setIsModalOpen(false);
              setSelectedDate(null);
              // trigger reload (refetch month)
              try {
                await refetchMonth?.();
              } catch {
                // fallback to local refresh counter
                setLocalRefresh((s) => s + 1);
              }
              toast.success("Agendamento confirmado");
            } else {
              toast.error(res.error || "Erro ao agendar");
            }
          } catch {
            toast.error("Erro de conexão");
          } finally {
            setConfirmLoading(false);
          }
        }}
        date={selectedDate}
        availableSessions={daySessions}
        loading={confirmLoading}
      />
    </Card>
  );
}
