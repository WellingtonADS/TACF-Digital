/**
 * @page Scheduling
 * @description Interface de agendamento de sessões.
 * @path src/pages/Scheduling.tsx
 */

import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import TicketModal from "@/components/TicketModal";
import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import {
  Calendar,
  Check,
  ChevronLeft,
  ChevronRight,
  Clock,
  FileText,
  Hash,
  HelpCircle,
  MapPin,
} from "@/icons";
import supabase from "@/services/supabase";
import { fetchBookedDatesForUser, formatSessionPeriod } from "@/utils/booking";
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

const WEEK_DAYS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
  const startStr = startOfMonth.toISOString().split("T")[0];
  const endStr = endOfMonth.toISOString().split("T")[0];

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
      const key = s.date as string;
      map[key] = map[key] ?? [];
      map[key].push(s);
    });
    return map;
  }, [sessions]);

  // pick first available date (and keep selection in sync when sessions change)
  useEffect(() => {
    if (sessions && sessions.length > 0) {
      // if we have no date selected yet, or the current selection disappeared
      if (!selectedDate || !sessionsByDate[selectedDate]) {
        setSelectedDate(sessions[0].date as string);
        setSelectedSession(null);
      }
    } else {
      // no sessions at all, clear selection
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

  const daysInMonth = endOfMonth.getDate();

  // sessions available for the currently selected date (empty array if none)
  const sessionsForSelected: SessionAvailability[] =
    selectedDate && sessionsByDate[selectedDate]
      ? sessionsByDate[selectedDate]
      : [];

  const sessionIdForLocation =
    selectedSession ?? sessionsForSelected[0]?.session_id ?? null;

  useEffect(() => {
    async function fetchSessionLocation(sessionId: string) {
      setLocationLoading(true);

      try {
        const { data, error } = await supabase
          .from("sessions")
          .select("location:locations(name, address)")
          .eq("id", sessionId)
          .single();

        if (error) {
          throw error;
        }

        const locationRaw = data?.location as
          | { name?: string | null; address?: string | null }
          | { name?: string | null; address?: string | null }[]
          | null;

        const location = Array.isArray(locationRaw)
          ? locationRaw[0]
          : locationRaw;

        setSessionLocation({
          name: location?.name ?? null,
          address: location?.address ?? null,
        });
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
      <main>
        <div className="mx-auto max-w-5xl">
          <header className="mb-8 rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8">
            <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
              Novo Agendamento
            </h1>
            {/* botão de abrir bilhete removido */}
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
              Selecione uma data disponível para a realização do seu Teste de
              Avaliação de Condicionamento Físico.
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
              <div className="p-4 sm:p-6 border-b border-border-default flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-text-body">
                    Calendário de Testes
                  </h3>
                  <p className="text-sm text-text-muted">
                    {viewDate.toLocaleString("pt-BR", {
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() =>
                      setViewDate(
                        new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth() - 1,
                          1,
                        ),
                      )
                    }
                    className="p-2 rounded-lg hover:bg-bg-default text-text-muted transition-colors"
                  >
                    <AppIcon icon={ChevronLeft} size="md" tone="muted" />
                  </button>
                  <button
                    onClick={() =>
                      setViewDate(
                        new Date(
                          viewDate.getFullYear(),
                          viewDate.getMonth() + 1,
                          1,
                        ),
                      )
                    }
                    className="p-2 rounded-lg hover:bg-bg-default text-text-muted transition-colors"
                  >
                    <AppIcon icon={ChevronRight} size="md" tone="muted" />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                  {WEEK_DAYS.map((d) => (
                    <div
                      key={d}
                      className="py-2 text-xs font-bold text-text-muted uppercase"
                    >
                      {d}
                    </div>
                  ))}
                </div>

                {loading ? (
                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {Array.from({ length: Math.min(daysInMonth, 28) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-bg-default rounded animate-pulse"
                        />
                      ),
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const dateObj = new Date(
                        viewDate.getFullYear(),
                        viewDate.getMonth(),
                        day,
                      );
                      const dateKey = dateObj.toISOString().split("T")[0];
                      const hasSessions =
                        (sessionsByDate[dateKey] || []).length > 0;
                      const isBooked = bookedDates.has(dateKey);
                      const isSelected = selectedDate === dateKey;
                      const isPast =
                        dateObj < new Date(new Date().setHours(0, 0, 0, 0));

                      if (isPast) {
                        return (
                          <div
                            key={i}
                            className="aspect-square rounded-xl flex items-center justify-center text-text-muted bg-bg-default/60"
                          >
                            {day}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (hasSessions && !isBooked) {
                              setSelectedDate(dateKey);
                              setSelectedSession(null);
                            }
                          }}
                          className={`aspect-square relative rounded-xl flex items-center justify-center font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/25"
                              : isBooked
                                ? "text-error bg-error/10 cursor-not-allowed"
                                : hasSessions
                                  ? "text-text-body hover:bg-bg-default"
                                  : "text-text-muted bg-bg-default/60 cursor-not-allowed"
                          }`}
                          disabled={!hasSessions || isBooked}
                        >
                          {day}
                          {hasSessions && !isBooked && (
                            <span className="absolute bottom-2 w-1 h-1 rounded-full bg-primary" />
                          )}
                          {isBooked && (
                            <span className="absolute bottom-2 w-2 h-2 rounded-full bg-error border border-error/30" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 bg-bg-default flex flex-wrap gap-4 sm:gap-6 items-center justify-center border-t border-border-default">
                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <div className="w-3 h-3 rounded-full bg-primary" />{" "}
                  Selecionado
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <div className="w-3 h-3 rounded-full bg-border-default" />{" "}
                  Disponível
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-text-muted">
                  <div className="w-3 h-3 rounded-full bg-bg-default opacity-60" />{" "}
                  Indisponível
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-error">
                  <div className="w-3 h-3 rounded-full bg-error" /> Já agendado
                </div>
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
                            disabled={s.available_count <= 0}
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

          <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-border-default flex flex-col md:flex-row justify-between items-center gap-4 pb-10 sm:pb-12">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <AppIcon icon={HelpCircle} size="sm" tone="muted" />
                <span className="text-xs sm:text-sm text-text-muted font-medium">
                  Suporte Técnico
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AppIcon icon={FileText} size="sm" tone="muted" />
                <span className="text-xs sm:text-sm text-text-muted font-medium">
                  ICA 54-2
                </span>
              </div>
            </div>
          </footer>
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
