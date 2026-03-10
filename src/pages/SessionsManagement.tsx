import Layout from "@/components/layout/Layout";
import { useResponsive } from "@/hooks/useResponsive";
import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardPen,
  Edit2,
  Filter,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  Settings,
} from "@/icons";
import { formatSessionPeriod } from "@/utils/booking";
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

type ViewMode = "table" | "cards";
type StatusFilter = "all" | "open" | "closed" | "concluded";

// Datas fixas para cobrir histórico e futuro no painel admin
const ADMIN_START = new Date();
ADMIN_START.setFullYear(ADMIN_START.getFullYear() - 2);
const ADMIN_END = new Date();
ADMIN_END.setFullYear(ADMIN_END.getFullYear() + 1);
const ADMIN_START_STR = ADMIN_START.toISOString().split("T")[0];
const ADMIN_END_STR = ADMIN_END.toISOString().split("T")[0];

export const SessionsManagement = () => {
  const navigate = useNavigate();
  const { isMobile, isTablet } = useResponsive();
  const { sessions, loading, error, refresh } = useSessions(
    ADMIN_START_STR,
    ADMIN_END_STR,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const isCompactViewport = isMobile || isTablet;
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    typeof window !== "undefined" && window.innerWidth < 1024
      ? "cards"
      : "table",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const pageSize = 10;
  const activeViewMode: ViewMode = isCompactViewport ? "cards" : viewMode;

  // timestamp do início do dia atual — primitivo estável como dep
  const todayTs = useMemo(() => startOfDay(new Date()).getTime(), []);

  const getSessionStatus = useCallback(
    (session: SessionAvailability): "open" | "closed" | "concluded" => {
      const sessionDate = startOfDay(parseISO(session.date)).getTime();
      if (sessionDate <= todayTs) return "concluded";
      return (session.available_count ?? 0) > 0 ? "open" : "closed";
    },
    [todayTs],
  );

  const filteredSessions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return sessions.filter((session) => {
      const dateLabel = format(
        parseISO(session.date),
        "dd MMM yyyy",
      ).toLowerCase();
      const matchSearch =
        !term ||
        session.session_id.toLowerCase().includes(term) ||
        session.period.toLowerCase().includes(term) ||
        formatSessionPeriod(session.period).toLowerCase().includes(term) ||
        dateLabel.includes(term);
      const status = getSessionStatus(session);
      const matchStatus = statusFilter === "all" || status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [sessions, searchTerm, statusFilter, getSessionStatus]);

  const pageCount = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, page, pageSize]);

  const openCount = sessions.filter(
    (s) => getSessionStatus(s) === "open",
  ).length;
  const closedCount = sessions.filter(
    (s) => getSessionStatus(s) === "closed",
  ).length;
  const concludedCount = sessions.filter(
    (s) => getSessionStatus(s) === "concluded",
  ).length;

  const renderOccupancyBar = (session: SessionAvailability) => {
    const occupied = session.occupied_count;
    const max = session.max_capacity;
    const percent = max ? Math.round((occupied / max) * 100) : 0;
    const barColor =
      percent >= 95
        ? "accent-text-muted"
        : percent >= 50
          ? "accent-amber-400"
          : "accent-primary";
    const textColor =
      percent >= 95
        ? "text-text-muted"
        : percent >= 50
          ? "text-amber-500"
          : "text-primary";
    return (
      <div className="w-40 sm:w-48">
        <div
          className={`flex justify-between text-[10px] mb-1 font-bold ${textColor}`}
        >
          <span>
            {occupied}/{max}
          </span>
          <span>{percent}%</span>
        </div>
        <progress
          value={occupied}
          max={max || 1}
          aria-label="Ocupação"
          className={`h-2 w-full rounded-full overflow-hidden ${barColor}`}
        />
      </div>
    );
  };

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 space-y-6">
        {/* header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl md:text-2xl lg:text-3xl font-bold text-primary dark:text-white">
              Gerenciar Turmas
            </h2>
            <p className="text-text-muted mt-1 text-sm">
              Controle operacional das sessões de avaliação física.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate("/app/turmas/nova")}
            className="flex items-center gap-2 bg-primary hover:bg-primary/80 text-text-inverted px-5 py-2.5 rounded-xl shadow font-bold text-sm transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
          >
            <Plus size={16} />
            Nova Turma
          </button>
        </header>

        {/* summary stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-bg-card dark:bg-bg-card rounded-2xl p-3 sm:p-4 md:p-5 border border-border-default flex items-center justify-between min-w-0">
            <div>
              <p className="text-[10px] md:text-xs text-text-muted font-medium uppercase tracking-wider md:tracking-widest">
                Total
              </p>
              <p className="text-lg md:text-2xl font-bold text-text-body dark:text-text-inverted mt-0.5">
                {loading ? "—" : sessions.length}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
              <Calendar size={16} className="md:hidden" />
              <Calendar size={20} className="hidden md:block" />
            </div>
          </div>
          <div className="bg-bg-card dark:bg-bg-card rounded-2xl p-3 sm:p-4 md:p-5 border border-border-default flex items-center justify-between min-w-0">
            <div>
              <p className="text-[10px] md:text-xs text-text-muted font-medium uppercase tracking-wider md:tracking-widest">
                Abertas
              </p>
              <p className="text-lg md:text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {loading ? "—" : openCount}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Calendar size={16} className="md:hidden" />
              <Calendar size={20} className="hidden md:block" />
            </div>
          </div>
          <div className="bg-bg-card dark:bg-bg-card rounded-2xl p-3 sm:p-4 md:p-5 border border-border-default flex items-center justify-between min-w-0">
            <div>
              <p className="text-[10px] md:text-xs text-text-muted font-medium uppercase tracking-wider md:tracking-widest">
                Fechadas
              </p>
              <p className="text-lg md:text-2xl font-bold text-text-body dark:text-text-inverted mt-0.5">
                {loading ? "—" : closedCount}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-bg-card dark:bg-bg-card rounded-xl flex items-center justify-center text-text-muted">
              <Calendar size={16} className="md:hidden" />
              <Calendar size={20} className="hidden md:block" />
            </div>
          </div>
          <div className="bg-bg-card dark:bg-bg-card rounded-2xl p-3 sm:p-4 md:p-5 border border-border-default flex items-center justify-between min-w-0">
            <div>
              <p className="text-[10px] md:text-xs text-text-muted font-medium uppercase tracking-wider md:tracking-widest">
                Concluídas
              </p>
              <p className="text-lg md:text-2xl font-bold text-violet-600 dark:text-violet-400 mt-0.5">
                {loading ? "—" : concludedCount}
              </p>
            </div>
            <div className="w-8 h-8 md:w-10 md:h-10 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center text-violet-600 dark:text-violet-400">
              <Calendar size={16} className="md:hidden" />
              <Calendar size={20} className="hidden md:block" />
            </div>
          </div>
        </div>

        {/* toolbar */}
        <div className="bg-bg-card dark:bg-bg-card rounded-2xl shadow-sm border border-border-default overflow-hidden">
          <div className="p-3 md:p-5 border-b border-border-default flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
            {/* search */}
            <div className="relative w-full sm:flex-1 sm:min-w-0">
              <input
                className="pl-10 pr-4 py-2 bg-bg-default dark:bg-bg-card border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full"
                placeholder="Buscar turma, data ou turno..."
                type="text"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPage(1);
                }}
              />
              <Search
                size={16}
                className="absolute left-3 top-2.5 text-text-muted"
              />
            </div>

            <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
              {/* status filter */}
              <div className="flex items-center gap-1 bg-bg-default dark:bg-bg-card rounded-xl p-1 overflow-x-auto no-scrollbar">
                {(["all", "open", "closed", "concluded"] as const).map((f) => (
                  <button
                    key={f}
                    type="button"
                    onClick={() => {
                      setStatusFilter(f);
                      setPage(1);
                    }}
                    className={`px-2 md:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                      statusFilter === f
                        ? "bg-primary/10 dark:bg-primary/20 text-primary dark:text-primary shadow-sm"
                        : "text-text-muted hover:text-text-body dark:hover:text-text-body"
                    }`}
                  >
                    {f === "all"
                      ? "Todas"
                      : f === "open"
                        ? "Abertas"
                        : f === "closed"
                          ? "Fechadas"
                          : "Concluídas"}
                  </button>
                ))}
              </div>

              {/* view toggle */}
              {!isCompactViewport && (
                <div className="flex items-center gap-1 bg-bg-default dark:bg-bg-card rounded-xl p-1">
                  <button
                    type="button"
                    onClick={() => setViewMode("table")}
                    aria-label="Modo tabela"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === "table"
                        ? "bg-bg-card dark:bg-bg-card text-primary shadow-sm"
                        : "text-text-muted hover:text-text-body"
                    }`}
                  >
                    <LayoutList size={16} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setViewMode("cards")}
                    aria-label="Modo cards"
                    className={`p-1.5 rounded-lg transition-colors ${
                      viewMode === "cards"
                        ? "bg-bg-card dark:bg-bg-card text-primary shadow-sm"
                        : "text-text-muted hover:text-text-body"
                    }`}
                  >
                    <LayoutGrid size={16} />
                  </button>
                </div>
              )}

              <button
                type="button"
                className="p-2 bg-bg-default dark:bg-bg-card rounded-xl text-text-muted hover:bg-bg-card/20 transition-colors"
                title="Filtros avançados"
                aria-label="Filtros avançados"
              >
                <Filter size={16} />
              </button>
            </div>
          </div>
        </div>
        {/* content */}
        {loading ? (
          <div className="p-16 text-center text-sm text-text-muted">
            Carregando turmas...
          </div>
        ) : error ? (
          <div className="p-5 md:p-10 text-center text-sm text-amber-600">
            {error}
            <button
              type="button"
              className="ml-3 text-primary font-semibold hover:underline"
              onClick={refresh}
            >
              Tentar novamente
            </button>
          </div>
        ) : paginatedSessions.length === 0 ? (
          <div className="p-16 text-center">
            <Calendar size={36} className="mx-auto text-text-muted mb-3" />
            <p className="text-sm text-text-muted">Nenhuma turma encontrada.</p>
          </div>
        ) : activeViewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="bg-bg-default dark:bg-bg-card/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Turma
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Turno
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Ocupação
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-default dark:divide-border-default">
                {paginatedSessions.map((s) => {
                  const status = getSessionStatus(s);
                  const isOpen = status === "open";
                  const isConcluded = status === "concluded";
                  return (
                    <tr
                      key={s.session_id}
                      className="hover:bg-bg-card/20 dark:hover:bg-bg-card/30 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="font-bold text-text-body dark:text-text-inverted font-mono text-sm">
                          {s.session_id.slice(0, 12).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-medium text-text-body dark:text-text-muted">
                          {format(parseISO(s.date), "EEEE", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-text-muted">
                          {format(parseISO(s.date), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-text-body dark:text-text-muted capitalize">
                          {formatSessionPeriod(s.period)}
                        </span>
                      </td>
                      <td className="px-6 py-5">{renderOccupancyBar(s)}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                            isOpen
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                              : isConcluded
                                ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800"
                                : "bg-bg-card text-text-muted border-border-default dark:bg-bg-card dark:text-text-muted dark:border-border-default"
                          }`}
                        >
                          {isOpen
                            ? "ABERTA"
                            : isConcluded
                              ? "CONCLUÍDA"
                              : "FECHADA"}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-right">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              navigate("/app/lancamento-indices", {
                                state: { sessionId: s.session_id },
                              })
                            }
                            className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Lançar índices"
                            aria-label="Lançar índices"
                          >
                            <ClipboardPen size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              navigate(`/app/turmas/${s.session_id}/editar`)
                            }
                            className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Editar turma"
                            aria-label="Editar turma"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/app/configuracoes")}
                            className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Configurar turma"
                            aria-label="Configurar turma"
                          >
                            <Settings size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          /* cards view */
          <div className="p-3 md:p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {paginatedSessions.map((s) => {
              const status = getSessionStatus(s);
              const isOpen = status === "open";
              const isConcluded = status === "concluded";
              const occupied = s.occupied_count;
              const max = s.max_capacity;
              const percent = max ? Math.round((occupied / max) * 100) : 0;
              return (
                <div
                  key={s.session_id}
                  className={`bg-bg-default dark:bg-bg-card rounded-xl p-5 border border-border-default dark:border-border-default border-l-4 ${
                    isOpen
                      ? "border-l-primary"
                      : isConcluded
                        ? "border-l-violet-500"
                        : "border-l-text-muted"
                  } flex flex-col gap-4`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-mono">
                        {s.session_id.slice(0, 12).toUpperCase()}
                      </p>
                      <p className="text-sm font-bold text-text-body dark:text-text-inverted mt-0.5">
                        {format(parseISO(s.date), "dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-xs text-text-muted capitalize">
                        {formatSessionPeriod(s.period)}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOpen
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                          : isConcluded
                            ? "bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-900/20 dark:text-violet-400 dark:border-violet-800"
                            : "bg-bg-card text-text-muted border-border-default dark:bg-bg-card dark:text-text-muted dark:border-border-default"
                      }`}
                    >
                      {isOpen
                        ? "ABERTA"
                        : isConcluded
                          ? "CONCLUÍDA"
                          : "FECHADA"}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-text-muted mb-1">
                      <span>Ocupação</span>
                      <span>
                        {occupied}/{max} ({percent}%)
                      </span>
                    </div>
                    <progress
                      value={occupied}
                      max={max || 1}
                      aria-label="Ocupação"
                      className={`h-1.5 w-full rounded-full overflow-hidden ${
                        percent >= 95
                          ? "accent-text-muted"
                          : percent >= 50
                            ? "accent-amber-400"
                            : "accent-primary"
                      }`}
                    />
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-border-default dark:border-border-default">
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/app/lancamento-indices", {
                          state: { sessionId: s.session_id },
                        })
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-text-body hover:text-primary bg-bg-card dark:bg-bg-card rounded-lg border border-border-default dark:border-border-default hover:border-primary/30 transition-colors"
                    >
                      <ClipboardPen size={13} /> Índices
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        navigate(`/app/turmas/${s.session_id}/editar`)
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-text-body hover:text-primary bg-bg-card dark:bg-bg-card rounded-lg border border-border-default dark:border-border-default hover:border-primary/30 transition-colors"
                    >
                      <Edit2 size={13} /> Editar
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* pagination */}
        {!loading && !error && filteredSessions.length > pageSize && (
          <div className="px-6 py-4 bg-bg-default dark:bg-bg-card/50 border-t border-border-default flex justify-between items-center text-sm">
            <p className="text-text-muted text-xs">
              {paginatedSessions.length} de {filteredSessions.length} turmas
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  page <= 1
                    ? "bg-bg-default text-text-muted opacity-60 border-border-default"
                    : "bg-bg-card text-text-body border-border-default hover:bg-bg-default"
                }`}
                aria-label="Página anterior"
              >
                <ChevronLeft size={16} />
              </button>
              {Array.from({ length: pageCount }, (_, i) => i + 1).map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setPage(v)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center border text-xs font-semibold ${
                    v === page
                      ? "bg-primary text-white border-primary"
                      : "bg-bg-card text-text-body border-border-default hover:bg-bg-default"
                  }`}
                >
                  {v}
                </button>
              ))}
              <button
                type="button"
                disabled={page >= pageCount}
                onClick={() => setPage((c) => Math.min(pageCount, c + 1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  page >= pageCount
                    ? "bg-bg-default text-text-muted opacity-60 border-border-default"
                    : "bg-bg-card text-text-body border-border-default hover:bg-bg-default"
                }`}
                aria-label="Próxima página"
              >
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
};

export default SessionsManagement;
