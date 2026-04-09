/**
 * @page Scheduling
 * @description Interface de agendamento de sessões.
 * @path src/pages/Scheduling.tsx
 */

import CustomCalendar, {
  type CalendarDayState,
} from "@/components/atomic/CustomCalendar";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import TicketModal from "@/components/TicketModal";
import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import { Calendar, Check, ChevronRight, Clock, Hash, MapPin } from "@/icons";
import { fetchSessionLocationBySessionId } from "@/services/locations";
import {
  fetchBookedDatesForUser,
  formatSessionPeriod,
} from "@/utils/booking";
import { formatDatePtBr } from "@/utils/date";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AppIcon from "../components/atomic/AppIcon";
import PageSkeleton from "../components/PageSkeleton";

type SessionLocation = {
  name: string | null;
  address: string | null;
};

function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const Scheduling = () => {
  const navigate = useNavigate();
  // useDashboard was previously called here but its return value was unused.
  // Removed to avoid unnecessary work (hook runs only where its data is consumed).
  const [showTicketModal, setShowTicketModal] = useState(false);

  const [viewDate, setViewDate] = useState(() => new Date());
  const startOfMonth = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1);
  const endOfMonth = new Date(
    viewDate.getFullYear(),
    viewDate.getMonth() + 1,
    0,
  );
  const startStr = toDateKey(startOfMonth);
  const endStr = toDateKey(endOfMonth);

  const { sessions, loading } = useSessions(startStr, endStr);

  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);
  const [sessionLocation, setSessionLocation] =
    useState<SessionLocation | null>(null);
  const [locationLoading, setLocationLoading] = useState(false);
  const [bookedDates, setBookedDates] = useState<Set<string>>(new Set());

  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionAvailability[]> = {};
    (sessions ?? []).forEach((s) => {
      if (s.status !== "open" || s.available_count <= 0) {
        return;
      }

      const key = s.date as string;
      map[key] = map[key] ?? [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  // pick first FUTURE available date (and keep selection in sync when sessions change)
  useEffect(() => {
    const todayStr = toDateKey(new Date());
    // only consider sessions from today forward
    const futureSessions = (sessions ?? []).filter(
      (s) => (s.date as string) >= todayStr,
    );

    if (futureSessions.length > 0) {
      // reset selection if: nothing selected, current selection is gone, or it's in the past
      if (
        !selectedDate ||
        !sessionsByDate[selectedDate] ||
        selectedDate < todayStr
      ) {
        setSelectedDate(futureSessions[0].date as string);
        setSelectedSession(null);
      }
    } else {
      // no future sessions this month, clear selection
      setSelectedDate(null);
      setSelectedSession(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessions, sessionsByDate]);

  function handleSelectSession(sessionId: string) {
    setSelectedSession(sessionId);
  }

  function handleBook() {
    if (!selectedSession) {
      toast.error("Selecione um horário antes de continuar.");
      return;
    }

    navigate("/app/agendamentos/confirmacao", {
      state: { sessionId: selectedSession },
    });
  }

  const todayStart = useMemo(
    () => new Date(new Date().setHours(0, 0, 0, 0)),
    [],
  );

  // sessions available for the currently selected date (empty array if none)
  const sessionsForSelected: SessionAvailability[] =
    selectedDate && sessionsByDate[selectedDate]
      ? sessionsByDate[selectedDate]
      : [];

  const sessionIdForLocation =
    selectedSession ?? sessionsForSelected[0]?.session_id ?? null;

  const resolveCalendarDayState = (date: Date): CalendarDayState => {
    const dateKey = toDateKey(date);
    const hasSessions = (sessionsByDate[dateKey] || []).length > 0;
    const isBooked = bookedDates.has(dateKey);
    const isPast = date < todayStart;

    if (isPast) {
      return { disabled: true, tone: "muted" };
    }

    if (isBooked) {
      return { disabled: true, tone: "booked", dotTone: "error" };
    }

    if (!hasSessions) {
      return { disabled: true, tone: "muted" };
    }

    return { tone: "available", dotTone: "success" };
  };

  useEffect(() => {
    async function fetchSessionLocation(sessionId: string) {
      setLocationLoading(true);

      try {
        const location = await fetchSessionLocationBySessionId(sessionId);
        setSessionLocation(location);
      } catch {
        setSessionLocation(null);
      } finally {
        setLocationLoading(false);
      }
    }

    if (!sessionIdForLocation) {
      setSessionLocation(null);
      setLocationLoading(false);
      return;
    }

    fetchSessionLocation(sessionIdForLocation);
  }, [sessionIdForLocation]);

  // fetch user's bookings on the visible month range and mark dates as booked
  useEffect(() => {
    let mounted = true;

    async function load() {
      const set = await fetchBookedDatesForUser(startStr, endStr);
      if (mounted) setBookedDates(set);
    }

    load();
    return () => {
      mounted = false;
    };
  }, [startStr, endStr]);

  if (loading) return <FullPageLoading message="Carregando sessões" />;

  return (
    <Layout>
      <main data-testid="scheduling-page">
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Novo Agendamento
            </h1>
            {/* botão de abrir bilhete removido */}
            <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80">
              Escolha uma data e horário disponíveis para realizar seu Teste de
              Avaliação (TACF).
            </p>
          </header>

          {/* Stepper */}
          <div className="mb-8 sm:mb-10">
            <div className="max-w-4xl mx-auto rounded-2xl border border-border-default bg-bg-card shadow-sm px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-border-default -translate-y-1/2 z-0" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground ring-8 ring-bg-card">
                    <AppIcon icon={Calendar} size="sm" tone="inverse" />
                  </div>
                  <span className="mt-2 text-xs font-bold text-primary uppercase tracking-wider">
                    Data e Hora
                  </span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-border-default flex items-center justify-center text-text-muted ring-8 ring-bg-card">
                    <AppIcon icon={Check} size="sm" tone="muted" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Confirmação
                  </span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-border-default flex items-center justify-center text-text-muted ring-8 ring-bg-card">
                    <AppIcon icon={Hash} size="sm" tone="muted" />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-text-muted uppercase tracking-wider">
                    Ticket
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left: Calendar */}
            <div className="lg:col-span-8 bg-bg-card rounded-3xl shadow-sm border border-border-default overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-border-default">
                <div>
                  <h3 className="text-xl font-bold text-text-body">
                    Calendário de Testes
                  </h3>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                {loading ? (
                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {Array.from({ length: 35 }).map((_, i) => (
                      <div
                        key={i}
                        className="aspect-square bg-bg-default rounded animate-pulse"
                      />
                    ))}
                  </div>
                ) : (
                  <CustomCalendar
                    className=""
                    viewDate={viewDate}
                    onViewDateChange={setViewDate}
                    selectedDateKey={selectedDate}
                    onSelectDate={(dateKey) => {
                      setSelectedDate(dateKey);
                      setSelectedSession(null);
                    }}
                    resolveDayState={(date, context) => {
                      if (!context.isCurrentMonth) {
                        return { disabled: true, tone: "muted" };
                      }

                      return resolveCalendarDayState(date);
                    }}
                    weekStartsOn={1}
                    size="regular"
                  />
                )}
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-bg-card rounded-3xl shadow-sm border border-border-default overflow-hidden">
                <div className="p-6 bg-primary text-primary-foreground">
                  <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1 uppercase">
                    Detalhes da Sessão
                  </p>
                  <h3 className="text-xl font-bold">
                    {selectedDate
                      ? formatDatePtBr(selectedDate)
                      : "Selecione uma data"}
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <div className="rounded-2xl border border-border-default bg-bg-default/60 p-4 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-bg-card flex items-center justify-center text-primary">
                      <AppIcon icon={MapPin} size="lg" tone="primary" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-text-muted uppercase tracking-widest">
                        Localização
                      </p>
                      <p className="text-text-body font-semibold">
                        {locationLoading
                          ? "Carregando local..."
                          : (sessionLocation?.name ?? "Local não informado")}
                      </p>
                      {sessionLocation?.address && (
                        <p className="text-xs text-text-muted">
                          {sessionLocation.address}
                        </p>
                      )}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4">
                      Horários Disponíveis
                    </p>
                    {loading ? (
                      <PageSkeleton rows={3} />
                    ) : !selectedDate ? (
                      <div className="text-sm text-text-muted">
                        Selecione uma data no calendário.
                      </div>
                    ) : sessionsForSelected.length === 0 ? (
                      <div className="text-sm text-text-muted">
                        Nenhuma sessão disponível nesta data.
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 gap-3">
                        {sessionsForSelected.map((s) => (
                          <button
                            key={s.session_id}
                            onClick={() => handleSelectSession(s.session_id)}
                            disabled={
                              s.status !== "open" || s.available_count <= 0
                            }
                            className={`w-full flex items-center justify-between p-4 rounded-xl border transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:cursor-not-allowed disabled:opacity-60 ${
                              selectedSession === s.session_id
                                ? "border-primary bg-primary/5"
                                : "border-border-default hover:bg-bg-default"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <AppIcon
                                icon={Clock}
                                size="md"
                                tone={
                                  s.available_count > 0 ? "primary" : "muted"
                                }
                              />
                              <span className="font-semibold text-text-body">
                                {formatSessionPeriod(s.period)}
                              </span>
                            </div>
                            <div
                              className={`px-3 py-1 text-[10px] font-bold rounded-full uppercase tracking-wider ${s.available_count > 0 ? "bg-success text-success-foreground" : "bg-error text-error-foreground"}`}
                            >
                              {s.available_count > 0
                                ? `Vagas: ${s.available_count}/${s.max_capacity}`
                                : "Vagas Esgotadas"}
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <button
                onClick={handleBook}
                onMouseEnter={() =>
                  prefetchRoute("/app/agendamentos/confirmacao")
                }
                disabled={!selectedSession}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground py-4 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                CONTINUAR PARA CONFIRMAÇÃO
                <AppIcon icon={ChevronRight} size="md" tone="inverse" />
              </button>

              <p className="text-center text-xs text-text-muted px-4">
                Ao continuar, você reserva provisoriamente este horário. A
                confirmação final será gerada na próxima etapa.
              </p>
            </div>
          </div>
        </div>
      </main>
      <TicketModal
        open={showTicketModal}
        onClose={() => setShowTicketModal(false)}
      />
    </Layout>
  );
};

export default Scheduling;
