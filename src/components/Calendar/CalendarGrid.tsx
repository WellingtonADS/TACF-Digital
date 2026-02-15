import Card from "@/components/ui/Card";
import { fetchSessionsByMonth } from "@/services/api";
import type { SessionWithBookings } from "@/types/database.types";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  format,
  startOfMonth,
  subMonths,
} from "date-fns";
import { useMemo, useState } from "react";
import CalendarBody from "./CalendarBody";
import CalendarHeader from "./CalendarHeader";

import BookingConfirmationModal from "@/components/Booking/BookingConfirmationModal";
import useSupabaseQuery from "@/hooks/useSupabaseQuery";
import { confirmBooking } from "@/services/api";
import { isDateInAllowedWindow } from "@/utils/seasonal";
import { toast } from "sonner";

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

  function handleDaySelect(date: Date) {
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
    setDaySessions((displayedSessions ?? []).filter((s) => s.date === dateStr));
    setIsModalOpen(true);
  }
  return (
    <Card className="border-0 shadow-none sm:shadow-xl sm:border sm:border-slate-100">
      <CalendarHeader
        current={current}
        onPrev={() => setCurrent(subMonths(current, 1))}
        onNext={() => setCurrent(addMonths(current, 1))}
      />

      <CalendarBody
        days={days}
        current={current}
        displayedSessions={displayedSessions}
        isAdmin={isAdmin}
        onSelect={handleDaySelect}
      />

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
