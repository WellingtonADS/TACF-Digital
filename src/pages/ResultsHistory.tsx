/**
 * @page ResultsHistory
 * @description Histórico de resultados e avaliações.
 * @path src/pages/ResultsHistory.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import {
  CARD_ELEVATED_CLASS,
  CARD_INTERACTIVE_CLASS,
} from "@/components/atomic/Card";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import {
  CalendarClock,
  CheckCircle,
  ChevronRight,
  ClipboardList,
  ExternalLink,
  MapPin,
  MinusCircle,
  XCircle,
} from "@/icons";
import supabase from "@/services/supabase";
import { isAfter, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import PageSkeleton from "../components/PageSkeleton";
import RescheduleDrawer from "../components/RescheduleDrawer";
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

  // deduplicate rows by id to avoid duplicate React keys
  const dedupedRows = useMemo(() => {
    const seen = new Set<string>();
    const out: (Result & {
      concept?: string | null;
      location?: string | null;
    })[] = [];
    for (const r of rows) {
      if (!r || !r.id) continue;
      if (seen.has(r.id)) continue;
      seen.add(r.id);
      out.push(r);
    }
    return out;
  }, [rows]);

  useEffect(() => {
    async function loadPending() {
      const ids = dedupedRows.map((r) => r.id);
      if (ids.length === 0) {
        setPendingSwaps(new Set());
        return;
      }
      try {
        const { data, error } = await supabase
          .from("swap_requests")
          .select("booking_id")
          .in("booking_id", ids)
          // eslint-disable-next-line @typescript-eslint/no-explicit-any -- supabase-generated types mismatch our enum
          .eq("status", "solicitado" as any);
        if (error) throw error;
        const set = new Set<string>();
        (data ?? []).forEach((r) => r.booking_id && set.add(r.booking_id));
        setPendingSwaps(set);
      } catch (err) {
        console.error(err);
      }
    }
    loadPending();
  }, [dedupedRows]);

  if (loading) return <FullPageLoading message="Carregando registros" />;

  return (
    <Layout>
      <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-0">
        <header className="mb-8 rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8">
          <h1 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
            Histórico de Avaliações
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-relaxed text-white/85">
            Consulte seus resultados passados e status de prontidão física.
          </p>
        </header>

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
          {dedupedRows.length === 0 && loading ? (
            <div className="px-3 py-6">
              <PageSkeleton rows={6} />
            </div>
          ) : dedupedRows.length === 0 ? (
            <div className="px-4 py-12 text-center text-text-muted sm:px-6">
              Você ainda não possui resultados registrados.
            </div>
          ) : isCompactViewport ? (
            <div className="grid grid-cols-1 gap-3 p-4 sm:p-6">
              {dedupedRows.map((r) => {
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
                    className={`${CARD_INTERACTIVE_CLASS} rounded-2xl border p-6 ${
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
                  {dedupedRows.map((r) => {
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
            <span>
              {dedupedRows.length > 0
                ? `${dedupedRows.length} registro(s)`
                : ""}
            </span>
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
