/**
 * @page SessionBookingsManagement
 * @description Gestão de reservas por sessão.
 * @path src/pages/SessionBookingsManagement.tsx
 */

import Layout from "@/components/layout/Layout";
import {
  ArrowLeft,
  CalendarClock,
  CheckCircle2,
  FileDown,
  Loader2,
  Search,
  UserCheck,
  UserX,
  XCircle,
} from "@/icons";
import { updateBookingStatus } from "@/services/bookings";
import {
  fetchSessionBookingsWithProfiles,
  fetchSessionById,
  updateBookingAttendance,
} from "@/services/sessions";
import type { BookingRow as DBBookingRow, Profile } from "@/types";
import { formatSessionPeriod } from "@/utils/booking";
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
};

const STATUS_LABELS: Record<BookingRow["status"], string> = {
  agendado: "Agendado",
  remarcado: "Remarcado",
  cancelado: "Cancelado",
};

const STATUS_CLASSES: Record<BookingRow["status"], string> = {
  agendado: "border-success/40 bg-success/10 text-success",
  remarcado: "border-alert/40 bg-alert/10 text-alert",
  cancelado: "bg-bg-default text-text-muted",
};

type StatusFilterOption = "all" | BookingRow["status"];

export default function SessionBookingsManagement() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const navigate = useNavigate();

  const [session, setSession] = useState<SessionInfo | null>(null);
  const [bookings, setBookings] = useState<BookingWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilterOption>("all");
  const [searchQuery, setSearchQuery] = useState("");

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
    } catch (err) {
      toast.error("Erro ao carregar agendamentos da turma.");
      console.error(err);
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

  async function handleStatusChange(
    bookingId: string,
    newStatus: BookingRow["status"],
  ) {
    setUpdating(bookingId);
    try {
      await updateBookingStatus(bookingId, newStatus);
      toast.success("Status atualizado.");
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: newStatus } : b)),
      );
    } catch {
      toast.error("Não foi possível atualizar o status.");
    } finally {
      setUpdating(null);
    }
  }

  async function handleToggleAttendance(
    bookingId: string,
    current: boolean | null,
  ) {
    setUpdating(bookingId);
    try {
      await updateBookingAttendance(bookingId, !current);
      toast.success(!current ? "Presença confirmada." : "Presença removida.");
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId ? { ...b, attendance_confirmed: !current } : b,
        ),
      );
    } catch {
      toast.error("Não foi possível atualizar a presença.");
    } finally {
      setUpdating(null);
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
        {/* Hero */}
        <section className="mb-6">
          <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
                  Agendamentos da Turma
                </h1>
                {session ? (
                  <p className="mt-2 text-sm text-white/85 md:text-base">
                    {dateLabel} &bull; {periodLabel}
                    {session.max_capacity != null && (
                      <> &bull; Capacidade: {session.max_capacity}</>
                    )}
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-white/85 md:text-base">
                    Carregando turma...
                  </p>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/app/turmas")}
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition-all hover:bg-white/20"
                >
                  <ArrowLeft size={15} />
                  Voltar
                </button>
                <button
                  type="button"
                  aria-label="Gerar Lista de Presença"
                  onClick={handleGenerateAttendancePdf}
                  disabled={loading || generatingPdf || bookings.length === 0}
                  className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/20 px-4 py-2 text-sm font-semibold text-primary-foreground transition-all hover:bg-bg-card hover:text-primary disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {generatingPdf ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Processando...
                    </>
                  ) : (
                    <>
                      <FileDown size={14} />
                      Gerar Lista de Presença
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Status tabs */}
          <div className="flex w-full gap-1 bg-bg-default rounded-lg p-1 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.key
                    ? "bg-bg-card text-primary shadow-sm"
                    : "text-text-muted hover:text-text-body"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative w-full sm:w-auto flex-1 min-w-0 sm:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none"
            />
            <input
              type="text"
              placeholder="Buscar nome, guerra ou SARAM..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border-default bg-bg-card text-text-body placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-bg-card rounded-xl border border-border-default overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-2 text-text-muted py-16">
              <Loader2 size={18} className="animate-spin" />
              Carregando agendamentos...
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-text-muted gap-2">
              <CalendarClock size={36} className="opacity-40" />
              <p className="text-sm">Nenhum agendamento encontrado.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2 p-3 md:hidden">
                {filtered.map((b) => {
                  const isUpdating = updating === b.id;
                  return (
                    <article
                      key={b.id}
                      className="rounded-xl border border-border-default bg-bg-card p-3"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-text-body">
                            {b.rank ? `${b.rank} ` : ""}
                            {b.full_name ?? "s/n"}
                          </p>
                          <p className="text-xs text-text-muted">
                            Guerra: {b.war_name ?? "—"} · SARAM:{" "}
                            {b.saram ?? "—"}
                          </p>
                        </div>
                        <span className="font-mono text-[10px] text-text-muted">
                          Nº {b.order_number ?? "—"}
                        </span>
                      </div>

                      <div className="mt-2 flex items-center justify-between gap-2">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                            STATUS_CLASSES[b.status]
                          }`}
                        >
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                        {b.attendance_confirmed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-success">
                            <CheckCircle2 size={14} />
                            Presença confirmada
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">
                            Sem presença
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-end gap-1">
                        {isUpdating ? (
                          <Loader2
                            size={16}
                            className="animate-spin text-text-muted"
                          />
                        ) : (
                          <>
                            {b.status !== "agendado" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(b.id, "agendado")
                                }
                                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-success/10 hover:text-success"
                                title="Confirmar agendamento"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}
                            {b.status !== "cancelado" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(b.id, "cancelado")
                                }
                                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-error/10 hover:text-error"
                                title="Cancelar agendamento"
                              >
                                <XCircle size={15} />
                              </button>
                            )}
                            <button
                              onClick={() =>
                                handleToggleAttendance(
                                  b.id,
                                  b.attendance_confirmed ?? false,
                                )
                              }
                              className={`rounded-lg p-1.5 transition-colors ${
                                b.attendance_confirmed
                                  ? "text-success hover:bg-bg-default hover:text-text-muted"
                                  : "text-text-muted hover:bg-success/10 hover:text-success"
                              }`}
                              title={
                                b.attendance_confirmed
                                  ? "Remover confirmação de presença"
                                  : "Confirmar presença"
                              }
                            >
                              {b.attendance_confirmed ? (
                                <UserX size={15} />
                              ) : (
                                <UserCheck size={15} />
                              )}
                            </button>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>

              <div className="hidden overflow-x-auto md:block">
                <table className="w-full min-w-[920px] text-sm">
                  <thead>
                    <tr className="border-b border-border-default bg-bg-default">
                      <th className="px-4 py-3 text-left font-semibold text-xs text-text-muted uppercase tracking-wider w-12">
                        Nº
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-xs text-text-muted uppercase tracking-wider">
                        Posto/Grad
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-xs text-text-muted uppercase tracking-wider">
                        Nome
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-xs text-text-muted uppercase tracking-wider">
                        Guerra
                      </th>
                      <th className="px-4 py-3 text-left font-semibold text-xs text-text-muted uppercase tracking-wider">
                        SARAM
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-xs text-text-muted uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-center font-semibold text-xs text-text-muted uppercase tracking-wider">
                        Presença
                      </th>
                      <th className="px-4 py-3 text-right font-semibold text-xs text-text-muted uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {filtered.map((b) => {
                      const isUpdating = updating === b.id;
                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-bg-default transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-text-muted">
                            {b.order_number ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-text-muted font-medium text-xs whitespace-nowrap">
                            {b.rank ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-text-body font-medium whitespace-nowrap">
                            {b.full_name ?? (
                              <span className="text-text-muted italic">
                                s/n
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-muted whitespace-nowrap">
                            {b.war_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-text-muted">
                            {b.saram ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                STATUS_CLASSES[b.status]
                              }`}
                            >
                              {STATUS_LABELS[b.status] ?? b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {b.attendance_confirmed ? (
                              <span className="inline-flex items-center gap-1 text-success text-xs font-medium">
                                <CheckCircle2 size={14} />
                                Sim
                              </span>
                            ) : (
                              <span className="text-text-muted text-xs">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center justify-end gap-1">
                              {isUpdating ? (
                                <Loader2
                                  size={16}
                                  className="animate-spin text-text-muted"
                                />
                              ) : (
                                <>
                                  {b.status !== "agendado" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(b.id, "agendado")
                                      }
                                      className="p-1.5 rounded-lg text-text-muted hover:text-success hover:bg-success/10 transition-colors"
                                      title="Confirmar agendamento"
                                    >
                                      <CheckCircle2 size={15} />
                                    </button>
                                  )}
                                  {b.status !== "cancelado" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(b.id, "cancelado")
                                      }
                                      className="p-1.5 rounded-lg text-text-muted hover:text-error hover:bg-error/10 transition-colors"
                                      title="Cancelar agendamento"
                                    >
                                      <XCircle size={15} />
                                    </button>
                                  )}
                                  <button
                                    onClick={() =>
                                      handleToggleAttendance(
                                        b.id,
                                        b.attendance_confirmed ?? false,
                                      )
                                    }
                                    className={`p-1.5 rounded-lg transition-colors ${
                                      b.attendance_confirmed
                                        ? "text-success hover:text-text-muted hover:bg-bg-default"
                                        : "text-text-muted hover:text-success hover:bg-success/10"
                                    }`}
                                    title={
                                      b.attendance_confirmed
                                        ? "Remover confirmação de presença"
                                        : "Confirmar presença"
                                    }
                                  >
                                    {b.attendance_confirmed ? (
                                      <UserX size={15} />
                                    ) : (
                                      <UserCheck size={15} />
                                    )}
                                  </button>
                                </>
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

        {!loading && filtered.length > 0 && (
          <p className="text-xs text-text-muted mt-3 text-right">
            {filtered.length} de {bookings.length} agendamento
            {bookings.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>
    </Layout>
  );
}
