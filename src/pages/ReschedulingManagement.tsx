import PageSkeleton from "@/components/PageSkeleton";
import Layout from "@/components/layout/Layout";
import supabase from "@/services/supabase";
import type { BookingRow as DBBookingRow } from "@/types";
import { Search } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

/**
 * Line items coming from bookings that requested a swap/reagendamento.
 * We extend with some derived fields to drive the table UI.
 */
type BookingRow = DBBookingRow;

type RequestRow = BookingRow & {
  originalDate?: string | null;
  newDate?: string | null;
  fullName?: string | null;
  warName?: string | null;
  saram?: string | null;
};

const STATUS_LABELS: Record<string, string> = {
  pending_swap: "Pendente",
  confirmed: "Aprovado",
  cancelled: "Recusado",
};

export default function ReschedulingManagement() {
  const [rows, setRows] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<
    "pendentes" | "aprovados" | "recusados"
  >("pendentes");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<RequestRow | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // fetch bookings that contain a swap_reason (current schema); the
        // backend may later provide a dedicated swap_requests table but
        // this keeps the page working without DB changes.
        const { data: bookingsData, error: bookingsError } = await supabase
          .from("bookings")
          .select("*")
          .not("swap_reason", "is", null);

        if (bookingsError) throw bookingsError;
        const bookings = (bookingsData ?? []) as unknown as BookingRow[];

        // load sessions for original date lookup
        const sessionIds = Array.from(
          new Set(bookings.map((b) => b.session_id)),
        ).filter(Boolean) as string[];

        const sessionsById = new Map<string, string>();
        if (sessionIds.length > 0) {
          const { data: sessionsData } = await supabase
            .from("sessions")
            .select("id,date")
            .in("id", sessionIds);
          sessionsData?.forEach((s) => sessionsById.set(s.id, s.date));
        }

        // load basic profile info for display
        const userIds = Array.from(new Set(bookings.map((b) => b.user_id)));
        const profilesByUser = new Map<
          string,
          { full_name: string; war_name: string; saram: string }
        >();
        if (userIds.length > 0) {
          const { data: profilesData } = await supabase
            .from("profiles")
            .select("id,full_name,war_name,saram")
            .in("id", userIds);
          profilesData?.forEach((p) =>
            profilesByUser.set(p.id, {
              full_name: p.full_name ?? "",
              war_name: p.war_name ?? "",
              saram: p.saram ?? "",
            }),
          );
        }

        setRows(
          bookings.map((b) => {
            const profile = profilesByUser.get(b.user_id);
            return {
              ...b,
              originalDate: sessionsById.get(b.session_id) ?? null,
              newDate: b.test_date ?? null,
              fullName: profile?.full_name ?? "",
              warName: profile?.war_name ?? "",
              saram: profile?.saram ?? "",
            };
          }),
        );
      } catch (err) {
        console.error(err);
        toast.error("Falha ao carregar solicitações");
        setRows([]);
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [statusFilter]);

  const visibleRows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (q) {
        const target = `${r.fullName ?? ""} ${r.warName ?? ""} ${r.saram ?? ""}`;
        if (!target.toLowerCase().includes(q)) return false;
      }
      if (statusFilter === "pendentes") return r.status === "pending_swap";
      if (statusFilter === "aprovados") return r.status === "confirmed";
      if (statusFilter === "recusados") return r.status === "cancelled";
      return true;
    });
  }, [rows, query, statusFilter]);

  async function changeStatus(id: string, status: "confirmed" | "cancelled") {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Registro atualizado");
    setRows((rs) => rs.filter((r) => r.id !== id));
    setSelected((s) => (s?.id === id ? null : s));
  }

  if (loading) return <PageSkeleton />;

  return (
    <Layout>
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border-default bg-bg-card px-4 py-3 md:px-8 md:py-4">
        <div className="flex items-center gap-4">
          <div className="bg-primary p-2 rounded-lg">
            <span className="material-icons text-primary-foreground">
              event_repeat
            </span>
          </div>
          <h1 className="text-sm md:text-lg lg:text-2xl font-extrabold tracking-tight uppercase text-text-body">
            Gestão de Solicitações de Reagendamento
          </h1>
        </div>
        {/* TODO: user avatar/details reuse from other headers */}
      </header>

      <main className="max-w-[1440px] mx-auto p-4 md:p-8 space-y-6 md:space-y-8">
        {/* summary bar */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 flex flex-col gap-4 rounded-xl border border-border-default bg-bg-card p-4 shadow-sm lg:flex-row lg:items-center">
            <div className="flex-1 flex flex-wrap gap-2">
              {(["pendentes", "aprovados", "recusados"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setStatusFilter(t)}
                  className={`px-4 sm:px-6 py-2 font-bold rounded-lg text-sm ${
                    statusFilter === t
                      ? "bg-primary text-primary-foreground"
                      : "bg-bg-default text-text-muted hover:bg-bg-default/80"
                  }`}
                >
                  {t.toUpperCase()}
                </button>
              ))}
            </div>
            <div className="relative w-full lg:w-80">
              <Search
                className="absolute left-3 top-2.5 text-slate-400"
                size={16}
              />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="PESQUISAR POR SARAM OU NOME..."
                className="w-full rounded-lg border border-border-default bg-bg-default py-2 pl-10 pr-4 text-xs font-semibold uppercase text-text-body focus:border-primary focus:ring-primary"
                type="text"
              />
            </div>
          </div>
          <div className="flex flex-col justify-center rounded-xl border-l-4 border-alert bg-bg-card p-4 shadow-md">
            <span className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
              SOLICITAÇÕES {statusFilter.toUpperCase()}
            </span>
            <div className="flex items-center gap-2">
              <span className="text-xl md:text-3xl font-black text-text-body">
                {visibleRows.length}
              </span>
              <span className="material-icons text-alert">pending_actions</span>
            </div>
          </div>
        </div>

        {/* table */}
        <div className="overflow-hidden rounded-xl border border-border-default bg-bg-card shadow-2xl">
          <div className="space-y-2 p-3 md:hidden">
            {visibleRows.map((r) => (
              <article
                key={r.id}
                className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900"
              >
                <p className="text-sm font-bold uppercase text-slate-900 dark:text-white">
                  {r.fullName ?? "(desconhecido)"}
                </p>
                <p className="mt-1 font-mono text-xs font-semibold text-slate-500">
                  SARAM: {r.saram ?? "----"}
                </p>
                <div className="mt-2 grid grid-cols-1 gap-1 text-xs">
                  <p className="text-slate-500">
                    Data Original: {r.originalDate ?? "--"}
                  </p>
                  <p className="text-primary">Nova Data: {r.newDate ?? "--"}</p>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      r.status === "pending_swap"
                        ? "bg-alert/15 text-alert"
                        : r.status === "confirmed"
                          ? "bg-success/15 text-success"
                          : "bg-error/15 text-error"
                    }`}
                  >
                    {STATUS_LABELS[r.status] ?? r.status}
                  </span>
                  <button
                    onClick={() => setSelected(r)}
                    className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-tighter"
                  >
                    Ver justificativa
                  </button>
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => changeStatus(r.id, "confirmed")}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-success px-3 py-1.5 text-[10px] font-bold text-success-foreground shadow-md transition-all hover:brightness-110"
                  >
                    <span className="material-icons text-xs">check_circle</span>
                    DEFERIR
                  </button>
                  <button
                    onClick={() => changeStatus(r.id, "cancelled")}
                    className="flex flex-1 items-center justify-center gap-1 rounded-lg border border-error px-3 py-1.5 text-[10px] font-bold text-error transition-all hover:bg-error hover:text-error-foreground"
                  >
                    <span className="material-icons text-xs">cancel</span>
                    INDEFERIR
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="hidden overflow-x-auto md:block">
            <table className="w-full min-w-[980px] text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Militar
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    SARAM
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Data Original
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Nova Data
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-center text-slate-500">
                    Motivo
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-slate-500">
                    Status
                  </th>
                  <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-widest text-right pr-12 text-slate-500">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {visibleRows.map((r) => (
                  <tr
                    key={r.id}
                    className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="px-6 py-5">
                      <div className="flex flex-col">
                        <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                          {r.fullName ?? "(desconhecido)"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="font-mono text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {r.saram ?? "----"}
                      </span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                        <span className="material-icons text-sm">
                          calendar_today
                        </span>
                        {r.originalDate ?? "--"}
                      </div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <span className="material-icons text-sm">
                          event_upcoming
                        </span>
                        {r.newDate ?? "--"}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <button
                        onClick={() => setSelected(r)}
                        className="text-[10px] font-extrabold text-primary hover:underline uppercase tracking-tighter flex items-center justify-center gap-1 mx-auto"
                      >
                        <span className="material-icons text-xs">
                          visibility
                        </span>
                        Ver Justificativa
                      </button>
                    </td>
                    <td className="px-6 py-5">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                          r.status === "pending_swap"
                            ? "bg-alert/15 text-alert"
                            : r.status === "confirmed"
                              ? "bg-success/15 text-success"
                              : "bg-error/15 text-error"
                        }`}
                      >
                        {STATUS_LABELS[r.status] ?? r.status}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        <button
                          onClick={() => changeStatus(r.id, "confirmed")}
                          className="flex items-center gap-1 rounded-lg bg-success px-4 py-1.5 text-[10px] font-bold text-success-foreground shadow-md transition-all hover:brightness-110"
                        >
                          <span className="material-icons text-xs">
                            check_circle
                          </span>
                          DEFERIR
                        </button>
                        <button
                          onClick={() => changeStatus(r.id, "cancelled")}
                          className="flex items-center gap-1 rounded-lg border border-error px-4 py-1.5 text-[10px] font-bold text-error transition-all hover:bg-error hover:text-error-foreground"
                        >
                          <span className="material-icons text-xs">cancel</span>
                          INDEFERIR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* pagination placeholder if needed */}
        </div>

        {/* justification popover */}
        {selected && (
          <div className="fixed bottom-4 left-4 right-4 sm:bottom-8 sm:left-auto sm:right-8 sm:w-80 bg-white dark:bg-slate-900 rounded-xl shadow-2xl border-2 border-primary ring-4 ring-primary/5 p-5 animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center justify-between mb-3 border-b border-slate-100 pb-2">
              <span className="text-[10px] font-black text-primary uppercase tracking-widest">
                Justificativa Selecionada
              </span>
              <button
                className="text-slate-400 hover:text-slate-600"
                onClick={() => setSelected(null)}
              >
                <span className="material-icons text-sm">close</span>
              </button>
            </div>
            <div className="space-y-3">
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Militar
                </span>
                <span className="text-xs font-bold text-slate-900 dark:text-white uppercase">
                  {selected.fullName}
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Motivo
                </span>
                <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 italic">
                  {selected.swap_reason}
                </span>
              </div>
              {selected.swap_reason && (
                <div className="pt-2">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">
                    Anexo
                  </span>
                  {/* no anexos currently; future work */}
                </div>
              )}
            </div>
          </div>
        )}
      </main>
      {/* background pattern preserved by Layout? */}
    </Layout>
  );
}
