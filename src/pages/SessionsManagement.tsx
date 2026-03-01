import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
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
} from "lucide-react";
import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";

type ViewMode = "table" | "cards";

export const SessionsManagement = () => {
  const navigate = useNavigate();
  const { sessions, loading, error, refresh } = useSessions();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [viewMode, setViewMode] = useState<ViewMode>("table");
  const [statusFilter, setStatusFilter] = useState<"all" | "open" | "closed">(
    "all",
  );
  const pageSize = 10;

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
        dateLabel.includes(term);
      const isOpen = (session.available_count ?? 0) > 0;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "open" && isOpen) ||
        (statusFilter === "closed" && !isOpen);
      return matchSearch && matchStatus;
    });
  }, [sessions, searchTerm, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filteredSessions.length / pageSize));
  const paginatedSessions = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredSessions.slice(start, start + pageSize);
  }, [filteredSessions, page, pageSize]);

  const openCount = sessions.filter((s) => (s.available_count ?? 0) > 0).length;
  const closedCount = sessions.length - openCount;

  const renderOccupancyBar = (session: SessionAvailability) => {
    const occupied = session.occupied_count;
    const max = session.max_capacity;
    const percent = max ? Math.round((occupied / max) * 100) : 0;
    const barColor =
      percent >= 95
        ? "accent-slate-400 dark:accent-slate-500"
        : percent >= 50
          ? "accent-amber-400"
          : "accent-primary";
    const textColor =
      percent >= 95
        ? "text-slate-400"
        : percent >= 50
          ? "text-amber-500"
          : "text-primary";
    return (
      <div className="w-48">
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
      {/* header */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-primary dark:text-white">
            Gerenciar Turmas
          </h2>
          <p className="text-slate-500 mt-1 text-sm">
            Controle operacional das sessões de avaliação física.
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate("/app/turmas/nova")}
          className="flex items-center gap-2 bg-primary hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl shadow font-bold text-sm transition-all hover:scale-105 active:scale-95 self-start sm:self-auto"
        >
          <Plus size={16} />
          Nova Turma
        </button>
      </header>

      {/* summary stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              Total
            </p>
            <p className="text-2xl font-bold text-slate-800 dark:text-white mt-0.5">
              {loading ? "—" : sessions.length}
            </p>
          </div>
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center text-primary">
            <Calendar size={20} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              Abertas
            </p>
            <p className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
              {loading ? "—" : openCount}
            </p>
          </div>
          <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Calendar size={20} />
          </div>
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              Fechadas
            </p>
            <p className="text-2xl font-bold text-slate-500 dark:text-slate-400 mt-0.5">
              {loading ? "—" : closedCount}
            </p>
          </div>
          <div className="w-10 h-10 bg-slate-100 dark:bg-slate-700 rounded-xl flex items-center justify-center text-slate-500">
            <Calendar size={20} />
          </div>
        </div>
      </div>

      {/* toolbar */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 overflow-hidden">
        <div className="p-5 border-b border-slate-100 dark:border-slate-700 flex flex-wrap gap-3 items-center justify-between">
          {/* search */}
          <div className="relative flex-1 min-w-52">
            <input
              className="pl-10 pr-4 py-2 bg-background-light dark:bg-slate-900 border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full"
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
              className="absolute left-3 top-2.5 text-slate-400"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* status filter */}
            <div className="flex items-center gap-1 bg-background-light dark:bg-slate-900 rounded-xl p-1">
              {(["all", "open", "closed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setStatusFilter(f);
                    setPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                    statusFilter === f
                      ? "bg-white dark:bg-slate-700 text-primary dark:text-white shadow-sm"
                      : "text-slate-500 hover:text-slate-700 dark:hover:text-slate-300"
                  }`}
                >
                  {f === "all"
                    ? "Todas"
                    : f === "open"
                      ? "Abertas"
                      : "Fechadas"}
                </button>
              ))}
            </div>

            {/* view toggle */}
            <div className="flex items-center gap-1 bg-background-light dark:bg-slate-900 rounded-xl p-1">
              <button
                type="button"
                onClick={() => setViewMode("table")}
                aria-label="Modo tabela"
                className={`p-1.5 rounded-lg transition-colors ${
                  viewMode === "table"
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
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
                    ? "bg-white dark:bg-slate-700 text-primary shadow-sm"
                    : "text-slate-400 hover:text-slate-700"
                }`}
              >
                <LayoutGrid size={16} />
              </button>
            </div>

            <button
              type="button"
              className="p-2 bg-background-light dark:bg-slate-900 rounded-xl text-slate-500 hover:bg-slate-200 transition-colors"
              title="Filtros avançados"
              aria-label="Filtros avançados"
            >
              <Filter size={16} />
            </button>
          </div>
        </div>

        {/* content */}
        {loading ? (
          <div className="p-16 text-center text-sm text-slate-400">
            Carregando turmas...
          </div>
        ) : error ? (
          <div className="p-10 text-center text-sm text-amber-600">
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
            <Calendar size={36} className="mx-auto text-slate-300 mb-3" />
            <p className="text-sm text-slate-400">Nenhuma turma encontrada.</p>
          </div>
        ) : viewMode === "table" ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-900/50">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Turma
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Data
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Turno
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Ocupação
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-400 uppercase tracking-wider text-right">
                    Ações
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {paginatedSessions.map((s) => {
                  const isOpen = (s.available_count ?? 0) > 0;
                  return (
                    <tr
                      key={s.session_id}
                      className="hover:bg-slate-50/50 dark:hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="px-6 py-5">
                        <div className="font-bold text-slate-700 dark:text-slate-200 font-mono text-sm">
                          {s.session_id.slice(0, 12).toUpperCase()}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="text-sm font-medium text-slate-700 dark:text-slate-300">
                          {format(parseISO(s.date), "EEEE", { locale: ptBR })}
                        </div>
                        <div className="text-xs text-slate-400">
                          {format(parseISO(s.date), "dd 'de' MMMM 'de' yyyy", {
                            locale: ptBR,
                          })}
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <span className="text-sm font-medium text-slate-600 dark:text-slate-400 capitalize">
                          {s.period}
                        </span>
                      </td>
                      <td className="px-6 py-5">{renderOccupancyBar(s)}</td>
                      <td className="px-6 py-5">
                        <span
                          className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                            isOpen
                              ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                              : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                          }`}
                        >
                          {isOpen ? "ABERTA" : "FECHADA"}
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
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Lançar índices"
                            aria-label="Lançar índices"
                          >
                            <ClipboardPen size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/app/agendamentos")}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                            title="Editar agendamentos"
                            aria-label="Editar agendamentos"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            onClick={() => navigate("/app/configuracoes")}
                            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
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
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {paginatedSessions.map((s) => {
              const isOpen = (s.available_count ?? 0) > 0;
              const occupied = s.occupied_count;
              const max = s.max_capacity;
              const percent = max ? Math.round((occupied / max) * 100) : 0;
              return (
                <div
                  key={s.session_id}
                  className={`bg-background-light dark:bg-slate-900 rounded-xl p-5 border border-slate-200 dark:border-slate-700 border-l-4 ${
                    isOpen ? "border-l-primary" : "border-l-slate-400"
                  } flex flex-col gap-4`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider font-mono">
                        {s.session_id.slice(0, 12).toUpperCase()}
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                        {format(parseISO(s.date), "dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </p>
                      <p className="text-xs text-slate-400 capitalize">
                        {s.period}
                      </p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        isOpen
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800"
                          : "bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-900 dark:text-slate-400 dark:border-slate-700"
                      }`}
                    >
                      {isOpen ? "ABERTA" : "FECHADA"}
                    </span>
                  </div>

                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
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
                          ? "accent-slate-400"
                          : percent >= 50
                            ? "accent-amber-400"
                            : "accent-primary"
                      }`}
                    />
                  </div>

                  <div className="flex gap-2 pt-1 border-t border-slate-200 dark:border-slate-700">
                    <button
                      type="button"
                      onClick={() =>
                        navigate("/app/lancamento-indices", {
                          state: { sessionId: s.session_id },
                        })
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-primary bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-colors"
                    >
                      <ClipboardPen size={13} /> Índices
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate("/app/agendamentos")}
                      className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-slate-500 hover:text-primary bg-white dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700 hover:border-primary/30 transition-colors"
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
          <div className="px-6 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-700 flex justify-between items-center text-sm">
            <p className="text-slate-500 text-xs">
              {paginatedSessions.length} de {filteredSessions.length} turmas
            </p>
            <div className="flex gap-1">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((c) => Math.max(1, c - 1))}
                className={`w-8 h-8 rounded-lg flex items-center justify-center border ${
                  page <= 1
                    ? "bg-slate-100 text-slate-300 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700"
                    : "bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
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
                      : "bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
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
                    ? "bg-slate-100 text-slate-300 border-slate-200 dark:bg-slate-800/60 dark:border-slate-700"
                    : "bg-white dark:bg-slate-800 text-slate-600 border-slate-200 dark:border-slate-700 hover:bg-slate-50"
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
