import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import { prefetchRoute } from "@/utils/prefetchRoutes";
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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import PageSkeleton from "../components/PageSkeleton";
import Layout from "../layout/Layout";

export const Scheduling = () => {
  const navigate = useNavigate();

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

  return (
    <Layout>
      <main>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
          <header className="mb-6 sm:mb-8">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary dark:text-white">
              Novo Agendamento
            </h2>
            <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
              Selecione uma data disponível para a realização do seu Teste de
              Avaliação de Condicionamento Físico.
            </p>
          </header>

          {/* Stepper */}
          <div className="mb-8 sm:mb-10">
            <div className="max-w-4xl mx-auto rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-sm px-4 py-5 sm:px-6 sm:py-6">
              <div className="flex items-center justify-between relative">
                <div className="absolute top-1/2 left-0 w-full h-0.5 bg-slate-200 dark:bg-slate-700 -translate-y-1/2 z-0" />

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-white ring-8 ring-white dark:ring-slate-900">
                    <Calendar size={16} />
                  </div>
                  <span className="mt-2 text-xs font-bold text-primary uppercase tracking-wider">
                    Data e Hora
                  </span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 ring-8 ring-white dark:ring-slate-900">
                    <Check size={16} />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                    Confirmação
                  </span>
                </div>

                <div className="relative z-10 flex flex-col items-center">
                  <div className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-slate-400 dark:text-slate-300 ring-8 ring-white dark:ring-slate-900">
                    <Hash size={16} />
                  </div>
                  <span className="mt-2 text-xs font-semibold text-slate-400 dark:text-slate-300 uppercase tracking-wider">
                    Ticket
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Main Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-8 items-start">
            {/* Left: Calendar */}
            <div className="lg:col-span-8 bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
              <div className="p-4 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white">
                    Calendário de Testes
                  </h3>
                  <p className="text-sm text-slate-400 dark:text-slate-500">
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
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronLeft size={18} />
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
                    className="p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 transition-colors"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>

              <div className="p-4 sm:p-6">
                <div className="grid grid-cols-7 gap-1 mb-4 text-center">
                  {["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"].map(
                    (d) => (
                      <div
                        key={d}
                        className="py-2 text-xs font-bold text-slate-400 dark:text-slate-500 uppercase"
                      >
                        {d}
                      </div>
                    ),
                  )}
                </div>

                {loading ? (
                  <div className="grid grid-cols-7 gap-2 sm:gap-3">
                    {Array.from({ length: Math.min(daysInMonth, 28) }).map(
                      (_, i) => (
                        <div
                          key={i}
                          className="aspect-square bg-slate-100 dark:bg-slate-800 rounded animate-pulse"
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
                      const isSelected = selectedDate === dateKey;
                      const isPast =
                        dateObj < new Date(new Date().setHours(0, 0, 0, 0));

                      if (isPast) {
                        return (
                          <div
                            key={i}
                            className="aspect-square rounded-xl flex items-center justify-center text-slate-300 dark:text-slate-600 bg-slate-50/60 dark:bg-slate-800/40"
                          >
                            {day}
                          </div>
                        );
                      }

                      return (
                        <button
                          key={i}
                          onClick={() => {
                            if (hasSessions) {
                              setSelectedDate(dateKey);
                              setSelectedSession(null);
                            }
                          }}
                          className={`aspect-square relative rounded-xl flex items-center justify-center font-medium transition-all ${
                            isSelected
                              ? "bg-primary text-white shadow-sm ring-2 ring-primary/25"
                              : hasSessions
                                ? "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                : "text-slate-300 dark:text-slate-600 bg-slate-50/60 dark:bg-slate-800/40 cursor-not-allowed"
                          }`}
                          disabled={!hasSessions}
                        >
                          {day}
                          {hasSessions && (
                            <span className="absolute bottom-2 w-1 h-1 rounded-full bg-primary" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="p-4 sm:p-6 bg-slate-50 dark:bg-slate-800/50 flex flex-wrap gap-4 sm:gap-6 items-center justify-center border-t border-slate-100 dark:border-slate-800">
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-primary" />{" "}
                  Selecionado
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-slate-200 dark:bg-slate-600" />{" "}
                  Disponível
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <div className="w-3 h-3 rounded-full bg-slate-100 dark:bg-slate-700 opacity-60" />{" "}
                  Indisponível
                </div>
              </div>
            </div>

            {/* Right: Details */}
            <div className="lg:col-span-4 space-y-6">
              <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800 overflow-hidden">
                <div className="p-6 bg-primary text-white">
                  <p className="text-[10px] font-bold tracking-[0.2em] opacity-80 mb-1 uppercase">
                    Detalhes da Sessão
                  </p>
                  <h3 className="text-xl font-bold">
                    {selectedDate
                      ? new Date(selectedDate).toLocaleDateString("pt-BR", {
                          day: "2-digit",
                          month: "long",
                          year: "numeric",
                        })
                      : "Selecione uma data"}
                  </h3>
                </div>

                <div className="p-6 space-y-6">
                  <div className="rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 p-4 flex gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white dark:bg-slate-800 flex items-center justify-center text-primary">
                      <MapPin size={20} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                        Localização
                      </p>
                      <p className="text-slate-900 dark:text-white font-semibold">
                        Pista de Atletismo - HACO
                      </p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">
                        Hospital de Aeronáutica de Canoas
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-4">
                      Horários Disponíveis
                    </p>
                    {loading ? (
                      <PageSkeleton rows={3} />
                    ) : !selectedDate ? (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
                        Selecione uma data no calendário à esquerda.
                      </div>
                    ) : sessionsForSelected.length === 0 ? (
                      <div className="text-sm text-slate-500 dark:text-slate-400">
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
                                ? "border-primary bg-primary/5 dark:bg-primary/10"
                                : "border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <Clock
                                size={18}
                                className={
                                  s.available_count > 0
                                    ? "text-primary"
                                    : "text-slate-300 dark:text-slate-600"
                                }
                              />
                              <span className="font-semibold text-slate-700 dark:text-slate-200">
                                {s.period}
                              </span>
                            </div>
                            <div
                              className={`px-3 py-1 text-[10px] font-bold text-white rounded-full uppercase tracking-wider ${s.available_count > 0 ? "bg-military-green" : "bg-military-red"}`}
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
                className="w-full bg-primary hover:bg-primary/90 text-white py-4 rounded-xl font-bold shadow-sm flex items-center justify-center gap-2 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                CONTINUAR PARA CONFIRMAÇÃO
                <ChevronRight size={18} />
              </button>

              <p className="text-center text-xs text-slate-400 dark:text-slate-500 px-4">
                Ao continuar, você reserva provisoriamente este horário. A
                confirmação final será gerada na próxima etapa.
              </p>
            </div>
          </div>

          <footer className="mt-12 sm:mt-16 pt-6 sm:pt-8 border-t border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4 pb-10 sm:pb-12">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6">
              <div className="flex items-center gap-2">
                <HelpCircle
                  size={16}
                  className="text-slate-400 dark:text-slate-500"
                />
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  Suporte Técnico
                </span>
              </div>
              <div className="flex items-center gap-2">
                <FileText
                  size={16}
                  className="text-slate-400 dark:text-slate-500"
                />
                <span className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">
                  ICA 54-2
                </span>
              </div>
            </div>
            <div className="text-[11px] sm:text-sm text-slate-400 dark:text-slate-500 italic text-center md:text-right">
              SISTEMA DE AVALIAÇÃO DO CONDICIONAMENTO FÍSICO DIGITAL © 2023
            </div>
          </footer>
        </div>
      </main>
    </Layout>
  );
};

export default Scheduling;
