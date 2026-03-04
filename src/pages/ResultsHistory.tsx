import supabase from "@/services/supabase";
import { isAfter, parseISO } from "date-fns";
import {
  Award,
  CalendarClock,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  MapPin,
  XCircle,
} from "lucide-react";
import { useEffect, useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import PageSkeleton from "../components/PageSkeleton";
import RescheduleDrawer from "../components/RescheduleDrawer";
import useDashboard from "../hooks/useDashboard";
import usePaginatedQuery from "../hooks/usePaginatedQuery";
import Layout from "../layout/Layout";

type Result = {
  id: string;
  profile_id?: string | null;
  full_name?: string | null;
  saram?: string | null;
  test_date?: string | null;
  score?: string | null;
  created_at?: string | null;
  location?: string | null;
  concept?: string | null;
  result_status?: "apto" | "inapto" | "pendente" | null;
};

function StatusBadge({ status }: { status: Result["result_status"] }) {
  if (status === "apto")
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-600 text-white">
        <CheckCircle size={11} /> APTO
      </span>
    );
  if (status === "inapto")
    return (
      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-red-600 text-white">
        <XCircle size={11} /> INAPTO
      </span>
    );
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white">
      PENDENTE
    </span>
  );
}

export default function ResultsHistory() {
  const { items, loading, hasMore, fetchPage } = usePaginatedQuery<Result>(
    "get_results_history",
    { limit: 25 },
  );
  const { inspsauDaysRemaining } = useDashboard() as unknown as {
    inspsauDaysRemaining?: number;
  };
  const [pendingSwaps, setPendingSwaps] = useState<Set<string>>(new Set());
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBookingId, setDrawerBookingId] = useState<string | null>(null);
  const [drawerCurrentDate, setDrawerCurrentDate] = useState<string>("");

  useEffect(() => {
    fetchPage();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    async function loadPending() {
      const ids = items.map((r) => r.id);
      if (ids.length === 0) {
        setPendingSwaps(new Set());
        return;
      }
      try {
        const { data, error } = await supabase
          .from("swap_requests")
          .select("booking_id")
          .in("booking_id", ids)
          .eq("status", "pending");
        if (error) throw error;
        const set = new Set<string>();
        (data ?? []).forEach((r) => r.booking_id && set.add(r.booking_id));
        setPendingSwaps(set);
      } catch (err) {
        console.error(err);
      }
    }
    loadPending();
  }, [items]);

  // derive KPI values from items
  const lastResult = items[0] ?? null;
  const lastStatus: Result["result_status"] = lastResult?.result_status ?? null;
  const scores = items
    .map((r) => parseFloat(r.score ?? ""))
    .filter((n) => !isNaN(n));
  const avgScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null;

  // days until revalidation: use inspsauDaysRemaining from hook if available
  const daysUntilReval: number | null = inspsauDaysRemaining ?? null;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <Breadcrumbs items={["Histórico"]} />

        <header className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-slate-900 dark:text-white">
              Histórico de Avaliações
            </h1>
            <p className="text-slate-500 mt-1">
              Consulte seus resultados passados e status de prontidão física.
            </p>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {/* Card 1: Status */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CheckCircle size={56} className="text-emerald-600" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Status Atual
            </p>
            {loading ? (
              <div className="h-10 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl md:text-4xl font-black ${
                      lastStatus === "apto"
                        ? "text-emerald-600"
                        : lastStatus === "inapto"
                          ? "text-red-600"
                          : "text-amber-500"
                    }`}
                  >
                    {lastStatus === "apto"
                      ? "APTO"
                      : lastStatus === "inapto"
                        ? "INAPTO"
                        : lastStatus === "pendente"
                          ? "PENDENTE"
                          : "--"}
                  </span>
                </div>
                {lastStatus === "apto" && (
                  <div className="mt-4 flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-600/10 w-fit px-2 py-1 rounded">
                    <CheckCircle size={13} />
                    PRONTO PARA O SERVIÇO
                  </div>
                )}
              </>
            )}
          </div>

          {/* Card 2: Média */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Award size={56} className="text-primary" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Último TACF
            </p>
            {loading ? (
              <div className="h-10 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
                    {avgScore ?? "--"}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    Média Global
                  </span>
                </div>
                {lastResult?.test_date && (
                  <p className="mt-4 text-xs font-semibold text-slate-500">
                    Realizado em{" "}
                    {new Date(lastResult.test_date).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Card 3: Revalidação */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-xl shadow-sm border border-slate-100 dark:border-slate-800 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <CalendarClock size={56} className="text-amber-500" />
            </div>
            <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
              Próxima Revalidação
            </p>
            {loading ? (
              <div className="h-10 w-20 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-4xl font-black text-slate-900 dark:text-white">
                    {daysUntilReval !== null ? daysUntilReval : "--"}
                  </span>
                  <span className="text-sm font-medium text-slate-400">
                    dias restantes
                  </span>
                </div>
                {daysUntilReval !== null && (
                  <div className="mt-4 w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-amber-500 h-full revalidation-progress"
                      data-pct={Math.min(
                        Math.round((daysUntilReval / 365) * 100),
                        100,
                      )}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <section className="bg-white dark:bg-slate-900 rounded-3xl shadow-xl overflow-hidden border border-slate-100 dark:border-slate-800">
          <div className="p-6 border-b border-slate-50 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/50">
            <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList size={20} className="text-primary" />
              Registros de Avaliações
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-slate-800/30">
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Data
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Local de Avaliação
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800">
                    Média / Conceito
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 text-center">
                    Resultado
                  </th>
                  <th className="px-6 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-800 text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.length === 0 && loading ? (
                  <tr>
                    <td colSpan={5} className="px-3 py-6">
                      <PageSkeleton rows={6} />
                    </td>
                  </tr>
                ) : items.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-6 py-12 text-center text-slate-500"
                    >
                      Você ainda não possui resultados registrados.
                    </td>
                  </tr>
                ) : (
                  items.map((r) => {
                    const isFuture = r.test_date
                      ? isAfter(parseISO(r.test_date), new Date())
                      : false;
                    const dateLabel = r.test_date
                      ? new Date(r.test_date)
                          .toLocaleDateString("pt-BR", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                          })
                          .replace(".", "")
                          .toUpperCase()
                      : "-";
                    return (
                      <tr
                        key={r.id}
                        className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                          isFuture
                            ? "bg-emerald-50/50 dark:bg-emerald-900/10"
                            : ""
                        }`}
                      >
                        <td className="px-6 py-5">
                          <span className="text-sm font-bold text-slate-900 dark:text-white uppercase">
                            {dateLabel}
                          </span>
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            <MapPin size={14} className="text-slate-400" />
                            <span className="text-sm text-slate-600 dark:text-slate-300 font-medium uppercase">
                              {r.location ?? "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <span className="text-sm font-black text-slate-900 dark:text-white">
                            {r.score ?? "--"}
                          </span>
                          {r.concept && (
                            <span className="text-[10px] text-slate-400 ml-1 font-bold uppercase tracking-tighter">
                              {r.concept}
                            </span>
                          )}
                        </td>
                        <td className="px-6 py-5 text-center">
                          <StatusBadge status={r.result_status ?? null} />
                        </td>
                        <td className="px-6 py-5 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <a
                              href={`/app/recurso?result=${r.id}`}
                              className="text-primary hover:text-primary/80 inline-flex items-center gap-1 text-xs font-bold uppercase tracking-tighter"
                            >
                              Visualizar Detalhes
                              <ExternalLink size={13} />
                            </a>
                            {isFuture && (
                              <button
                                onClick={() => {
                                  setDrawerBookingId(r.id);
                                  setDrawerCurrentDate(r.test_date ?? "");
                                  setDrawerOpen(true);
                                }}
                                className="text-xs text-amber-600 hover:underline font-bold"
                              >
                                Reagendar
                                {pendingSwaps.has(r.id) && (
                                  <span className="ml-1 text-[10px]">
                                    (Pendente)
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center text-xs font-semibold text-slate-500 uppercase tracking-widest">
            <span>{items.length > 0 ? `${items.length} registro(s)` : ""}</span>
            {hasMore && (
              <button
                onClick={() => fetchPage()}
                className="flex items-center gap-1 hover:text-primary transition-colors"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Carregar mais"}
                <ChevronRight size={15} />
              </button>
            )}
          </div>
        </section>
      </div>

      <RescheduleDrawer
        open={drawerOpen}
        bookingId={drawerBookingId ?? ""}
        currentDate={drawerCurrentDate}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => {}}
      />
    </Layout>
  );
}
