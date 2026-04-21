/**
 * @page SessionsManagement
 * @description Administração geral das sessões.
 * @path src/pages/SessionsManagement.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import StatCard from "@/components/atomic/StatCard";
import ReschedulingPanel from "@/components/Booking/ReschedulingPanel";
import SessionFormDialog from "@/components/Booking/SessionFormDialog";
import SessionHubDialog from "@/components/Booking/SessionHubDialog";
import Dialog from "@/components/Dialog";
import Layout from "@/components/layout/Layout";
import { useResponsive } from "@/hooks/useResponsive";
import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Edit2,
  FileDown,
  Filter,
  GitMerge,
  LayoutGrid,
  LayoutList,
  Plus,
  Search,
  XCircle,
} from "@/icons";
import { updateSession } from "@/services/sessions";
import type { SessionStatus } from "@/types/database.types";
import { formatSessionPeriod } from "@/utils/booking";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type HubTab = "sessoes" | "reagendamentos";
type ViewMode = "table" | "cards";
type StatusFilter = "all" | SessionStatus;
type SessionFormState = {
  mode: "create" | "edit" | "duplicate";
  sessionId: string | null;
  reopenHubOnSave: boolean;
};

// Datas fixas para cobrir histórico e futuro no painel admin
const ADMIN_START = new Date();
ADMIN_START.setFullYear(ADMIN_START.getFullYear() - 2);
const ADMIN_END = new Date();
ADMIN_END.setFullYear(ADMIN_END.getFullYear() + 1);
const ADMIN_START_STR = ADMIN_START.toISOString().split("T")[0];
const ADMIN_END_STR = ADMIN_END.toISOString().split("T")[0];

export const SessionsManagement = () => {
  const { isMobile, isTablet } = useResponsive();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sessions, loading, error, refresh } = useSessions(
    ADMIN_START_STR,
    ADMIN_END_STR,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const isCompactViewport = isMobile || isTablet;
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    isCompactViewport ? "cards" : "table",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const selectedSessionId = searchParams.get("sessionId");
  const editRequested = searchParams.get("edit") === "1";
  const [standaloneFormState, setStandaloneFormState] =
    useState<SessionFormState | null>(null);
  const [cancelTarget, setCancelTarget] = useState<SessionAvailability | null>(
    null,
  );
  const [cancellingSessionId, setCancellingSessionId] = useState<string | null>(
    null,
  );
  const pageSize = 10;
  const activeViewMode: ViewMode = isCompactViewport ? "cards" : viewMode;
  const activeTab: HubTab =
    searchParams.get("tab") === "reagendamentos" ? "reagendamentos" : "sessoes";

  const setActiveTab = useCallback(
    (tab: HubTab) => {
      const nextParams = new URLSearchParams(searchParams);
      if (tab === "reagendamentos") {
        nextParams.set("tab", "reagendamentos");
      } else {
        nextParams.delete("tab");
      }
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const openCreateDialog = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("sessionId");
    nextParams.delete("edit");
    setSearchParams(nextParams, { replace: true });
    setStandaloneFormState({
      mode: "create",
      sessionId: null,
      reopenHubOnSave: false,
    });
  }, [searchParams, setSearchParams]);

  const openEditDialog = useCallback(
    (sessionId: string, reopenHubOnSave = false) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("sessionId", sessionId);
      nextParams.set("edit", "1");
      setSearchParams(nextParams, { replace: true });
      if (!reopenHubOnSave) {
        setStandaloneFormState(null);
      }
    },
    [searchParams, setSearchParams],
  );

  const openDuplicateDialog = useCallback(
    (sessionId: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("sessionId");
      nextParams.delete("edit");
      setSearchParams(nextParams, { replace: true });
      setStandaloneFormState({
        mode: "duplicate",
        sessionId,
        reopenHubOnSave: false,
      });
    },
    [searchParams, setSearchParams],
  );

  const openHubDialog = useCallback(
    (sessionId: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("sessionId", sessionId);
      nextParams.delete("edit");
      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const closeSessionForm = useCallback(() => {
    if (editRequested && selectedSessionId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("edit");
      setSearchParams(nextParams, { replace: true });
      return;
    }

    setStandaloneFormState(null);
  }, [editRequested, searchParams, selectedSessionId, setSearchParams]);

  const handleSessionFormSaved = useCallback(async () => {
    const activeFormState =
      standaloneFormState ??
      (editRequested && selectedSessionId
        ? {
            mode: "edit" as const,
            sessionId: selectedSessionId,
            reopenHubOnSave: true,
          }
        : null);

    const reopenSessionId =
      activeFormState?.mode === "edit" && activeFormState.reopenHubOnSave
        ? activeFormState.sessionId
        : null;

    await refresh();

    if (reopenSessionId) {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.set("sessionId", reopenSessionId);
      nextParams.delete("edit");
      setSearchParams(nextParams, { replace: true });
    }
  }, [
    editRequested,
    refresh,
    searchParams,
    selectedSessionId,
    setSearchParams,
    standaloneFormState,
  ]);

  const closeHubDialog = useCallback(() => {
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete("sessionId");
    nextParams.delete("edit");
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  const sessionFormState =
    standaloneFormState ??
    (editRequested && selectedSessionId
      ? {
          mode: "edit" as const,
          sessionId: selectedSessionId,
          reopenHubOnSave: true,
        }
      : null);

  const getSessionStatus = useCallback(
    (session: SessionAvailability): SessionStatus => session.status,
    [],
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
        dateLabel.includes(term) ||
        (session.location_name ?? "").toLowerCase().includes(term);
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
    (s) => getSessionStatus(s) === "completed",
  ).length;

  const updateHubSessionQuery = useCallback(
    (sessionId: string | null, options?: { edit?: boolean }) => {
      const nextParams = new URLSearchParams(searchParams);
      if (sessionId) {
        nextParams.set("sessionId", sessionId);
      } else {
        nextParams.delete("sessionId");
      }

      if (options?.edit && sessionId) {
        nextParams.set("edit", "1");
      } else {
        nextParams.delete("edit");
      }

      setSearchParams(nextParams, { replace: true });
    },
    [searchParams, setSearchParams],
  );

  const handleRequestCancel = useCallback((session: SessionAvailability) => {
    setCancelTarget(session);
  }, []);

  const handleConfirmCancel = useCallback(async () => {
    if (!cancelTarget) {
      return;
    }

    setCancellingSessionId(cancelTarget.session_id);
    try {
      await updateSession(cancelTarget.session_id, { status: "closed" });
      toast.success("Sessão fechada com sucesso.");
      setCancelTarget(null);
      await refresh();

      if (selectedSessionId === cancelTarget.session_id) {
        updateHubSessionQuery(cancelTarget.session_id);
      }
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível fechar a sessão.");
    } finally {
      setCancellingSessionId(null);
    }
  }, [cancelTarget, refresh, selectedSessionId, updateHubSessionQuery]);

  const renderOccupancyBar = (session: SessionAvailability) => {
    const occupied = session.occupied_count;
    const max = session.max_capacity;
    const percent = max ? Math.round((occupied / max) * 100) : 0;
    const barColor =
      percent >= 95
        ? "accent-text-muted"
        : percent >= 50
          ? "accent-primary"
          : "accent-primary";
    const textColor =
      percent >= 95
        ? "text-error"
        : percent >= 50
          ? "text-primary"
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
      <div
        className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-4 space-y-6"
        data-testid="sessions-management-page"
      >
        {/* hero */}
        <section>
          <div className="relative overflow-hidden rounded-3xl bg-primary px-5 py-6 text-white shadow-2xl shadow-primary/20 md:px-8 md:py-8 lg:px-10 lg:py-10">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl"
                  data-testid="sessions-management-title"
                >
                  Hub de Sessões
                </h2>
                <p className="mt-2 text-sm text-white/85 md:text-base">
                  Centro operacional para criação, acompanhamento,
                  reagendamentos e execução das sessões de avaliação física.
                </p>
              </div>
              <div />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-border-default bg-bg-card p-2 shadow-sm">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab("sessoes")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "sessoes"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:bg-bg-default hover:text-text-body"
              }`}
            >
              <AppIcon icon={Calendar} size="sm" decorative />
              Sessões
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("reagendamentos")}
              className={`inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                activeTab === "reagendamentos"
                  ? "bg-primary text-white shadow-sm"
                  : "text-text-muted hover:bg-bg-default hover:text-text-body"
              }`}
            >
              <AppIcon icon={GitMerge} size="sm" decorative />
              Reagendamentos
            </button>
          </div>
        </section>

        {activeTab === "reagendamentos" ? (
          <ReschedulingPanel />
        ) : (
          <>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatCard title="Total" value={sessions.length} icon={Calendar} />
              <StatCard
                title="Abertas"
                value={openCount}
                icon={Calendar}
                className="border-b-4 border-primary/30"
                iconBg="bg-primary/10"
                iconColor="text-primary"
              />
              <StatCard
                title="Fechadas"
                value={closedCount}
                icon={Calendar}
                className="border-b-4 border-error/30"
                iconBg="bg-error/10"
                iconColor="text-error"
              />
              <StatCard
                title="Concluídas"
                value={concludedCount}
                icon={Calendar}
                className="border-b-4 border-success/30"
                iconBg="bg-success/10"
                iconColor="text-success"
              />
            </div>

            <div className="bg-bg-card rounded-2xl shadow-sm border border-border-default overflow-hidden">
              <div className="p-3 md:p-5 border-b border-border-default flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
                <div className="relative w-full sm:flex-1 sm:min-w-0">
                  <input
                    className="pl-10 pr-4 py-2 bg-bg-default border-none rounded-xl text-sm focus:ring-2 focus:ring-primary/20 w-full"
                    placeholder="Buscar sessão, data, turno ou local..."
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setPage(1);
                    }}
                  />
                  <AppIcon
                    icon={Search}
                    size="sm"
                    className="absolute left-3 top-2.5 text-text-muted"
                    decorative
                  />
                </div>

                <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto justify-between sm:justify-end">
                  <button
                    type="button"
                    onClick={openCreateDialog}
                    className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-primary/90"
                  >
                    <AppIcon icon={Plus} size="sm" decorative />
                    Nova sessão
                  </button>

                  <div className="flex items-center gap-1 bg-bg-default rounded-xl p-1 overflow-x-auto no-scrollbar">
                    {(["all", "open", "closed", "completed"] as const).map(
                      (f) => (
                        <button
                          key={f}
                          type="button"
                          onClick={() => {
                            setStatusFilter(f);
                            setPage(1);
                          }}
                          className={`px-2 md:px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors whitespace-nowrap ${
                            statusFilter === f
                              ? "bg-primary/10 text-primary shadow-sm"
                              : "text-text-muted hover:text-text-body"
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
                      ),
                    )}
                  </div>

                  {!isCompactViewport && (
                    <div className="flex items-center gap-1 bg-bg-default rounded-xl p-1">
                      <button
                        type="button"
                        onClick={() => setViewMode("table")}
                        aria-label="Modo tabela"
                        className={`p-1.5 rounded-lg transition-colors ${
                          viewMode === "table"
                            ? "bg-bg-card text-primary shadow-sm"
                            : "text-text-muted hover:text-text-body"
                        }`}
                      >
                        <AppIcon icon={LayoutList} size="sm" decorative />
                      </button>
                      <button
                        type="button"
                        onClick={() => setViewMode("cards")}
                        aria-label="Modo cards"
                        className={`p-1.5 rounded-lg transition-colors ${
                          viewMode === "cards"
                            ? "bg-bg-card text-primary shadow-sm"
                            : "text-text-muted hover:text-text-body"
                        }`}
                      >
                        <AppIcon icon={LayoutGrid} size="sm" decorative />
                      </button>
                    </div>
                  )}

                  <button
                    type="button"
                    className="p-2 bg-bg-default rounded-xl text-text-muted hover:bg-bg-card/20 transition-colors"
                    title="Filtros avançados"
                    aria-label="Filtros avançados"
                  >
                    <AppIcon icon={Filter} size="sm" decorative />
                  </button>
                </div>
              </div>
            </div>

            {error ? (
              <div className="p-5 md:p-10 text-center text-sm text-error">
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
                <AppIcon
                  icon={Calendar}
                  size="lg"
                  className="mx-auto text-text-muted mb-3"
                  decorative
                />
                <p className="text-sm text-text-muted">
                  Nenhuma turma encontrada.
                </p>
              </div>
            ) : activeViewMode === "table" ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[900px] text-left">
                  <thead className="bg-bg-default">
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
                        Local
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
                  <tbody className="divide-y divide-border-default">
                    {paginatedSessions.map((s) => {
                      const status = getSessionStatus(s);
                      const isOpen = status === "open";
                      const isCompleted = status === "completed";
                      const canEdit = isOpen;
                      const canCancel = isOpen;
                      return (
                        <tr
                          key={s.session_id}
                          className="hover:bg-bg-card/20 transition-colors"
                        >
                          <td className="px-6 py-5">
                            <div className="font-bold text-text-body font-mono text-sm">
                              {s.session_id.slice(0, 12).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <div className="text-sm font-semibold text-text-body capitalize">
                              {format(parseISO(s.date), "EEEE", {
                                locale: ptBR,
                              })}
                            </div>
                            <div className="mt-0.5 text-xs text-text-muted">
                              {format(
                                parseISO(s.date),
                                "dd 'de' MMMM 'de' yyyy",
                                {
                                  locale: ptBR,
                                },
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-5">
                            <span className="text-sm font-semibold text-text-body capitalize">
                              {formatSessionPeriod(s.period)}
                            </span>
                          </td>
                          <td className="px-6 py-5">
                            <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-semibold text-primary">
                              {s.location_name ?? "Sem local"}
                            </span>
                          </td>
                          <td className="px-6 py-5">{renderOccupancyBar(s)}</td>
                          <td className="px-6 py-5">
                            <span
                              className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                                isOpen
                                  ? "bg-primary/10 text-primary border-primary/30"
                                  : isCompleted
                                    ? "bg-success/10 text-success border-success/30"
                                    : "bg-error/10 text-error border-error/30"
                              }`}
                            >
                              {isOpen
                                ? "ABERTA"
                                : isCompleted
                                  ? "CONCLUÍDA"
                                  : "FECHADA"}
                            </span>
                          </td>
                          <td className="px-6 py-5 text-right">
                            <div className="flex justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => openHubDialog(s.session_id)}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20 transition-colors"
                                title={
                                  status === "open"
                                    ? "Gerir sessão"
                                    : "Visualizar sessão"
                                }
                                aria-label={
                                  status === "open"
                                    ? "Gerir sessão"
                                    : "Visualizar sessão"
                                }
                              >
                                <AppIcon
                                  icon={ClipboardList}
                                  size="sm"
                                  decorative
                                />
                                {status === "open" ? "Gerir" : "Visualizar"}
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditDialog(s.session_id)}
                                disabled={!canEdit}
                                className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:text-text-muted disabled:hover:bg-transparent"
                                title={
                                  canEdit
                                    ? "Editar sessão"
                                    : "Somente sessoes abertas podem ser editadas"
                                }
                                aria-label="Editar sessão"
                              >
                                <AppIcon icon={Edit2} size="sm" decorative />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  openDuplicateDialog(s.session_id)
                                }
                                className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors"
                                title="Duplicar sessão"
                                aria-label="Duplicar sessão"
                              >
                                <AppIcon icon={Copy} size="sm" decorative />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  status === "completed"
                                    ? openHubDialog(s.session_id)
                                    : handleRequestCancel(s)
                                }
                                disabled={!canCancel && !isCompleted}
                                className="p-2 text-text-muted hover:text-primary hover:bg-primary/5 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                                title={
                                  isCompleted
                                    ? "Imprimir relatório final"
                                    : canCancel
                                      ? "Cancelar sessão"
                                      : "Somente sessões abertas podem ser canceladas"
                                }
                                aria-label={
                                  isCompleted
                                    ? "Imprimir relatório final"
                                    : "Cancelar sessão"
                                }
                              >
                                <AppIcon
                                  icon={isCompleted ? FileDown : XCircle}
                                  size="sm"
                                  decorative
                                />
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
                  const isCompleted = status === "completed";
                  const canEdit = isOpen;
                  const canCancel = isOpen;
                  const occupied = s.occupied_count;
                  const max = s.max_capacity;
                  const percent = max ? Math.round((occupied / max) * 100) : 0;
                  return (
                    <div
                      key={s.session_id}
                      className={`bg-bg-default rounded-xl p-5 border border-border-default border-l-4 ${
                        isOpen
                          ? "border-l-primary"
                          : isCompleted
                            ? "border-l-success"
                            : "border-l-error"
                      } flex flex-col gap-4`}
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="text-[11px] font-bold text-text-muted uppercase tracking-wider font-mono">
                            {s.session_id.slice(0, 12).toUpperCase()}
                          </p>
                          <p className="text-sm font-semibold text-text-body mt-0.5">
                            {format(parseISO(s.date), "dd 'de' MMMM", {
                              locale: ptBR,
                            })}
                          </p>
                          <p className="text-[11px] text-text-muted capitalize">
                            {formatSessionPeriod(s.period)}
                          </p>
                          <p className="mt-1">
                            <span className="inline-flex rounded-full border border-primary/20 bg-primary/5 px-2.5 py-1 text-[10px] font-semibold text-primary">
                              {s.location_name ?? "Sem local"}
                            </span>
                          </p>
                        </div>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isOpen
                              ? "bg-primary/10 text-primary border-primary/30"
                              : isCompleted
                                ? "bg-success/10 text-success border-success/30"
                                : "bg-error/10 text-error border-error/30"
                          }`}
                        >
                          {isOpen
                            ? "ABERTA"
                            : isCompleted
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
                                ? "accent-primary"
                                : "accent-primary"
                          }`}
                        />
                      </div>

                      <div className="flex flex-col gap-2 pt-1 border-t border-border-default">
                        <button
                          type="button"
                          onClick={() => openHubDialog(s.session_id)}
                          className="flex items-center justify-center gap-1.5 py-2 text-xs font-bold text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-colors"
                        >
                          <AppIcon icon={ClipboardList} size="sm" decorative />
                          {status === "open"
                            ? "Gerir Sessão"
                            : "Visualizar Sessão"}
                        </button>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={() => openEditDialog(s.session_id)}
                            disabled={!canEdit}
                            title={
                              canEdit
                                ? "Editar sessão"
                                : "Somente sessoes abertas podem ser editadas"
                            }
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-text-body hover:text-primary bg-bg-card rounded-lg border border-border-default hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-text-body disabled:hover:border-border-default"
                          >
                            <AppIcon icon={Edit2} size="sm" decorative /> Editar
                          </button>
                          <button
                            type="button"
                            onClick={() => openDuplicateDialog(s.session_id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-text-body hover:text-primary bg-bg-card rounded-lg border border-border-default hover:border-primary/30 transition-colors"
                          >
                            <AppIcon icon={Copy} size="sm" decorative />{" "}
                            Duplicar
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              status === "completed"
                                ? openHubDialog(s.session_id)
                                : handleRequestCancel(s)
                            }
                            disabled={!canCancel && !isCompleted}
                            className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-semibold text-text-body hover:text-primary bg-bg-card rounded-lg border border-border-default hover:border-primary/30 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            <AppIcon
                              icon={isCompleted ? FileDown : XCircle}
                              size="sm"
                              decorative
                            />
                            {isCompleted ? "Relatório" : "Cancelar"}
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && !error && filteredSessions.length > pageSize && (
              <div className="px-6 py-4 bg-bg-default border-t border-border-default flex justify-between items-center text-sm">
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
                    <AppIcon icon={ChevronLeft} size="sm" decorative />
                  </button>
                  {Array.from({ length: pageCount }, (_, i) => i + 1).map(
                    (v) => (
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
                    ),
                  )}
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
                    <AppIcon icon={ChevronRight} size="sm" decorative />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
      <SessionHubDialog
        open={selectedSessionId !== null}
        sessionId={selectedSessionId}
        onClose={closeHubDialog}
        onSessionUpdated={refresh}
        onEditRequested={(sessionId) => openEditDialog(sessionId, true)}
      />
      <SessionFormDialog
        open={sessionFormState !== null}
        mode={sessionFormState?.mode ?? "create"}
        sessionId={sessionFormState?.sessionId ?? null}
        onClose={closeSessionForm}
        onSaved={handleSessionFormSaved}
      />
      <Dialog
        open={cancelTarget !== null}
        onClose={() => {
          if (!cancellingSessionId) {
            setCancelTarget(null);
          }
        }}
        title="Confirmar fechamento da sessão"
        description="A sessão ficará indisponível para operação direta no hub e passará para modo somente leitura."
        widthClassName="max-w-xl"
        footer={
          <div className="flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              disabled={cancellingSessionId !== null}
              className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmCancel()}
              disabled={cancellingSessionId !== null}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {cancellingSessionId ? "Fechando..." : "Fechar sessão"}
            </button>
          </div>
        }
      >
        {cancelTarget && (
          <div className="space-y-4 text-sm text-text-body">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
              <p className="font-semibold text-primary">
                {cancelTarget.location_name ?? "Sessão sem local"} •{" "}
                {format(parseISO(cancelTarget.date), "dd/MM/yyyy", {
                  locale: ptBR,
                })}{" "}
                • {formatSessionPeriod(cancelTarget.period)}
              </p>
            </div>
            <p>
              Esta turma possui <strong>{cancelTarget.occupied_count}</strong>{" "}
              militar(es) agendado(s). O fechamento impede a gestão operacional
              direta e pode exigir tratamento manual dos reagendamentos.
            </p>
          </div>
        )}
      </Dialog>
    </Layout>
  );
};

export default SessionsManagement;
