import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";

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
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

import CalendarDay from "./CalendarDay";

export default function CalendarGrid({
  onBookingSuccess: _onBookingSuccess,
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
  const [sessions, setSessions] = useState<SessionWithBookings[]>([]);
  const [loading, setLoading] = useState(false);

  // Effect para carga inicial e mudanças de mês/refreshKey
  useEffect(() => {
    let mounted = true;

    // If parent provided sessions, use them and skip RPC fetch
    if (sessionsProp) {
      setSessions(sessionsProp);
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

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
  }, [current, refreshKey, sessionsProp]);

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
              onSelect={(date) => {
                // Admin explicit day handler
                if (isAdmin && onDayClick) return onDayClick(date);

                // If parent wants the date, notify parent (format yyyy-LL-dd)
                if (onDateSelect) {
                  const dateStr = format(date, "yyyy-LL-dd");
                  return onDateSelect(dateStr);
                }

                // Fallback: do nothing (previously opened internal modal)
              }}
            />
          </div>
        ))}
      </div>

      {loading && sessions.length === 0 && (
        <div className="text-center py-10 text-slate-400 animate-pulse">
          Carregando disponibilidade...
        </div>
      )}
    </Card>
  );
}
