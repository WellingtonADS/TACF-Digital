/**
 * @page AuditLog
 * @description Exibição do registro de auditoria do sistema.
 * @path src/pages/AuditLog.tsx
 */



import FullPageLoading from "@/components/FullPageLoading";
import AppIcon from "@/components/atomic/AppIcon";
import StatCard from "@/components/atomic/StatCard";
import Layout from "@/components/layout/Layout";
import useResponsive from "@/hooks/useResponsive";
import {
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Code2,
  Download,
  Filter,
  Plus,
  Search,
  Shield,
  Timer,
  Trash2,
  X,
} from "@/icons";
import supabase from "@/services/supabase";
import type { AuditLogRow as DBAuditLogRow } from "@/types";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type AuditLogRow = DBAuditLogRow;

// ── Helpers ────────────────────────────────────────────────────────────────

function extractIp(details: string | null | undefined): string {
  try {
    if (!details) return "-";
    const obj = JSON.parse(details) as Record<string, unknown>;
    return typeof obj.ip === "string" ? obj.ip : "-";
  } catch {
    return "-";
  }
}

function formatJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

function ActionBadge({ action }: { action: string | null | undefined }) {
  const a = (action ?? "").toUpperCase();
  if (a.includes("INSERT") || a.includes("CREATE")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800">
        <Plus size={11} />
        {action}
      </span>
    );
  }
  if (a.includes("UPDATE") || a.includes("EDIT")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-900/20 dark:text-amber-400 dark:border-amber-700">
        <Filter size={11} />
        {action}
      </span>
    );
  }
  if (a.includes("DELETE")) {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-red-50 text-red-700 border border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800">
        <Trash2 size={11} />
        {action}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold bg-bg-default text-text-muted border border-border-default">
      {action ?? "—"}
    </span>
  );
}

function rowAccent(action: string | null | undefined): string {
  const a = (action ?? "").toUpperCase();
  if (a.includes("INSERT") || a.includes("CREATE"))
    return "border-l-emerald-500";
  if (a.includes("UPDATE") || a.includes("EDIT")) return "border-l-amber-400";
  if (a.includes("DELETE")) return "border-l-red-500";
  return "border-l-border-default dark:border-l-border-default";
}

// ── Component ──────────────────────────────────────────────────────────────

export default function AuditLog() {
  const [loading, setLoading] = useState(true);
  const [records, setRecords] = useState<AuditLogRow[]>([]);

  const [filterUser, setFilterUser] = useState("");
  const [filterAction, setFilterAction] = useState("");
  const [filterModule, setFilterModule] = useState("");

  const perPage = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [detailRecord, setDetailRecord] = useState<AuditLogRow | null>(null);
  const { isMobile, isTablet } = useResponsive();
  const isCompactViewport = isMobile || isTablet;

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      const { data, error } = await supabase
        .from("audit_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(500);

      if (error) {
        console.error(error);
        toast.error("Erro ao carregar logs de auditoria");
        if (mounted) setRecords([]);
      } else {
        if (mounted) setRecords((data as AuditLogRow[]) ?? []);
      }
      if (mounted) setLoading(false);
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    return records.filter((r) => {
      if (
        filterUser &&
        !r.user_name?.toLowerCase().includes(filterUser.toLowerCase())
      )
        return false;
      if (
        filterAction &&
        !r.action?.toLowerCase().includes(filterAction.toLowerCase())
      )
        return false;
      if (
        filterModule &&
        !r.entity?.toLowerCase().includes(filterModule.toLowerCase())
      )
        return false;
      return true;
    });
  }, [records, filterUser, filterAction, filterModule]);

  const totalPages = Math.ceil(filtered.length / perPage) || 1;
  const pageItems = useMemo(
    () => filtered.slice((currentPage - 1) * perPage, currentPage * perPage),
    [filtered, currentPage],
  );

  const statsDelete = useMemo(
    () =>
      records.filter((r) => r.action?.toUpperCase().includes("DELETE")).length,
    [records],
  );
  const uniqueUsers = useMemo(
    () => new Set(records.map((r) => r.user_name)).size,
    [records],
  );

  useEffect(() => {
    if (!detailRecord) return undefined;
    function handleKeydown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setDetailRecord(null);
      }
    }
    window.addEventListener("keydown", handleKeydown);
    return () => window.removeEventListener("keydown", handleKeydown);
  }, [detailRecord]);

  if (loading) {
    return (
      <FullPageLoading
        message="Carregando logs de auditoria"
        description="Aguarde enquanto carregamos os registros de auditoria."
      />
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8 py-4 sm:py-6 space-y-6">
        {/* hero */}
        <section>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl">
                  Log de Auditoria
                </h2>
                <p className="mt-2 text-sm text-white/85 md:text-base">
                  Rastreabilidade e histórico das ações do sistema.
                </p>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-2 rounded-xl bg-white/15 px-5 py-2.5 text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/25"
              >
                <AppIcon icon={Download} size="sm" decorative />
                Exportar
              </button>
            </div>
          </div>
        </section>

        {/* Summary Widgets (StatCard) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Total de Eventos"
            value={records.length}
            icon={Shield}
          />
          <StatCard
            title="Deleções"
            value={statsDelete}
            icon={AlertTriangle}
            iconBg="bg-red-500/10"
            iconColor="text-red-600"
          />
          <StatCard
            title="Usuários Distintos"
            value={uniqueUsers}
            icon={Timer}
            iconBg="bg-emerald-500/10"
            iconColor="text-emerald-600"
          />
        </div>

        {/* Filters */}
        <section className="bg-bg-card rounded-2xl border border-border-default p-4 sm:p-5">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Usuário / SARAM
              </label>
              <div className="relative">
                <Search
                  size={15}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                />
                <input
                  className="w-full pl-9 pr-4 py-2.5 bg-bg-default border border-border-default rounded-lg text-sm focus:ring-2 focus:ring-primary/40 font-mono"
                  placeholder="Ex: 7234567 ou Nome"
                  value={filterUser}
                  onChange={(e) => {
                    setFilterUser(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Tipo de Ação
              </label>
              <select
                className="w-full px-4 py-2.5 bg-bg-default border border-border-default rounded-lg text-sm focus:ring-2 focus:ring-primary/40"
                value={filterAction}
                onChange={(e) => {
                  setFilterAction(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos os Tipos</option>
                {Array.from(new Set(records.map((r) => r.action)))
                  .filter(Boolean)
                  .map((a) => (
                    <option key={a} value={a!}>
                      {a}
                    </option>
                  ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-text-muted uppercase tracking-wider">
                Módulo / Entidade
              </label>
              <select
                className="w-full px-4 py-2.5 bg-bg-default border border-border-default rounded-lg text-sm focus:ring-2 focus:ring-primary/40"
                value={filterModule}
                onChange={(e) => {
                  setFilterModule(e.target.value);
                  setCurrentPage(1);
                }}
              >
                <option value="">Todos os Módulos</option>
                {Array.from(new Set(records.map((r) => r.entity)))
                  .filter(Boolean)
                  .map((m) => (
                    <option key={m} value={m!}>
                      {m}
                    </option>
                  ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                type="button"
                className="w-full bg-primary text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 transition-colors flex justify-center items-center gap-2 text-sm"
                onClick={() => setCurrentPage(1)}
              >
                <Filter size={15} />
                Filtrar
              </button>
            </div>
          </div>
        </section>

        {/* Table */}
        <section className="bg-bg-card rounded-2xl border border-border-default overflow-hidden">
          {pageItems.length === 0 ? (
            <div className="px-5 py-14 text-center text-text-muted text-sm">
              Nenhum registro encontrado para os filtros aplicados.
            </div>
          ) : isCompactViewport ? (
            <div className="divide-y divide-border-default dark:divide-slate-800">
              {pageItems.map((r) => (
                <article
                  key={r.id}
                  className={`p-4 flex flex-col gap-3 border-l-4 ${rowAccent(r.action)}`}
                >
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <p className="text-sm font-bold text-text-body dark:text-text-inverted">
                        {new Date(r.created_at ?? "").toLocaleDateString(
                          "pt-BR",
                        )}
                      </p>
                      <p className="text-xs font-mono text-text-muted">
                        {new Date(r.created_at ?? "").toLocaleTimeString(
                          "pt-BR",
                        )}
                      </p>
                    </div>
                    <ActionBadge action={r.action} />
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-9 w-9 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center">
                      {(r.user_name ?? "")
                        .split(" ")[0]
                        ?.slice(0, 2)
                        .toUpperCase() || "—"}
                    </div>
                    <div className="flex flex-col">
                      <span className="text-sm font-semibold text-text-body dark:text-text-inverted">
                        {r.user_name ?? "—"}
                      </span>
                      <span className="text-xs text-text-muted">
                        {r.entity ?? "—"}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    <div className="text-xs font-mono text-text-muted">
                      <span className="font-semibold text-text-muted uppercase tracking-widest block text-[10px]">
                        IP
                      </span>
                      {extractIp(r.details)}
                    </div>
                    {r.details && (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-blue-700 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                        onClick={() => setDetailRecord(r)}
                      >
                        <Code2 size={13} />
                        JSON
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[900px] text-left border-collapse">
                <thead>
                  <tr className="bg-bg-default border-b border-border-default">
                    <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider w-36">
                      Data / Hora
                    </th>
                    <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                      Usuário
                    </th>
                    <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                      Ação
                    </th>
                    <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                      Módulo
                    </th>
                    <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                      IP de Origem
                    </th>
                    <th className="px-5 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                      Detalhes
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default dark:divide-slate-800">
                  {pageItems.map((r) => (
                    <tr
                      key={r.id}
                      className={`border-l-4 ${rowAccent(r.action)} hover:bg-bg-default/60 dark:hover:bg-bg-default/70 transition-colors`}
                    >
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="text-sm font-semibold text-text-body dark:text-text-inverted block">
                          {new Date(r.created_at ?? "").toLocaleDateString(
                            "pt-BR",
                          )}
                        </span>
                        <span className="text-xs text-text-muted font-mono">
                          {new Date(r.created_at ?? "").toLocaleTimeString(
                            "pt-BR",
                          )}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                            {(r.user_name ?? "")
                              .split(" ")[0]
                              ?.slice(0, 2)
                              .toUpperCase() || "—"}
                          </div>
                          <span className="text-sm font-semibold text-text-body dark:text-text-inverted">
                            {r.user_name ?? "—"}
                          </span>
                        </div>
                      </td>

                      <td className="px-5 py-4">
                        <ActionBadge action={r.action} />
                      </td>

                      <td className="px-5 py-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-bg-default text-text-body dark:bg-bg-default dark:text-text-muted">
                          {r.entity ?? "—"}
                        </span>
                      </td>

                      <td className="px-5 py-4">
                        <span className="text-xs font-mono text-text-muted">
                          {extractIp(r.details)}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        {r.details && (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:text-blue-700 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 rounded-md transition-colors"
                            onClick={() => setDetailRecord(r)}
                          >
                            <Code2 size={13} />
                            JSON
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Pagination footer */}
          <div className="bg-bg-default px-5 py-3.5 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-border-default">
            <span className="text-sm text-text-muted">
              {filtered.length > 0 ? (
                <>
                  Exibindo{" "}
                  <strong className="text-text-body dark:text-text-inverted">
                    {(currentPage - 1) * perPage + 1}–
                    {Math.min(currentPage * perPage, filtered.length)}
                  </strong>{" "}
                  de{" "}
                  <strong className="text-text-body dark:text-text-inverted">
                    {filtered.length}
                  </strong>{" "}
                  registros
                </>
              ) : (
                "Sem registros"
              )}
            </span>

            <div className="flex items-center gap-1 overflow-x-auto sm:overflow-visible w-full sm:w-auto justify-center">
              <button
                className="p-1.5 rounded-lg hover:bg-bg-default dark:hover:bg-bg-default/80 text-text-muted disabled:opacity-30"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(1)}
                aria-label="Primeira página"
              >
                <ChevronsLeft size={16} />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-bg-default dark:hover:bg-bg-default/80 text-text-muted disabled:opacity-30"
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
                const start = Math.max(
                  1,
                  Math.min(currentPage - 2, totalPages - 4),
                );
                const page = start + i;
                return (
                  <button
                    key={page}
                    type="button"
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-colors ${
                      page === currentPage
                        ? "bg-primary text-white"
                        : "hover:bg-bg-default dark:hover:bg-bg-default/80 text-text-muted dark:text-text-muted"
                    }`}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </button>
                );
              })}

              <button
                className="p-1.5 rounded-lg hover:bg-bg-default dark:hover:bg-bg-default/80 text-text-muted disabled:opacity-30"
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
              <button
                className="p-1.5 rounded-lg hover:bg-bg-default dark:hover:bg-bg-default/80 text-text-muted disabled:opacity-30"
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(totalPages)}
                aria-label="Última página"
              >
                <ChevronsRight size={16} />
              </button>
            </div>
          </div>
        </section>

        {/* JSON Detail Modal */}
        {detailRecord !== null && (
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
            role="dialog"
            aria-modal="true"
            onClick={() => setDetailRecord(null)}
          >
            <div
              className="bg-bg-card w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-4 bg-bg-default border-b border-border-default flex justify-between items-center">
                <div>
                  <h4 className="font-bold text-text-body dark:text-text-inverted flex items-center gap-2 text-sm">
                    <Code2 size={16} className="text-primary" />
                    Detalhes da Alteração
                  </h4>
                  <p className="text-xs text-text-muted mt-0.5 font-mono">
                    {detailRecord.action} · {detailRecord.entity} ·{" "}
                    {detailRecord.user_name}
                  </p>
                </div>
                <button
                  type="button"
                  className="p-1.5 rounded-lg text-text-muted hover:text-text-muted hover:bg-bg-default dark:hover:bg-bg-default/80 transition-colors"
                  onClick={() => setDetailRecord(null)}
                  aria-label="Fechar"
                >
                  <X size={18} />
                </button>
              </div>
              <pre className="p-6 overflow-auto max-h-[70vh] text-xs font-mono text-text-body dark:text-text-inverted bg-bg-default dark:bg-bg-default/80">
                {formatJson(detailRecord.details ?? "")}
              </pre>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
