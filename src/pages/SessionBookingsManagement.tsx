/**
 * @page SessionBookingsManagement
 * @description Gestão de reservas por sessão.
 * @path src/pages/SessionBookingsManagement.tsx
 */

import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  FileDown,
  Loader2,
  Search,
} from "@/icons";
import {
  closeSessionWithChecklist,
  fetchSessionBookingsWithProfiles,
  fetchSessionById,
  fetchSessionClosureChecklist,
  type SessionClosureChecklist,
  updateBookingAttendance,
} from "@/services/sessions";
import type { BookingRow as DBBookingRow, Profile } from "@/types";
import { formatSessionPeriod } from "@/utils/booking";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { generateAttendanceListPdf } from "@/utils/pdf/generateAttendanceList";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type BookingRow = DBBookingRow;
type ProfileLookup = Pick<
  Profile,
  "id" | "full_name" | "war_name" | "saram" | "rank" | "email"
>;

interface BookingWithProfile extends BookingRow {
  full_name: string | null;
  war_name: string | null;
  saram: string | null;
  rank: string | null;
  email: string | null;
}

type SessionInfo = {
  id: string;
  date: string;
  period: string;
  max_capacity: number | null;
  location_id: string | null;
  status: "open" | "closed" | "completed";
};

type DisplayStatus = BookingRow["status"] | "confirmado";

const DISPLAY_STATUS_LABELS: Record<DisplayStatus, string> = {
  agendado: "Agendado",
  remarcado: "Remarcado",
  cancelado: "Cancelado",
  confirmado: "Confirmado",
};

const DISPLAY_STATUS_CLASSES: Record<DisplayStatus, string> = {
  agendado: "border-success/40 bg-success/10 text-success",
  remarcado: "border-alert/40 bg-alert/10 text-alert",
  cancelado: "bg-bg-default text-text-muted",
  confirmado: "border-primary/40 bg-primary/10 text-primary",
};

type StatusFilterOption = "all" | BookingRow["status"];

export default function SessionBookingsManagement() {
  const { profile } = useAuth();
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [closureChecklist, setClosureChecklist] =
    useState<SessionClosureChecklist | null>(null);
  const [closingSession, setClosingSession] = useState(false);
  const canMutate = profile?.role === "admin";
  const itemsPerPage = 10;
  const isSessionCompleted = session?.status === "completed";
  const canManageAttendance = canMutate && !isSessionCompleted;

  const load = useCallback(async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const sessionData = await fetchSessionById(sessionId);
      if (!sessionData) {
        throw new Error("Sessão não encontrada.");
      }
      setSession(sessionData as SessionInfo);

      const { bookings: bookingsData, profilesById } =
        await fetchSessionBookingsWithProfiles(sessionId);
      const booksRaw = bookingsData as BookingRow[];

      const enriched: BookingWithProfile[] = booksRaw.map((b) => {
        const p = profilesById.get(b.user_id) as ProfileLookup | undefined;
        return {
          ...b,
          full_name: p?.full_name ?? null,
          war_name: p?.war_name ?? null,
          saram: p?.saram ?? null,
          rank: p?.rank ?? null,
          email: p?.email ?? null,
        };
      });

      setBookings(enriched);

      const checklist = await fetchSessionClosureChecklist(sessionId);
      setClosureChecklist(checklist);
    } catch (err) {
      const authMessage = getAuthorizationErrorMessage(
        err,
        "visualizar agendamentos da turma",
      );
      toast.error(authMessage ?? "Erro ao carregar agendamentos da turma.");
      console.error(err);
      setClosureChecklist(null);
    } finally {
      setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return bookings.filter((b) => {
      const matchStatus = statusFilter === "all" || b.status === statusFilter;
      const matchSearch =
        !q ||
        (b.full_name ?? "").toLowerCase().includes(q) ||
        (b.war_name ?? "").toLowerCase().includes(q) ||
        (b.saram ?? "").toLowerCase().includes(q) ||
        (b.order_number ?? "").toLowerCase().includes(q);
      return matchStatus && matchSearch;
    });
  }, [bookings, statusFilter, searchQuery]);

  const counts = useMemo(() => {
    return bookings.reduce(
      (acc, booking) => {
        acc.all += 1;
        acc[booking.status] += 1;
        return acc;
      },
      { all: 0, agendado: 0, remarcado: 0, cancelado: 0 },
    );
  }, [bookings]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchQuery]);

  // Pagination calculations
  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginatedResults = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    const end = start + itemsPerPage;
    return filtered.slice(start, end);
  }, [filtered, currentPage, itemsPerPage]);

  function getDisplayStatus(booking: BookingWithProfile): DisplayStatus {
    // Exibe status baseado na presença confirmada
    if (booking.attendance_confirmed) {
      return "confirmado";
    }
    return "cancelado";
  }

  async function handleAttendanceChange(bookingId: string, next: boolean) {
    if (!canMutate) {
      toast.error(
        "Acesso negado: você não tem permissão para confirmar presença.",
      );
      return;
    }

    if (isSessionCompleted) {
      toast.error("Sessão encerrada não permite alterar presença.");
      return;
    }

    const current =
      bookings.find((booking) => booking.id === bookingId)
        ?.attendance_confirmed ?? false;

    if (current === next) {
      return;
    }

    setUpdating(bookingId);
    try {
      await updateBookingAttendance(bookingId, next);
      toast.success(next ? "Presença confirmada." : "Presença removida.");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, attendance_confirmed: next } : b,
        ),
      );
    } catch (error) {
      const authMessage = getAuthorizationErrorMessage(
        error,
        "confirmar presença",
      );
      toast.error(authMessage ?? "Não foi possível atualizar a presença.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleCloseSession() {
    if (!sessionId) {
      return;
    }

    if (!canMutate) {
      toast.error(
        "Acesso negado: você não tem permissão para encerrar sessão.",
      );
      return;
    }

    if (isSessionCompleted) {
      toast.success("Sessão já está encerrada.");
      return;
    }

    setClosingSession(true);
    try {
      const result = await closeSessionWithChecklist(sessionId);
      setClosureChecklist(result.checklist);
      setSession((prev) =>
        prev
          ? {
              ...prev,
              status: result.session_status ?? prev.status,
            }
          : prev,
      );
      toast.success("Sessão encerrada com sucesso.");
    } catch (error) {
      const authMessage = getAuthorizationErrorMessage(
        error,
        "encerrar sessão",
      );
      const message =
        error instanceof Error ? error.message : "Falha ao encerrar sessão.";
      toast.error(authMessage ?? message);

      try {
        const checklist = await fetchSessionClosureChecklist(sessionId);
        setClosureChecklist(checklist);
      } catch {
        setClosureChecklist(null);
      }
    } finally {
      setClosingSession(false);
    }
  }

  async function handleGenerateAttendancePdf() {
    if (!session) {
      toast.error("Sessão não carregada para gerar PDF.");
      return;
    }

    if (bookings.length === 0) {
      toast.error("Não há agendamentos para gerar a lista de presença.");
      return;
    }

    const startedAt = Date.now();
    setGeneratingPdf(true);

    try {
      await new Promise((resolve) => setTimeout(resolve, 0));
      // convert undefined order_number to null for PDF generator
      const validBookings = bookings.map((b) => ({
        ...b,
        order_number: b.order_number ?? null,
        attendance_confirmed: b.attendance_confirmed ?? null,
      }));
      generateAttendanceListPdf({
        session,
        bookings: validBookings,
      });
      toast.success("Lista de presença gerada em PDF.");
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível gerar o PDF da lista de presença.");
    } finally {
      const elapsed = Date.now() - startedAt;
      if (elapsed < 500) {
        await new Promise((resolve) => setTimeout(resolve, 500 - elapsed));
      }
      setGeneratingPdf(false);
    }
  }

  const dateLabel = session
    ? format(parseISO(session.date), "dd 'de' MMMM 'de' yyyy", {
        locale: ptBR,
      })
    : "—";
  const periodLabel = session ? formatSessionPeriod(session.period) : "—";

  const filterTabs: { key: StatusFilterOption; label: string }[] = [
    { key: "all", label: `Todos (${counts.all})` },
    { key: "agendado", label: `Agendados (${counts.agendado})` },
    { key: "remarcado", label: `Remarcados (${counts.remarcado})` },
    { key: "cancelado", label: `Cancelados (${counts.cancelado})` },
  ];

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4">
        {/* Hero with enhanced visual hierarchy */}
        <section className="mb-8">
          <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/95 to-primary/90 px-5 py-6 text-white shadow-2xl shadow-primary/25 md:px-8 md:py-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-white/10 blur-3xl" />

            <div className="relative z-10 flex flex-col gap-6">
              <div className="max-w-md">
                <h1 className="text-2xl font-bold tracking-tight md:text-3xl lg:text-4xl">
                  Agendamentos da Turma
                </h1>
                {session ? (
                  <div className="mt-3 space-y-1">
                    <p className="text-sm text-white/90 md:text-base font-medium">
                      {dateLabel} <span className="text-white/60">•</span>{" "}
                      {periodLabel}
                    </p>
                    {session.max_capacity != null && (
                      <p className="text-xs text-white/75 md:text-sm">
                        Capacidade:{" "}
                        <span className="font-bold">
                          {session.max_capacity}
                        </span>{" "}
                        vagas
                      </p>
                    )}
                    <p className="text-xs text-white/80 md:text-sm">
                      Situação:{" "}
                      {isSessionCompleted ? "Encerrada" : "Em execução"}
                    </p>
                  </div>
                ) : (
                  <p className="mt-3 text-sm text-white/75 md:text-base">
                    Carregando turma...
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {closureChecklist && (
          <section className="mb-6 rounded-xl border border-border-default bg-bg-card p-4 sm:p-5">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-sm font-bold text-text-body">
                  Checklist de Encerramento
                </h2>
                <p className="mt-1 text-xs text-text-muted">
                  O encerramento exige resultado lançado para todos os
                  agendamentos ativos e nenhuma solicitação de reagendamento
                  pendente.
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseSession}
                disabled={
                  !canMutate ||
                  isSessionCompleted ||
                  !closureChecklist.can_close ||
                  closingSession
                }
                className="inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {closingSession ? "Encerrando..." : "Encerrar Sessão"}
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <div className="rounded-lg border border-border-default bg-bg-default p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Resultados pendentes
                </p>
                <p className="mt-1 text-base font-bold text-text-body">
                  {closureChecklist.results_pending}
                </p>
              </div>
              <div className="rounded-lg border border-border-default bg-bg-default p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Reagendamentos pendentes
                </p>
                <p className="mt-1 text-base font-bold text-text-body">
                  {closureChecklist.pending_swap_requests}
                </p>
              </div>
              <div className="rounded-lg border border-border-default bg-bg-default p-3">
                <p className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
                  Agendamentos ativos
                </p>
                <p className="mt-1 text-base font-bold text-text-body">
                  {closureChecklist.bookings_total}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* Enhanced filters with visual hierarchy */}
        <div className="mb-6 space-y-4">
          {/* Status filter tabs with indicator */}
          <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="flex gap-1 bg-bg-default rounded-lg p-1.5 overflow-x-auto flex-1 sm:flex-none">
              {filterTabs.map((tab) => {
                const isActive = statusFilter === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setStatusFilter(tab.key)}
                    className={`relative px-3.5 py-2 rounded-md text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
                      isActive
                        ? "bg-bg-card text-primary shadow-sm"
                        : "text-text-muted hover:text-text-body hover:bg-white/50"
                    }`}
                  >
                    {tab.label}
                    {isActive && (
                      <div className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-primary rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Enhanced search box */}
          <div className="relative w-full">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar nome, guerra ou SARAM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-sm rounded-lg border-2 border-border-default bg-bg-card text-text-body placeholder:text-text-muted transition-all duration-200 focus:outline-none focus:border-primary focus:ring-3 focus:ring-primary/20"
            />
          </div>
        </div>

        {!canMutate && (
          <div className="mb-6 rounded-lg border-2 border-alert/30 bg-alert/5 px-4 py-3 text-sm font-semibold text-alert flex items-start gap-3">
            <div className="mt-0.5 flex-shrink-0">
              <div className="flex h-2 w-2 rounded-full bg-alert/80" />
            </div>
            <div>
              <p>Modo somente leitura</p>
              <p className="font-normal text-alert/75 text-xs mt-1">
                Apenas administradores podem alterar status e presença.
              </p>
            </div>
          </div>
        )}

        {/* Data display with enhanced visual hierarchy */}
        <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center gap-3 text-text-muted py-20">
              <Loader2 size={20} className="animate-spin text-primary/60" />
              <span className="font-medium">Carregando agendamentos...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-text-muted gap-3">
              <div className="rounded-full bg-primary/10 p-4">
                <CalendarClock size={40} className="text-primary/40" />
              </div>
              <p className="text-sm font-medium">
                Nenhum agendamento encontrado
              </p>
              <p className="text-xs text-text-muted/70">
                Tente ajustar seus filtros de busca
              </p>
            </div>
          ) : (
            <>
              {/* Mobile view: Enhanced cards */}
              <div className="space-y-3 p-4 md:hidden">
                {paginatedResults.map((b) => {
                  const isUpdating = updating === b.id;
                  const displayStatus = getDisplayStatus(b);

                  return (
                    <article
                      key={b.id}
                      className="group rounded-lg border border-border-default bg-gradient-to-br from-bg-card to-white/50 p-4 transition-all duration-200 hover:border-primary/30 hover:shadow-md"
                    >
                      {/* Header with rank and number */}
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            {b.rank && (
                              <span className="inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary rounded-sm">
                                {b.rank}
                              </span>
                            )}
                            <span className="text-[10px] font-mono text-text-muted/60">
                              Nº {b.order_number ?? "—"}
                            </span>
                          </div>
                          <p className="truncate text-sm font-semibold text-text-body leading-tight">
                            {b.full_name ?? (
                              <span className="italic text-text-muted">
                                sem registro
                              </span>
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Sub-info line */}
                      <p className="text-xs text-text-muted mb-3 line-clamp-1">
                        <span className="inline-block">
                          Guerra: {b.war_name ?? "—"}
                        </span>
                        <span className="mx-1.5 text-border-default">•</span>
                        <span className="font-mono">
                          SARAM: {b.saram ?? "—"}
                        </span>
                      </p>

                      {/* Status and Attendance section */}
                      <div className="space-y-2 pt-3 border-t border-border-default/50">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 block mb-1.5">
                              Status
                            </label>
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                                DISPLAY_STATUS_CLASSES[displayStatus]
                              }`}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                              {DISPLAY_STATUS_LABELS[displayStatus] ??
                                displayStatus}
                            </span>
                          </div>

                          {isUpdating && (
                            <div className="flex justify-center">
                              <Loader2
                                size={16}
                                className="animate-spin text-primary/60"
                              />
                            </div>
                          )}
                        </div>

                        {/* Attendance control */}
                        <div className="pt-2 border-t border-border-default/30">
                          <label className="text-[9px] font-black uppercase tracking-widest text-text-muted/60 block mb-1.5">
                            Presença
                          </label>
                          <div className="flex gap-2">
                            {["nao", "sim"].map((val) => (
                              <button
                                key={val}
                                onClick={() =>
                                  handleAttendanceChange(b.id, val === "sim")
                                }
                                disabled={isUpdating || !canManageAttendance}
                                className={`flex-1 px-2 py-1.5 text-xs font-semibold rounded-md transition-all duration-150 ${
                                  (b.attendance_confirmed ? "sim" : "nao") ===
                                  val
                                    ? "bg-primary text-white shadow-sm"
                                    : "bg-bg-default text-text-muted hover:bg-bg-default/80"
                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {val === "sim" ? "Sim" : "Não"}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Desktop view: Enhanced table */}
              <div className="hidden overflow-x-auto md:block">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b-2 border-border-default bg-bg-default/60">
                      <th className="px-5 py-4 text-left font-bold text-[10px] text-text-muted uppercase tracking-widest w-12">
                        Nº
                      </th>
                      <th className="px-5 py-4 text-left font-bold text-[10px] text-text-muted uppercase tracking-widest">
                        Posto
                      </th>
                      <th className="px-5 py-4 text-left font-bold text-[10px] text-text-muted uppercase tracking-widest">
                        Nome
                      </th>
                      <th className="px-5 py-4 text-left font-bold text-[10px] text-text-muted uppercase tracking-widest">
                        Guerra
                      </th>
                      <th className="px-5 py-4 text-left font-bold text-[10px] text-text-muted uppercase tracking-widest">
                        SARAM
                      </th>
                      <th className="px-5 py-4 text-center font-bold text-[10px] text-text-muted uppercase tracking-widest">
                        Status
                      </th>
                      <th className="px-5 py-4 text-center font-bold text-[10px] text-text-muted uppercase tracking-widest">
                        Presença
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default/50">
                    {paginatedResults.map((b, idx) => {
                      const isUpdating = updating === b.id;
                      const displayStatus = getDisplayStatus(b);
                      const isEvenRow = idx % 2 === 0;

                      return (
                        <tr
                          key={b.id}
                          className={`transition-all duration-200 hover:bg-primary/5 hover:shadow-sm ${
                            isEvenRow ? "bg-white/40" : "bg-bg-default/20"
                          }`}
                        >
                          <td className="px-5 py-4 font-mono text-xs text-text-muted/70 font-semibold">
                            {b.order_number ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-text-muted font-semibold text-xs whitespace-nowrap">
                            {b.rank ? (
                              <span className="inline-block px-2 py-0.5 rounded-sm bg-primary/8 text-primary">
                                {b.rank}
                              </span>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td className="px-5 py-4 text-text-body font-semibold whitespace-nowrap">
                            {b.full_name ?? (
                              <span className="text-text-muted italic">
                                sem registro
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-4 text-text-muted whitespace-nowrap text-sm">
                            {b.war_name ?? "—"}
                          </td>
                          <td className="px-5 py-4 font-mono text-xs text-text-muted/70">
                            {b.saram ?? "—"}
                          </td>
                          <td className="px-5 py-4 text-center">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                                DISPLAY_STATUS_CLASSES[displayStatus]
                              }`}
                            >
                              <div className="w-1.5 h-1.5 rounded-full bg-current opacity-75" />
                              {DISPLAY_STATUS_LABELS[displayStatus] ??
                                displayStatus}
                            </span>
                          </td>
                          <td className="px-5 py-4 text-center">
                            <div className="flex items-center justify-center gap-2">
                              <div className="flex gap-1.5 bg-bg-default rounded-md p-0.5">
                                {["nao", "sim"].map((val) => (
                                  <button
                                    key={val}
                                    onClick={() =>
                                      handleAttendanceChange(
                                        b.id,
                                        val === "sim",
                                      )
                                    }
                                    disabled={
                                      isUpdating || !canManageAttendance
                                    }
                                    className={`px-3 py-1 text-xs font-semibold rounded-sm transition-all duration-150 ${
                                      (b.attendance_confirmed
                                        ? "sim"
                                        : "nao") === val
                                        ? "bg-primary text-white shadow-sm"
                                        : "text-text-muted hover:bg-bg-card"
                                    } disabled:opacity-40 disabled:cursor-not-allowed`}
                                  >
                                    {val === "sim" ? "Sim" : "Não"}
                                  </button>
                                ))}
                              </div>
                              {isUpdating && (
                                <Loader2
                                  size={14}
                                  className="animate-spin text-primary/60"
                                />
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Action bar with buttons and pagination */}
        {!loading && filtered.length > 0 && (
          <div className="mt-6 space-y-4">
            {/* Action buttons */}
            <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <button
                type="button"
                onClick={() => navigate("/app/sessoes")}
                className="inline-flex items-center justify-center sm:justify-start gap-2 rounded-lg border-2 border-primary/20 bg-primary/5 hover:bg-primary/10 px-4 py-2.5 text-sm font-semibold text-primary transition-all duration-200"
              >
                <ArrowLeft size={16} />
                <span>Voltar para Turmas</span>
              </button>
              <button
                type="button"
                aria-label="Gerar Lista de Presença"
                onClick={handleGenerateAttendancePdf}
                disabled={loading || generatingPdf || bookings.length === 0}
                className="inline-flex items-center justify-center sm:justify-start gap-2 rounded-lg bg-success hover:bg-success/95 px-4 py-2.5 text-sm font-semibold text-white transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {generatingPdf ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processando...</span>
                  </>
                ) : (
                  <>
                    <FileDown size={16} />
                    <span>Gerar Lista de Presença</span>
                  </>
                )}
              </button>
            </div>

            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-border-default hover:border-primary/30 bg-bg-card px-3 py-2 text-xs font-semibold text-text-body transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={14} />
                  <span>Anterior</span>
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (page) => (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page)}
                        className={`h-8 w-8 rounded-md text-xs font-semibold transition-all ${
                          currentPage === page
                            ? "bg-primary text-white shadow-sm"
                            : "bg-bg-default text-text-muted hover:bg-bg-card"
                        }`}
                      >
                        {page}
                      </button>
                    ),
                  )}
                </div>

                <button
                  type="button"
                  onClick={() =>
                    setCurrentPage(Math.min(totalPages, currentPage + 1))
                  }
                  disabled={currentPage === totalPages}
                  className="inline-flex items-center gap-1.5 rounded-lg border-2 border-border-default hover:border-primary/30 bg-bg-card px-3 py-2 text-xs font-semibold text-text-body transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <span>Próxima</span>
                  <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        )}

        {!loading && filtered.length > 0 && (
          <div className="mt-5 flex items-center justify-between px-1">
            <p className="text-xs text-text-muted/70">
              <span className="font-semibold text-text-body">
                {filtered.length}
              </span>{" "}
              de{" "}
              <span className="font-semibold text-text-body">
                {bookings.length}
              </span>{" "}
              agendamento{bookings.length !== 1 ? "s" : ""}
            </p>
            <div className="flex gap-1.5 text-[10px] text-text-muted/60">
              {Object.entries(counts)
                .filter(([k]) => k !== "all")
                .map(
                  ([status, count]) =>
                    count > 0 && (
                      <span key={status} className="inline-block">
                        <span className="font-semibold text-text-body">
                          {count}
                        </span>{" "}
                        {status === "agendado"
                          ? "Agendados"
                          : status === "remarcado"
                            ? "Remarcados"
                            : "Cancelados"}
                      </span>
                    ),
                )}
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
