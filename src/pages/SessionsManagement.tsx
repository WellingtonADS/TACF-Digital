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
import useAuth from "@/hooks/useAuth";
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
  Loader2,
  Plus,
  Search,
  Trash2,
} from "@/icons";
import { updateSession } from "@/services/sessions";
import type { SessionStatus } from "@/types/database.types";
import { formatSessionPeriod } from "@/utils/booking";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useState } from "react";
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
  const { profile } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const { sessions, loading, error, refresh } = useSessions(
    ADMIN_START_STR,
    ADMIN_END_STR,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const isCompactViewport = isMobile || isTablet;
  const [viewportWidth, setViewportWidth] = useState<number>(() =>
    typeof window !== "undefined" ? window.innerWidth : 1280,
  );
  const isNarrowDesktop = viewportWidth >= 1024 && viewportWidth < 1280;
  const forceCardsViewport = isCompactViewport || isNarrowDesktop;
  const [viewMode, setViewMode] = useState<ViewMode>(() =>
    isCompactViewport ? "cards" : "table",
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const selectedSessionId = searchParams.get("sessionId");
  const editRequested = searchParams.get("edit") === "1";
  const [standaloneFormState, setStandaloneFormState] =
    useState<SessionFormState | null>(null);
  const [isFiltersDialogOpen, setIsFiltersDialogOpen] = useState(false);
  const [sessionPendingCancel, setSessionPendingCancel] =
    useState<SessionAvailability | null>(null);
  const [cancellingSession, setCancellingSession] = useState(false);
  const pageSize = 10;
  const activeViewMode: ViewMode = forceCardsViewport ? "cards" : viewMode;
  const activeTab: HubTab =
    searchParams.get("tab") === "reagendamentos" ? "reagendamentos" : "sessoes";
  const canManage =
    profile?.role === "admin" || profile?.role === "coordinator";

  useEffect(() => {
    const onResize = () => setViewportWidth(window.innerWidth);
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

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

  const openEditStandalone = useCallback(
    (sessionId: string) => {
      const nextParams = new URLSearchParams(searchParams);
      nextParams.delete("sessionId");
      nextParams.delete("edit");
      setSearchParams(nextParams, { replace: true });
      setStandaloneFormState({
        mode: "edit",
        sessionId,
        reopenHubOnSave: false,
      });
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

  const handleConfirmCancelSession = useCallback(async () => {
    if (!sessionPendingCancel) {
      return;
    }

    setCancellingSession(true);
    try {
      await updateSession(sessionPendingCancel.session_id, {
        status: "closed",
      });
      toast.success("Sessão cancelada com sucesso.");
      setSessionPendingCancel(null);
      await refresh();
    } catch (error) {
      console.error(error);
      toast.error("Não foi possível cancelar a sessão.");
    } finally {
      setCancellingSession(false);
    }
  }, [refresh, sessionPendingCancel]);

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

  const statusFilterLabel =
    statusFilter === "all"
      ? "Todas"
      : statusFilter === "open"
        ? "Abertas"
        : statusFilter === "closed"
          ? "Fechadas"
          : "Concluídas";

  return (
    <Layout>
      <div
        className="mx-auto w-full max-w-screen-2xl space-y-4 px-4 py-4 sm:px-6 lg:px-0"
        data-testid="sessions-management-page"
      >
        {/* hero */}
        <section>
          <div className="relative overflow-hidden rounded-2xl border border-primary/20 bg-primary px-4 py-4 text-white md:px-6 md:py-5 lg:px-8 lg:py-6">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2
                  className="text-lg font-bold tracking-tight md:text-xl lg:text-2xl"
                  data-testid="sessions-management-title"
                >
                  Hub de Sessões
                </h2>
                <p className="mt-1 text-xs text-white/85 md:text-sm">
                  Centro operacional para criação, acompanhamento,
                  reagendamentos e execução das sessões de avaliação física.
                </p>
              </div>
              <div />
            </div>
          </div>
        </section>

        <section className="inline-flex max-w-full rounded-xl border border-border-default bg-bg-card p-1.5">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveTab("sessoes")}
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
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
              className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold transition-colors ${
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
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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

            <div className="overflow-hidden rounded-xl border border-border-default bg-bg-card">
              <div className="space-y-2 border-b border-border-default p-3 md:p-4">
                <div className="relative w-full">
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

                <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
                  <div className="flex w-full flex-wrap items-center gap-2 lg:w-auto lg:flex-nowrap">
                    <button
                      type="button"
                      onClick={openCreateDialog}
                      className="inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-primary/90 sm:flex-none"
                    >
                      <AppIcon icon={Plus} size="sm" decorative />
                      Nova sessão
                    </button>

                    <button
                      type="button"
                      onClick={() => setIsFiltersDialogOpen(true)}
                      className="inline-flex h-9 shrink-0 items-center gap-2 rounded-lg bg-bg-default px-3 py-2 text-text-body transition-colors hover:bg-bg-card/20"
                      title="Filtros avançados"
                      aria-label="Filtros avançados"
                    >
                      <AppIcon icon={Filter} size="sm" decorative />
                      Filtros
                    </button>
                  </div>

                  <div className="flex w-full items-center justify-end gap-2 lg:w-auto">
                    <span className="inline-flex items-center rounded-full bg-bg-default px-3 py-1 text-xs font-semibold text-text-muted">
                      Status: {statusFilterLabel}
                    </span>
                    {!forceCardsViewport && (
                      <span className="inline-flex items-center rounded-full bg-bg-default px-3 py-1 text-xs font-semibold text-text-muted">
                        Visualização:{" "}
                        {viewMode === "table" ? "Tabela" : "Cards"}
                      </span>
                    )}
                  </div>
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
              <div className="overflow-x-auto pr-2">
                <table className="w-full min-w-[700px] table-fixed text-left">
                  <colgroup>
                    <col className="w-[20%]" />
                    <col className="w-[24%]" />
                    <col className="w-[14%]" />
                    <col className="w-[16%]" />
                    <col className="w-[26%]" />
                  </colgroup>
                  <thead className="bg-bg-default">
                    <tr>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                        Turma
                      </th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                        Data
                      </th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                        Turno
                      </th>
                      <th className="px-4 py-4 text-xs font-bold uppercase tracking-wider text-text-muted">
                        Status
                      </th>
                      <th className="px-4 py-4 text-right text-xs font-bold uppercase tracking-wider text-text-muted">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-default">
                    {paginatedSessions.map((s) => {
                      const status = getSessionStatus(s);
                      const isOpen = status === "open";
                      const isCompleted = status === "completed";
                      return (
                        <tr
                          key={s.session_id}
                          className="hover:bg-bg-card/20 transition-colors"
                        >
                          <td className="px-4 py-4 align-middle">
                            <div className="font-mono text-sm font-bold text-text-body">
                              {s.session_id.slice(0, 12).toUpperCase()}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <div className="text-sm font-semibold capitalize text-text-body">
                              {format(parseISO(s.date), "EEE", {
                                locale: ptBR,
                              })}
                            </div>
                            <div className="mt-0.5 text-xs text-text-muted">
                              {format(parseISO(s.date), "dd/MM/yy", {
                                locale: ptBR,
                              })}
                            </div>
                          </td>
                          <td className="px-4 py-4 align-middle">
                            <span className="text-sm font-semibold capitalize text-text-body">
                              {formatSessionPeriod(s.period)}
                            </span>
                          </td>
                          <td className="px-4 py-4 align-middle">
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
                          <td className="px-4 py-4 text-right align-middle">
                            <div className="flex flex-wrap items-center justify-end gap-1.5 whitespace-nowrap">
                              <button
                                type="button"
                                onClick={() => openHubDialog(s.session_id)}
                                className="inline-flex h-8 w-[120px] items-center justify-center gap-1.5 rounded-lg border border-primary/20 bg-primary/10 px-2 text-xs font-semibold text-primary transition-colors hover:bg-primary/20"
                                title={
                                  isOpen ? "Gerir sessão" : "Visualizar sessão"
                                }
                                aria-label={
                                  isOpen ? "Gerir sessão" : "Visualizar sessão"
                                }
                              >
                                <AppIcon
                                  icon={ClipboardList}
                                  size="sm"
                                  decorative
                                />
                                {isOpen ? "Gerir" : "Visualizar"}
                              </button>

                              <button
                                type="button"
                                onClick={() => openEditStandalone(s.session_id)}
                                disabled={!canManage || !isOpen}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-body transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                title="Editar sessão"
                                aria-label="Editar sessão"
                              >
                                <AppIcon icon={Edit2} size="sm" decorative />
                              </button>

                              <button
                                type="button"
                                onClick={() =>
                                  openDuplicateDialog(s.session_id)
                                }
                                disabled={!canManage || !isOpen}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-body transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                                title="Duplicar sessão"
                                aria-label="Duplicar sessão"
                              >
                                <AppIcon icon={Copy} size="sm" decorative />
                              </button>

                              <button
                                type="button"
                                onClick={() => setSessionPendingCancel(s)}
                                disabled={!canManage || !isOpen}
                                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-body transition-colors hover:border-error/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                                title="Cancelar sessão"
                                aria-label="Cancelar sessão"
                              >
                                <AppIcon icon={Trash2} size="sm" decorative />
                              </button>

                              {isCompleted ? (
                                <button
                                  type="button"
                                  onClick={() => openHubDialog(s.session_id)}
                                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-border-default text-text-body transition-colors hover:border-primary/30 hover:text-primary"
                                  title="Imprimir relatório final"
                                  aria-label="Imprimir relatório final"
                                >
                                  <AppIcon
                                    icon={FileDown}
                                    size="sm"
                                    decorative
                                  />
                                </button>
                              ) : null}
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
              <div className="grid grid-cols-1 gap-3 p-3 sm:grid-cols-2 md:gap-3 md:p-4 lg:grid-cols-3">
                {paginatedSessions.map((s) => {
                  const status = getSessionStatus(s);
                  const isOpen = status === "open";
                  const isCompleted = status === "completed";
                  const occupied = s.occupied_count;
                  const max = s.max_capacity;
                  const percent = max ? Math.round((occupied / max) * 100) : 0;
                  return (
                    <div
                      key={s.session_id}
                      className={`rounded-xl border border-border-default border-l-4 bg-bg-default p-4 ${
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
                          {isOpen ? "Gerir Sessão" : "Visualizar Sessão"}
                        </button>

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => openEditStandalone(s.session_id)}
                            disabled={!canManage || !isOpen}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-default px-2 py-2 text-xs font-semibold text-text-body transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <AppIcon icon={Edit2} size="xs" decorative />
                            Editar
                          </button>

                          <button
                            type="button"
                            onClick={() => openDuplicateDialog(s.session_id)}
                            disabled={!canManage || !isOpen}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-default px-2 py-2 text-xs font-semibold text-text-body transition-colors hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <AppIcon icon={Copy} size="xs" decorative />
                            Duplicar
                          </button>

                          <button
                            type="button"
                            onClick={() => setSessionPendingCancel(s)}
                            disabled={!canManage || !isOpen}
                            className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-default px-2 py-2 text-xs font-semibold text-text-body transition-colors hover:border-error/40 hover:text-error disabled:cursor-not-allowed disabled:opacity-50"
                          >
                            <AppIcon icon={Trash2} size="xs" decorative />
                            Cancelar
                          </button>

                          {isCompleted ? (
                            <button
                              type="button"
                              onClick={() => openHubDialog(s.session_id)}
                              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-border-default px-2 py-2 text-xs font-semibold text-text-body transition-colors hover:border-primary/30 hover:text-primary"
                            >
                              <AppIcon icon={FileDown} size="xs" decorative />
                              Imprimir
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {!loading && !error && filteredSessions.length > pageSize && (
              <div className="flex items-center justify-between border-t border-border-default bg-bg-default px-4 py-3 text-sm sm:px-6 sm:py-4">
                <p className="text-xs text-text-muted">
                  {paginatedSessions.length} de {filteredSessions.length} turmas
                </p>
                <div className="flex items-center gap-1">
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
                  {forceCardsViewport ? (
                    <span className="px-2 text-xs font-semibold text-text-body">
                      {page}/{pageCount}
                    </span>
                  ) : (
                    Array.from({ length: pageCount }, (_, i) => i + 1).map(
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
                    )
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
        open={sessionPendingCancel !== null}
        onClose={() => {
          if (!cancellingSession) {
            setSessionPendingCancel(null);
          }
        }}
        closeDisabled={cancellingSession}
        title="Cancelar sessão"
        description="Esta ação faz a exclusão lógica da turma e impede novos lançamentos operacionais."
        widthClassName="max-w-lg"
        footer={
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setSessionPendingCancel(null)}
              disabled={cancellingSession}
              className="rounded-lg border border-border-default px-4 py-2 text-sm font-semibold text-text-body disabled:opacity-60"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => void handleConfirmCancelSession()}
              disabled={cancellingSession}
              className="inline-flex items-center gap-2 rounded-lg bg-error px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {cancellingSession ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Cancelando...
                </>
              ) : (
                "Confirmar cancelamento"
              )}
            </button>
          </div>
        }
      >
        <div className="space-y-3 text-sm text-text-body">
          <p>
            A turma{" "}
            <strong>
              {sessionPendingCancel?.session_id.slice(0, 12).toUpperCase()}
            </strong>{" "}
            será marcada como fechada para bloquear novas operações.
          </p>
          {sessionPendingCancel && sessionPendingCancel.occupied_count > 0 ? (
            <p className="rounded-lg border border-alert/40 bg-alert/10 px-3 py-2 text-alert">
              Atenção: existem {sessionPendingCancel.occupied_count} militar(es)
              agendado(s). Garanta o tratamento de reagendamentos antes de
              concluir o processo.
            </p>
          ) : null}
        </div>
      </Dialog>

      <Dialog
        open={isFiltersDialogOpen}
        onClose={() => setIsFiltersDialogOpen(false)}
        title="Filtros de exibição"
        description="Ajuste status e modo de visualização sem poluir a barra principal."
        widthClassName="max-w-lg"
        footer={
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setStatusFilter("all");
                if (!forceCardsViewport) {
                  setViewMode("table");
                }
                setPage(1);
              }}
              className="rounded-lg border border-border-default px-3 py-2 text-sm font-semibold text-text-body"
            >
              Limpar
            </button>
            <button
              type="button"
              onClick={() => setIsFiltersDialogOpen(false)}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-white"
            >
              Aplicar
            </button>
          </div>
        }
      >
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
              Status
            </p>
            <div className="grid grid-cols-2 gap-2">
              {(["all", "open", "closed", "completed"] as const).map((f) => (
                <button
                  key={f}
                  type="button"
                  onClick={() => {
                    setStatusFilter(f);
                    setPage(1);
                  }}
                  className={`rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    statusFilter === f
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-default bg-bg-card text-text-body hover:bg-bg-default"
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
          </div>

          {!forceCardsViewport && (
            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wider text-text-muted">
                Visualização
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setViewMode("table")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    viewMode === "table"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-default bg-bg-card text-text-body hover:bg-bg-default"
                  }`}
                >
                  <AppIcon icon={LayoutList} size="sm" decorative />
                  Tabela
                </button>
                <button
                  type="button"
                  onClick={() => setViewMode("cards")}
                  className={`inline-flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-semibold transition-colors ${
                    viewMode === "cards"
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border-default bg-bg-card text-text-body hover:bg-bg-default"
                  }`}
                >
                  <AppIcon icon={LayoutGrid} size="sm" decorative />
                  Cards
                </button>
              </div>
            </div>
          )}
        </div>
      </Dialog>
    </Layout>
  );
};

export default SessionsManagement;
