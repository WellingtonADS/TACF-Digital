import AppIcon from "@/components/atomic/AppIcon";
import { CARD_ELEVATED_CLASS } from "@/components/atomic/Card";
import Layout from "@/components/layout/Layout";
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
  MinusCircle,
  XCircle,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Breadcrumbs from "../components/Breadcrumbs";
import PageSkeleton from "../components/PageSkeleton";
import RescheduleDrawer from "../components/RescheduleDrawer";
import useDashboard from "../hooks/useDashboard";
import usePaginatedQuery from "../hooks/usePaginatedQuery";
import useResponsive from "../hooks/useResponsive";
import { prefetchRoute } from "../utils/prefetchRoutes";

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
  if (status === "apto") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-success px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-inverted">
        <AppIcon icon={CheckCircle} size="xs" tone="inverse" /> APTO
      </span>
    );
  }

  if (status === "inapto") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-error px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-inverted">
        <AppIcon icon={XCircle} size="xs" tone="inverse" /> INAPTO
      </span>
    );
  }

  if (status === "pendente") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-default px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-body">
        <AppIcon icon={CalendarClock} size="xs" tone="muted" /> PENDENTE
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border-default bg-bg-default px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-text-muted">
      <AppIcon icon={MinusCircle} size="xs" tone="muted" /> SEM STATUS
    </span>
  );
}

export default function ResultsHistory() {
  const { isMobile, isTablet } = useResponsive();
  const isCompactViewport = isMobile || isTablet;

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

  type RawRow = Result & {
    result_details?: unknown;
    concept?: string | null;
    location?: string | null;
  };

  const rows = useMemo(() => {
    return items.map((r) => {
      // attempt to normalize result_details which can be JSONB or text
      let detail: Record<string, unknown> | null = null;
      try {
        const raw = (r as RawRow).result_details;
        if (typeof raw === "string") {
          try {
            detail = JSON.parse(raw) as Record<string, unknown>;
          } catch (_err) {
            detail = null;
          }
        } else if (raw && typeof raw === "object") {
          detail = raw as Record<string, unknown>;
        }
      } catch (_e) {
        detail = null;
      }

      const detailObj = detail;

      const concept =
        detailObj && typeof detailObj["concept"] === "string"
          ? (detailObj["concept"] as string)
          : ((r as RawRow).concept ?? null);

      const location =
        detailObj && typeof detailObj["location"] === "string"
          ? (detailObj["location"] as string)
          : ((r as RawRow).location ?? null);

      const result_status =
        detailObj && typeof detailObj["result_status"] === "string"
          ? (detailObj["result_status"] as Result["result_status"])
          : (((r as RawRow).result_status as Result["result_status"]) ?? null);

      return {
        ...r,
        concept,
        location,
        result_status,
      } as Result & { concept?: string | null; location?: string | null };
    });
  }, [items]);

  // (old deduplication logic removed; rows is used directly)
  // deduplicate rows by id to avoid duplicate React keys
  // const dedupedRows = useMemo(() => {
  //   const seen = new Set<string>();
  //   const out: (Result & {
  //     concept?: string | null;
  //     location?: string | null;
  //   })[] = [];
  //   for (const r of rows) {
  //     if (!r || !r.id) continue;
  //     if (seen.has(r.id)) continue;
  //     seen.add(r.id);
  //     out.push(r);
  //   }
  //   return out;
  // }, [rows]);

  useEffect(() => {
    async function loadPending() {
      const ids = rows.map((r) => r.id);
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
  }, [rows]);

  // derive KPI values from rows
  const lastResult = rows[0] ?? null;
  // Prefer explicit result_status from latest booking; if missing, fall back to inspsauDaysRemaining
  const lastStatus: Result["result_status"] =
    (lastResult?.result_status as Result["result_status"]) ??
    (typeof inspsauDaysRemaining === "number"
      ? inspsauDaysRemaining > 0
        ? "apto"
        : "inapto"
      : null);
  const scores = rows
    .map((r) => parseFloat(r.score ?? ""))
    .filter((n) => !isNaN(n));
  const avgScore =
    scores.length > 0
      ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1)
      : null;

  // days until revalidation: use inspsauDaysRemaining from hook if available
  const daysUntilReval: number | null = inspsauDaysRemaining ?? null;
  const revalidationPct =
    daysUntilReval !== null
      ? Math.min(Math.max(Math.round((daysUntilReval / 365) * 100), 0), 100)
      : 0;

  return (
    <Layout>
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-0">
        <Breadcrumbs items={["Histórico"]} />

        <header className="mb-6 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl md:text-2xl lg:text-3xl font-bold text-text-body">
              Histórico de Avaliações
            </h1>
            <p className="mt-1 text-sm text-text-muted sm:text-base">
              Consulte seus resultados passados e status de prontidão física.
            </p>
          </div>
        </header>

        {/* KPI Cards */}
        <div className="mb-10 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-3">
          {/* Card 1: Status */}
          <div
            className={`${CARD_ELEVATED_CLASS} relative overflow-hidden rounded-2xl border border-border-default p-5 sm:p-6`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AppIcon icon={CheckCircle} size="lg" tone="primary" />
            </div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">
              Status de Prontidão
            </p>
            {loading ? (
              <div className="h-10 w-28 animate-pulse rounded bg-bg-default" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span
                    className={`text-2xl md:text-4xl font-black ${
                      lastStatus === "apto"
                        ? "text-success"
                        : lastStatus === "inapto"
                          ? "text-error"
                          : lastStatus === "pendente"
                            ? "text-primary"
                            : "text-text-body"
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
                  <div className="mt-4 flex w-fit items-center gap-1 rounded bg-success/10 px-2 py-1 text-xs font-semibold text-success">
                    <AppIcon icon={CheckCircle} size="xs" tone="default" />
                    PRONTO PARA O SERVIÇO
                  </div>
                )}
                {lastStatus === "pendente" && (
                  <p className="mt-4 text-xs font-semibold text-text-muted">
                    Aguardando consolidação do resultado mais recente.
                  </p>
                )}
              </>
            )}
          </div>

          {/* Card 2: Média do histórico */}
          <div
            className={`${CARD_ELEVATED_CLASS} relative overflow-hidden rounded-2xl border border-border-default p-5 sm:p-6`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AppIcon icon={Award} size="lg" tone="primary" />
            </div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">
              Média do Histórico
            </p>
            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded bg-bg-default" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-4xl font-black text-text-body">
                    {avgScore ?? "--"}
                  </span>
                  <span className="text-sm font-medium text-text-muted">
                    média geral
                  </span>
                </div>
                {lastResult?.test_date && (
                  <p className="mt-4 text-xs font-semibold text-text-muted">
                    Último TACF em{" "}
                    {new Date(lastResult.test_date).toLocaleDateString("pt-BR")}
                  </p>
                )}
              </>
            )}
          </div>

          {/* Card 3: Revalidação */}
          <div
            className={`${CARD_ELEVATED_CLASS} relative overflow-hidden rounded-2xl border border-border-default p-5 sm:p-6`}
          >
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <AppIcon icon={CalendarClock} size="lg" tone="primary" />
            </div>
            <p className="mb-4 text-xs font-bold uppercase tracking-widest text-text-muted">
              Próxima Revalidação
            </p>
            {loading ? (
              <div className="h-10 w-20 animate-pulse rounded bg-bg-default" />
            ) : (
              <>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl md:text-4xl font-black text-text-body">
                    {daysUntilReval !== null ? daysUntilReval : "--"}
                  </span>
                  <span className="text-sm font-medium text-text-muted">
                    dias restantes
                  </span>
                </div>
                {daysUntilReval !== null && (
                  <div className="mt-4 w-full bg-bg-default h-1.5 rounded-full overflow-hidden">
                    <div
                      className={`h-full revalidation-progress ${
                        daysUntilReval <= 30 ? "bg-error" : "bg-primary"
                      }`}
                      data-pct={revalidationPct}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </div>

        {/* Table */}
        <section
          className={`${CARD_ELEVATED_CLASS} overflow-hidden rounded-3xl border border-border-default`}
        >
          <div className="border-b border-border-default bg-bg-default/50 p-4 sm:p-6">
            <h2 className="flex items-center gap-2 text-lg font-bold text-text-body md:text-xl">
              <AppIcon icon={ClipboardList} size="md" tone="primary" />
              Registros de Avaliações
            </h2>
          </div>
          {rows.length === 0 && loading ? (
            <div className="px-3 py-6">
              <PageSkeleton rows={6} />
            </div>
          ) : rows.length === 0 ? (
            <div className="px-4 py-12 text-center text-text-muted sm:px-6">
              Você ainda não possui resultados registrados.
            </div>
          ) : isCompactViewport ? (
            <div className="grid grid-cols-1 gap-3 p-4 sm:p-6">
              {rows.map((r) => {
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
                  <article
                    key={r.id}
                    className={`rounded-xl border p-4 ${
                      isFuture
                        ? "border-primary/30 bg-primary/5"
                        : "border-border-default bg-bg-card"
                    }`}
                  >
                    <div className="mb-3 flex items-start justify-between gap-2">
                      <div>
                        <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                          Data
                        </p>
                        <p className="text-sm font-bold uppercase text-text-body">
                          {dateLabel}
                        </p>
                      </div>
                      <StatusBadge status={r.result_status ?? null} />
                    </div>

                    <div className="mb-3 flex items-center gap-2 text-sm text-text-muted">
                      <AppIcon icon={MapPin} size="xs" tone="muted" />
                      <span className="font-medium uppercase">
                        {r.location ?? "-"}
                      </span>
                    </div>

                    <div className="mb-4">
                      <p className="text-xs font-bold uppercase tracking-widest text-text-muted">
                        Média / Conceito
                      </p>
                      <p className="text-sm font-black text-text-body">
                        {r.score ?? "--"}
                        {r.concept && (
                          <span className="ml-1 text-[10px] font-bold uppercase tracking-tighter text-text-muted">
                            {r.concept}
                          </span>
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 border-t border-border-default pt-3">
                      <a
                        href={`/app/recurso?result=${r.id}`}
                        onMouseEnter={() => prefetchRoute("/app/recurso")}
                        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-tighter text-primary transition-colors hover:text-primary/80"
                      >
                        Visualizar Detalhes
                        <AppIcon icon={ExternalLink} size="xs" tone="primary" />
                      </a>
                      {isFuture && (
                        <button
                          onClick={() => {
                            setDrawerBookingId(r.id);
                            setDrawerCurrentDate(r.test_date ?? "");
                            setDrawerOpen(true);
                          }}
                          className="text-xs font-bold text-primary transition-colors hover:text-primary/80"
                        >
                          Reagendar
                          {pendingSwaps.has(r.id) && (
                            <span className="ml-1 text-[10px] text-text-muted">
                              (Pendente)
                            </span>
                          )}
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left border-collapse">
                <thead>
                  <tr className="bg-bg-default">
                    <th className="border-b border-border-default px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted sm:px-6">
                      Data
                    </th>
                    <th className="border-b border-border-default px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted sm:px-6">
                      Local de Avaliação
                    </th>
                    <th className="border-b border-border-default px-4 py-4 text-[10px] font-bold uppercase tracking-widest text-text-muted sm:px-6">
                      Média / Conceito
                    </th>
                    <th className="border-b border-border-default px-4 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-text-muted sm:px-6">
                      Resultado
                    </th>
                    <th className="border-b border-border-default px-4 py-4 text-right text-[10px] font-bold uppercase tracking-widest text-text-muted sm:px-6">
                      Ações
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {rows.map((r) => {
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
                        className={`hover:bg-bg-default/80 transition-colors ${
                          isFuture ? "bg-primary/5" : ""
                        }`}
                      >
                        <td className="px-4 py-5 sm:px-6">
                          <span className="text-sm font-bold text-text-body uppercase">
                            {dateLabel}
                          </span>
                        </td>
                        <td className="px-4 py-5 sm:px-6">
                          <div className="flex items-center gap-2">
                            <AppIcon icon={MapPin} size="xs" tone="muted" />
                            <span className="text-sm text-text-muted font-medium uppercase">
                              {r.location ?? "-"}
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-5 sm:px-6">
                          <span className="text-sm font-black text-text-body">
                            {r.score ?? "--"}
                          </span>
                          {r.concept && (
                            <span className="text-[10px] text-text-muted ml-1 font-bold uppercase tracking-tighter">
                              {r.concept}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-5 text-center sm:px-6">
                          <StatusBadge status={r.result_status ?? null} />
                        </td>
                        <td className="px-4 py-5 text-right sm:px-6">
                          <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
                            <a
                              href={`/app/recurso?result=${r.id}`}
                              onMouseEnter={() => prefetchRoute("/app/recurso")}
                              className="inline-flex items-center gap-1 whitespace-nowrap text-xs font-bold uppercase tracking-tighter text-primary hover:text-primary/80"
                            >
                              Visualizar Detalhes
                              <AppIcon
                                icon={ExternalLink}
                                size="xs"
                                tone="primary"
                              />
                            </a>
                            {isFuture && (
                              <button
                                onClick={() => {
                                  setDrawerBookingId(r.id);
                                  setDrawerCurrentDate(r.test_date ?? "");
                                  setDrawerOpen(true);
                                }}
                                className="text-xs font-bold text-primary transition-colors hover:text-primary/80"
                              >
                                Reagendar
                                {pendingSwaps.has(r.id) && (
                                  <span className="ml-1 text-[10px] text-text-muted">
                                    (Pendente)
                                  </span>
                                )}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="flex flex-col gap-2 border-t border-border-default bg-bg-default px-4 py-4 text-xs font-semibold uppercase tracking-widest text-text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <span>{rows.length > 0 ? `${rows.length} registro(s)` : ""}</span>
            {hasMore && (
              <button
                onClick={() => fetchPage()}
                className="flex items-center gap-1 self-start transition-colors hover:text-primary sm:self-auto"
                disabled={loading}
              >
                {loading ? "Carregando..." : "Carregar mais"}
                <AppIcon icon={ChevronRight} size="xs" tone="muted" />
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
