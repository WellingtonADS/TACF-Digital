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
import supabase from "@/services/supabase";
import type { BookingRow as DBBookingRow } from "@/types";
import { formatSessionPeriod } from "@/utils/booking";
import { generateAttendanceListPdf } from "@/utils/pdf/generateAttendanceList";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "sonner";

type BookingRow = DBBookingRow;

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

const STATUS_LABELS: Record<string, string> = {
  confirmed: "Confirmado",
  pending: "Pendente",
  cancelled: "Cancelado",
  no_show: "Não compareceu",
};

const STATUS_CLASSES: Record<string, string> = {
  confirmed:
    "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
  pending:
    "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  cancelled:
    "bg-bg-default text-text-muted dark:bg-bg-default dark:text-text-muted",
  no_show: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

type StatusFilterOption = "all" | "confirmed" | "pending" | "cancelled";

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
      // Load session
      const { data: sessionData, error: sessionError } = await supabase
        .from("sessions")
        .select("id,date,period,max_capacity,location_id")
        .eq("id", sessionId)
        .single();

      if (sessionError) throw sessionError;
      setSession(sessionData as SessionInfo);

      // Load bookings for this session
      const { data: bookingsData, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("session_id", sessionId)
        .order("order_number", { ascending: true, nullsFirst: false });

      if (bookingsError) throw bookingsError;
      const booksRaw = (bookingsData ?? []) as unknown as BookingRow[];

      // Load profiles
      const userIds = Array.from(new Set(booksRaw.map((b) => b.user_id)));
      type ProfileRow = {
        id: string;
        full_name: string | null;
        war_name: string | null;
        saram: string | null;
        rank: string | null;
        email: string | null;
      };
      const profilesById = new Map<string, ProfileRow>();
      if (userIds.length > 0) {
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id,full_name,war_name,saram,rank,email")
          .in("id", userIds);
        (profilesData ?? []).forEach((p) =>
          profilesById.set(p.id, p as ProfileRow),
        );
      }

      const enriched: BookingWithProfile[] = booksRaw.map((b) => {
        const p = profilesById.get(b.user_id);
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

  const counts = useMemo(
    () => ({
      all: bookings.length,
      confirmed: bookings.filter((b) => b.status === "confirmed").length,
      pending: bookings.filter((b) => b.status === "pending").length,
      cancelled: bookings.filter((b) => b.status === "cancelled").length,
    }),
    [bookings],
  );

  async function handleStatusChange(bookingId: string, newStatus: string) {
    setUpdating(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus })
        .eq("id", bookingId);
      if (error) throw error;
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
      const { error } = await supabase
        .from("bookings")
        .update({ attendance_confirmed: !current })
        .eq("id", bookingId);
      if (error) throw error;
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
    { key: "confirmed", label: `Confirmados (${counts.confirmed})` },
    { key: "pending", label: `Pendentes (${counts.pending})` },
    { key: "cancelled", label: `Cancelados (${counts.cancelled})` },
  ];

  return (
    <Layout>
      <div className="min-h-screen bg-background dark:bg-bg-default px-4 py-6 max-w-7xl mx-auto">
        {/* Breadcrumb / back */}
        <button
          onClick={() => navigate("/app/turmas")}
          className="flex items-center gap-2 text-sm text-text-muted hover:text-primary mb-4 transition-colors"
        >
          <ArrowLeft size={15} />
          Voltar para Turmas
        </button>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-text-body dark:text-text-inverted flex items-center gap-2">
              <CalendarClock size={20} className="text-primary" />
              Agendamentos da Turma
            </h1>
            {session && (
              <p className="text-sm text-text-muted mt-0.5">
                {dateLabel} &bull; {periodLabel}
                {session.max_capacity != null && (
                  <> &bull; Capacidade: {session.max_capacity}</>
                )}
              </p>
            )}
            {session && (
              <p className="text-xs font-mono text-text-muted mt-0.5">
                ID: {session.id}
              </p>
            )}
          </div>
          <button
            type="button"
            aria-label="Gerar Lista de Presença"
            onClick={handleGenerateAttendancePdf}
            disabled={loading || generatingPdf || bookings.length === 0}
            className="flex items-center gap-2 rounded-lg border border-primary/30 px-3 py-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/5 disabled:cursor-not-allowed disabled:opacity-60"
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

        {/* Filters row */}
        <div className="flex flex-col sm:flex-row gap-3 mb-4">
          {/* Status tabs */}
          <div className="flex w-full gap-1 bg-bg-default dark:bg-bg-default rounded-lg p-1 overflow-x-auto">
            {filterTabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setStatusFilter(tab.key)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  statusFilter === tab.key
                    ? "bg-bg-card dark:bg-bg-default text-primary shadow-sm"
                    : "text-text-muted hover:text-text-body dark:hover:text-text-body"
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
              className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-border-default dark:border-border-default bg-bg-card dark:bg-bg-card text-text-body dark:text-text-inverted placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
            />
          </div>
        </div>

        {/* Table */}
        <div className="bg-bg-card dark:bg-bg-card rounded-xl border border-border-default dark:border-border-default overflow-hidden">
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
                      className="rounded-xl border border-border-default bg-bg-card p-3 dark:border-border-default dark:bg-bg-card"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-text-body dark:text-text-inverted">
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
                            STATUS_CLASSES[b.status] ??
                            STATUS_CLASSES["cancelled"]
                          }`}
                        >
                          {STATUS_LABELS[b.status] ?? b.status}
                        </span>
                        {b.attendance_confirmed ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 dark:text-emerald-400">
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
                            {b.status !== "confirmed" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(b.id, "confirmed")
                                }
                                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
                                title="Confirmar agendamento"
                              >
                                <CheckCircle2 size={15} />
                              </button>
                            )}
                            {b.status !== "cancelled" && (
                              <button
                                onClick={() =>
                                  handleStatusChange(b.id, "cancelled")
                                }
                                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
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
                                  ? "text-emerald-500 hover:bg-bg-default hover:text-text-muted dark:hover:bg-bg-default/80"
                                  : "text-text-muted hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/20"
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
                    <tr className="border-b border-border-default dark:border-border-default bg-bg-default dark:bg-bg-default/60">
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
                  <tbody className="divide-y divide-border-default dark:divide-slate-800">
                    {filtered.map((b) => {
                      const isUpdating = updating === b.id;
                      return (
                        <tr
                          key={b.id}
                          className="hover:bg-bg-default dark:hover:bg-bg-default/70 transition-colors"
                        >
                          <td className="px-4 py-3 font-mono text-xs text-text-muted">
                            {b.order_number ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-text-muted dark:text-text-muted font-medium text-xs whitespace-nowrap">
                            {b.rank ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-text-body dark:text-text-inverted font-medium whitespace-nowrap">
                            {b.full_name ?? (
                              <span className="text-text-muted italic">
                                s/n
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-text-muted dark:text-text-muted whitespace-nowrap">
                            {b.war_name ?? "—"}
                          </td>
                          <td className="px-4 py-3 font-mono text-xs text-text-muted">
                            {b.saram ?? "—"}
                          </td>
                          <td className="px-4 py-3 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                                STATUS_CLASSES[b.status] ??
                                STATUS_CLASSES["cancelled"]
                              }`}
                            >
                              {STATUS_LABELS[b.status] ?? b.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {b.attendance_confirmed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
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
                                  {b.status !== "confirmed" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(b.id, "confirmed")
                                      }
                                      className="p-1.5 rounded-lg text-text-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                      title="Confirmar agendamento"
                                    >
                                      <CheckCircle2 size={15} />
                                    </button>
                                  )}
                                  {b.status !== "cancelled" && (
                                    <button
                                      onClick={() =>
                                        handleStatusChange(b.id, "cancelled")
                                      }
                                      className="p-1.5 rounded-lg text-text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
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
                                        ? "text-emerald-500 hover:text-text-muted hover:bg-bg-default dark:hover:bg-bg-default/80"
                                        : "text-text-muted hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
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
