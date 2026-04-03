/**
 * @page SessionsManagement
 * @description Administração geral das sessões.
 * @path src/pages/SessionsManagement.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import { useResponsive } from "@/hooks/useResponsive";
import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Edit2,
  MapPin,
  Plus,
  Search,
  Settings,
  XCircle,
  type LucideIcon,
} from "@/icons";
import OmLocationEditor from "@/pages/OmLocationEditor";
import OmLocationManager from "@/pages/OmLocationManager";
import OmScheduleEditor from "@/pages/OmScheduleEditor";
import ReschedulingManagement from "@/pages/ReschedulingManagement";
import ScoreEntry from "@/pages/ScoreEntry";
import type { SessionStatus } from "@/types/database.types";
import { formatSessionPeriod } from "@/utils/booking";
import {
  buildSessionHubPath,
  parseSessionHubTab,
  type SessionHubTab,
} from "@/utils/sessionHub";
import { format, parseISO, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

type StatusFilter = "all" | SessionStatus;

const HUB_TAB_META: Array<{ tab: SessionHubTab; label: string }> = [
  { tab: "sessoes", label: "Sessões" },
  { tab: "reagendamentos", label: "Reagendamentos" },
  { tab: "indices", label: "Lançamento de Índices" },
  { tab: "locais", label: "Locais e Horários" },
];

const ADMIN_START = new Date();
ADMIN_START.setFullYear(ADMIN_START.getFullYear() - 2);
const ADMIN_END = new Date();
ADMIN_END.setFullYear(ADMIN_END.getFullYear() + 1);
const ADMIN_START_STR = ADMIN_START.toISOString().split("T")[0];
const ADMIN_END_STR = ADMIN_END.toISOString().split("T")[0];

const HUB_DASHBOARD_STYLE: CSSProperties = {
  "--sessions-hero": "#0a2b64",
  "--sessions-hero-accent": "#2877d4",
  "--sessions-hero-highlight": "rgba(129, 199, 255, 0.22)",
  "--sessions-surface": "rgba(255, 255, 255, 0.86)",
  "--sessions-surface-strong": "rgba(255, 255, 255, 0.96)",
  "--sessions-border": "rgba(10, 43, 100, 0.12)",
  "--sessions-shadow": "0 24px 60px rgba(10, 35, 89, 0.16)",
};

const STATUS_FILTERS: Array<{ value: StatusFilter; label: string }> = [
  { value: "all", label: "Todas" },
  { value: "open", label: "Abertas" },
  { value: "closed", label: "Canceladas" },
  { value: "completed", label: "Concluídas" },
];

const STATUS_META: Record<
  SessionStatus,
  {
    label: string;
    summaryLabel: string;
    icon: LucideIcon;
    badgeClassName: string;
    accentClassName: string;
    iconClassName: string;
  }
> = {
  open: {
    label: "ABERTA",
    summaryLabel: "Abertas",
    icon: CalendarClock,
    badgeClassName:
      "border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    accentClassName: "from-sky-300 via-sky-400 to-primary",
    iconClassName: "bg-primary/10 text-primary",
  },
  closed: {
    label: "CANCELADA",
    summaryLabel: "Canceladas",
    icon: XCircle,
    badgeClassName:
      "border-error/20 bg-error/10 text-error shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    accentClassName: "from-rose-200 via-rose-300 to-error",
    iconClassName: "bg-error/10 text-error",
  },
  completed: {
    label: "CONCLUÍDA",
    summaryLabel: "Concluídas",
    icon: CheckCircle2,
    badgeClassName:
      "border-success/20 bg-success/10 text-success shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    accentClassName: "from-emerald-200 via-emerald-300 to-success",
    iconClassName: "bg-success/10 text-success",
  },
};

function getShortSessionId(sessionId: string): string {
  return sessionId.slice(0, 12).toUpperCase();
}

function formatWeekdayLabel(date: string): string {
  return format(parseISO(date), "EEEE", { locale: ptBR }).replace(
    /(^|-)(\p{L})/gu,
    (segment) => segment.toUpperCase(),
  );
}

function formatFullSessionDate(date: string): string {
  return `${formatWeekdayLabel(date)}, ${format(
    parseISO(date),
    "d 'de' MMMM 'de' yyyy",
    {
      locale: ptBR,
    },
  )}`;
}

function getLocationLabel(session: SessionAvailability): string {
  return session.location_name?.trim() || "Local não definido";
}

function SessionMetricCard({
  title,
  value,
  icon,
  accentClassName,
  iconClassName,
}: {
  title: string;
  value: number;
  icon: LucideIcon;
  accentClassName: string;
  iconClassName: string;
}) {
  return (
    <article className="relative overflow-hidden rounded-[24px] border border-[var(--sessions-border)] bg-[var(--sessions-surface-strong)] p-5 shadow-[var(--sessions-shadow)] backdrop-blur">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accentClassName}`}
      />
      <div className="flex items-center gap-4">
        <div
          className={`flex h-14 w-14 items-center justify-center rounded-2xl ${iconClassName}`}
        >
          <AppIcon icon={icon} size="lg" decorative />
        </div>
        <div>
          <p className="text-sm font-medium text-text-muted">{title}</p>
          <p className="mt-1 font-['Space_Grotesk'] text-3xl font-bold leading-none text-slate-950">
            {value}
          </p>
        </div>
      </div>
    </article>
  );
}

function SessionStatusBadge({ status }: { status: SessionStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${STATUS_META[status].badgeClassName}`}
    >
      {STATUS_META[status].label}
    </span>
  );
}

function SessionOccupancyBar({
  session,
  compact = false,
}: {
  session: SessionAvailability;
  compact?: boolean;
}) {
  const occupied = session.occupied_count ?? 0;
  const capacity = session.max_capacity ?? 0;
  const percent = capacity > 0 ? Math.round((occupied / capacity) * 100) : 0;

  return (
    <div className={compact ? "w-full" : "min-w-[180px]"}>
      <div className="mb-2 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{percent}%</span>
        <span>
          {occupied}/{capacity}
        </span>
      </div>
      <div
        className="h-2.5 overflow-hidden rounded-full bg-slate-200"
        role="progressbar"
        aria-label="Ocupação da sessão"
        aria-valuemin={0}
        aria-valuemax={capacity || 1}
        aria-valuenow={occupied}
      >
        <div
          className="h-full rounded-full bg-[var(--sessions-hero-accent)] transition-[width] duration-300"
          style={{ width: `${Math.min(percent, 100)}%` }}
        />
      </div>
    </div>
  );
}

function SessionActionButton({
  label,
  icon,
  onClick,
  disabled = false,
}: {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:border-slate-200 disabled:hover:text-slate-800"
    >
      <AppIcon icon={icon} size="sm" decorative />
    </button>
  );
}

export const SessionsManagement = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const { sessions, loading, error, refresh } = useSessions(
    ADMIN_START_STR,
    ADMIN_END_STR,
  );

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const isCompactViewport = isMobile || isTablet;
  const pageSize = 10;
  const activeTab = parseSessionHubTab(searchParams.get("tab"));
  const activeIndicesSessionId = searchParams.get("sessionId") ?? "";
  const localMode = searchParams.get("mode") ?? "list";
  const localId = searchParams.get("locationId") ?? undefined;
  const todayTs = useMemo(() => startOfDay(new Date()).getTime(), []);

  const getSessionStatus = useCallback(
    (session: SessionAvailability): SessionStatus => {
      const sessionDate = startOfDay(parseISO(session.date)).getTime();
      if (session.status === "open" && sessionDate < todayTs) {
        return "completed";
      }

      return session.status;
    },
    [todayTs],
  );

  const filteredSessions = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return sessions.filter((session) => {
      const dateLabel = format(parseISO(session.date), "dd MMM yyyy", {
        locale: ptBR,
      }).toLowerCase();
      const matchSearch =
        !term ||
        session.session_id.toLowerCase().includes(term) ||
        session.period.toLowerCase().includes(term) ||
        formatSessionPeriod(session.period).toLowerCase().includes(term) ||
        getLocationLabel(session).toLowerCase().includes(term) ||
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
  }, [filteredSessions, page]);

  const statusCounts = useMemo(
    () => ({
      open: sessions.filter((session) => getSessionStatus(session) === "open")
        .length,
      closed: sessions.filter(
        (session) => getSessionStatus(session) === "closed",
      ).length,
      completed: sessions.filter(
        (session) => getSessionStatus(session) === "completed",
      ).length,
    }),
    [sessions, getSessionStatus],
  );

  useEffect(() => {
    if (page > pageCount) {
      setPage(pageCount);
    }
  }, [page, pageCount]);

  const applyHubSearchParams = useCallback(
    (next: URLSearchParams) => {
      if (next.toString() === searchParams.toString()) {
        return;
      }

      setSearchParams(next, { replace: false });
    },
    [searchParams, setSearchParams],
  );

  const openHubTab = useCallback(
    (
      tab: SessionHubTab,
      params?: { sessionId?: string; locationId?: string; mode?: string },
    ) => {
      const url = new URL(buildSessionHubPath(tab, params), "http://localhost");
      const next = new URLSearchParams(url.search);
      applyHubSearchParams(next);
    },
    [applyHubSearchParams],
  );

  const handleLocalHubNavigate = useCallback(
    (path: string) => {
      if (path.startsWith("/app/sessoes?")) {
        const url = new URL(path, "http://localhost");
        const next = new URLSearchParams(url.search);
        applyHubSearchParams(next);
        return;
      }

      if (path === "/app/om-locations") {
        openHubTab("locais", { mode: "list" });
        return;
      }

      if (path === "/app/om/new") {
        openHubTab("locais", { mode: "new" });
        return;
      }

      const scheduleMatch = path.match(/^\/app\/om\/([^/]+)\/schedules$/);
      if (scheduleMatch) {
        openHubTab("locais", {
          mode: "schedules",
          locationId: scheduleMatch[1],
        });
        return;
      }

      const editMatch = path.match(/^\/app\/om\/([^/]+)$/);
      if (editMatch) {
        openHubTab("locais", {
          mode: "edit",
          locationId: editMatch[1],
        });
      }
    },
    [applyHubSearchParams, openHubTab],
  );

  const handleIndicesSessionChange = useCallback(
    (sessionId: string) => {
      if (sessionId === activeIndicesSessionId) {
        return;
      }

      openHubTab("indices", { sessionId });
    },
    [activeIndicesSessionId, openHubTab],
  );

  if (loading) {
    return (
      <FullPageLoading
        message="Carregando hub de sessões"
        description="Aguarde enquanto consolidamos as sessões de avaliação física."
      />
    );
  }

  return (
    <Layout>
      <div
        className="mx-auto w-full max-w-[1320px] space-y-6 px-4 py-4 font-['Public_Sans'] sm:px-6"
        data-testid="sessions-management-page"
        style={HUB_DASHBOARD_STYLE}
      >
        <section className="relative overflow-hidden rounded-[32px] bg-[var(--sessions-hero)] px-6 py-8 text-white shadow-[var(--sessions-shadow)] md:px-8 md:py-10 xl:px-12">
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_var(--sessions-hero-highlight),_transparent_42%)]" />
            <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%,rgba(255,255,255,0.03))]" />
            <div className="absolute -bottom-12 right-0 h-40 w-40 rounded-full border border-white/10 bg-white/5 blur-2xl" />
          </div>

          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-white/70">
                  Painel operacional
                </p>
                <h1
                  className="mt-3 font-['Space_Grotesk'] text-4xl font-bold tracking-tight text-white sm:text-5xl"
                  data-testid="sessions-management-title"
                >
                  Hub de Sessões
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82 sm:text-base">
                  Centro operacional para criação, acompanhamento e execução das
                  sessões de avaliação física.
                </p>
              </div>

              <button
                type="button"
                onClick={() => navigate("/app/sessoes/nova")}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[var(--sessions-hero-accent)] px-5 py-3 font-['Space_Grotesk'] text-base font-bold text-white shadow-lg shadow-blue-950/20 transition-transform duration-200 hover:-translate-y-0.5 hover:bg-blue-500"
              >
                <AppIcon icon={Plus} size="sm" decorative />
                Criar Nova Sessão
              </button>
            </div>

            <nav className="flex flex-wrap gap-2 rounded-[22px] border border-white/10 bg-white/10 p-2 backdrop-blur-md">
              {HUB_TAB_META.map((item) => (
                <button
                  key={item.tab}
                  type="button"
                  onClick={() => openHubTab(item.tab)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition-all ${
                    activeTab === item.tab
                      ? "bg-white text-[var(--sessions-hero)] shadow-sm"
                      : "text-white/78 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          </div>
        </section>

        {activeTab === "reagendamentos" && (
          <section className="rounded-[28px] border border-[var(--sessions-border)] bg-[var(--sessions-surface)] p-4 shadow-[var(--sessions-shadow)] backdrop-blur md:p-6">
            <ReschedulingManagement embedded />
          </section>
        )}

        {activeTab === "indices" && (
          <section
            className="rounded-[28px] border border-[var(--sessions-border)] bg-[var(--sessions-surface)] p-4 shadow-[var(--sessions-shadow)] backdrop-blur md:p-6"
            data-testid="session-hub-indices-panel"
          >
            <ScoreEntry
              embedded
              initialSessionId={searchParams.get("sessionId") ?? undefined}
              onSessionChange={handleIndicesSessionChange}
            />
          </section>
        )}

        {activeTab === "locais" && (
          <section
            className="rounded-[28px] border border-[var(--sessions-border)] bg-[var(--sessions-surface)] p-4 shadow-[var(--sessions-shadow)] backdrop-blur md:p-6"
            data-testid="session-hub-locais-panel"
          >
            {localMode === "new" && (
              <OmLocationEditor
                embedded
                locationId="new"
                onNavigatePath={handleLocalHubNavigate}
              />
            )}
            {localMode === "edit" && localId && (
              <OmLocationEditor
                embedded
                locationId={localId}
                onNavigatePath={handleLocalHubNavigate}
              />
            )}
            {localMode === "schedules" && localId && (
              <OmScheduleEditor
                embedded
                locationId={localId}
                onNavigatePath={handleLocalHubNavigate}
              />
            )}
            {((localMode === "edit" || localMode === "schedules") &&
              !localId) ||
            localMode === "list" ? (
              <OmLocationManager
                embedded
                onNavigatePath={handleLocalHubNavigate}
              />
            ) : null}
          </section>
        )}

        {activeTab !== "sessoes" ? null : (
          <>
            <section className="-mt-12 relative z-10 grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
              <SessionMetricCard
                title="Total"
                value={sessions.length}
                icon={Calendar}
                accentClassName="from-blue-700 via-blue-600 to-[var(--sessions-hero-accent)]"
                iconClassName="bg-[var(--sessions-hero)]/10 text-[var(--sessions-hero)]"
              />
              <SessionMetricCard
                title={STATUS_META.open.summaryLabel}
                value={statusCounts.open}
                icon={STATUS_META.open.icon}
                accentClassName={STATUS_META.open.accentClassName}
                iconClassName={STATUS_META.open.iconClassName}
              />
              <SessionMetricCard
                title={STATUS_META.closed.summaryLabel}
                value={statusCounts.closed}
                icon={STATUS_META.closed.icon}
                accentClassName={STATUS_META.closed.accentClassName}
                iconClassName={STATUS_META.closed.iconClassName}
              />
              <SessionMetricCard
                title={STATUS_META.completed.summaryLabel}
                value={statusCounts.completed}
                icon={STATUS_META.completed.icon}
                accentClassName={STATUS_META.completed.accentClassName}
                iconClassName={STATUS_META.completed.iconClassName}
              />
            </section>

            <section className="overflow-hidden rounded-[28px] border border-[var(--sessions-border)] bg-[var(--sessions-surface)] shadow-[var(--sessions-shadow)] backdrop-blur">
              <div className="border-b border-slate-200/80 px-5 py-5 md:px-6">
                <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                  <div className="flex flex-1 flex-col gap-4 lg:flex-row lg:items-center">
                    <label className="relative block w-full lg:max-w-md">
                      <span className="sr-only">Buscar sessões</span>
                      <AppIcon
                        icon={Search}
                        size="sm"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                        decorative
                      />
                      <input
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white pl-11 pr-4 text-sm shadow-sm focus:border-primary/40 focus:ring-2 focus:ring-primary/15"
                        placeholder="Buscar por ID, data, turno ou local..."
                        type="text"
                        value={searchTerm}
                        onChange={(event) => {
                          setSearchTerm(event.target.value);
                          setPage(1);
                        }}
                      />
                    </label>

                    <div className="flex flex-wrap gap-2">
                      {STATUS_FILTERS.map((filter) => (
                        <button
                          key={filter.value}
                          type="button"
                          onClick={() => {
                            setStatusFilter(filter.value);
                            setPage(1);
                          }}
                          className={`rounded-full px-4 py-2 text-sm font-semibold transition-all ${
                            statusFilter === filter.value
                              ? "bg-[var(--sessions-hero)] text-white shadow-sm"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {filter.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-3 text-sm text-slate-500 xl:justify-end">
                    <span>
                      {filteredSessions.length} sessão
                      {filteredSessions.length === 1 ? "" : "ões"} no painel
                    </span>
                    <button
                      type="button"
                      onClick={refresh}
                      className="rounded-full border border-slate-200 px-4 py-2 font-semibold text-slate-700 transition-colors hover:border-primary/25 hover:text-primary"
                    >
                      Atualizar
                    </button>
                  </div>
                </div>
              </div>

              {error ? (
                <div className="p-8 text-center text-sm text-error md:p-12">
                  {error}
                  <button
                    type="button"
                    className="ml-3 font-semibold text-primary hover:underline"
                    onClick={refresh}
                  >
                    Tentar novamente
                  </button>
                </div>
              ) : paginatedSessions.length === 0 ? (
                <div className="p-12 text-center md:p-16">
                  <AppIcon
                    icon={Calendar}
                    size="lg"
                    className="mx-auto mb-3 text-slate-400"
                    decorative
                  />
                  <p className="text-sm text-slate-500">
                    Nenhuma sessão encontrada para os filtros aplicados.
                  </p>
                </div>
              ) : isCompactViewport ? (
                <div className="grid grid-cols-1 gap-4 p-4 md:p-6">
                  {paginatedSessions.map((session) => {
                    const status = getSessionStatus(session);
                    const isCompleted = status === "completed";

                    return (
                      <article
                        key={session.session_id}
                        className="rounded-[24px] border border-slate-200 bg-white p-5 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="font-['Space_Grotesk'] text-lg font-bold text-slate-950">
                              {getShortSessionId(session.session_id)}
                            </p>
                            <p className="mt-1 text-sm font-medium text-slate-700">
                              {formatFullSessionDate(session.date)}
                            </p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                              {formatSessionPeriod(session.period)}
                            </p>
                          </div>
                          <SessionStatusBadge status={status} />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-700">
                            <AppIcon icon={MapPin} size="sm" decorative />
                            {getLocationLabel(session)}
                          </span>
                        </div>

                        <div className="mt-5">
                          <SessionOccupancyBar session={session} compact />
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2 border-t border-slate-100 pt-4">
                          <SessionActionButton
                            label="Ver agendamentos"
                            icon={ClipboardList}
                            onClick={() =>
                              navigate(
                                `/app/turmas/${session.session_id}/agendamentos`,
                              )
                            }
                          />
                          <SessionActionButton
                            label={
                              isCompleted
                                ? "Sessão concluída não pode ser editada"
                                : "Editar sessão"
                            }
                            icon={Edit2}
                            onClick={() =>
                              navigate(
                                `/app/turmas/${session.session_id}/editar`,
                              )
                            }
                            disabled={isCompleted}
                          />
                          <SessionActionButton
                            label="Configurações da sessão"
                            icon={Settings}
                            onClick={() => navigate("/app/configuracoes")}
                          />
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead>
                      <tr className="border-b border-slate-200 bg-white/70 text-sm text-slate-900">
                        <th className="px-5 py-5 font-['Space_Grotesk'] text-lg font-bold md:px-6">
                          ID
                        </th>
                        <th className="px-5 py-5 font-['Space_Grotesk'] text-lg font-bold md:px-6">
                          Data
                        </th>
                        <th className="px-5 py-5 font-['Space_Grotesk'] text-lg font-bold md:px-6">
                          Turno
                        </th>
                        <th className="px-5 py-5 font-['Space_Grotesk'] text-lg font-bold md:px-6">
                          Local
                        </th>
                        <th className="px-5 py-5 font-['Space_Grotesk'] text-lg font-bold md:px-6">
                          Ocupação
                        </th>
                        <th className="px-5 py-5 font-['Space_Grotesk'] text-lg font-bold md:px-6">
                          Status
                        </th>
                        <th className="px-5 py-5 text-right font-['Space_Grotesk'] text-lg font-bold md:px-6">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 bg-white/90">
                      {paginatedSessions.map((session) => {
                        const status = getSessionStatus(session);
                        const isCompleted = status === "completed";

                        return (
                          <tr
                            key={session.session_id}
                            className="transition-colors hover:bg-slate-50/80"
                          >
                            <td className="px-5 py-5 md:px-6">
                              <span className="font-['Space_Grotesk'] text-xl font-bold text-slate-950">
                                {getShortSessionId(session.session_id)}
                              </span>
                            </td>
                            <td className="px-5 py-5 md:px-6">
                              <span className="text-lg font-medium text-slate-800">
                                {formatFullSessionDate(session.date)}
                              </span>
                            </td>
                            <td className="px-5 py-5 md:px-6">
                              <span className="text-lg font-medium text-slate-800">
                                {formatSessionPeriod(session.period)}
                              </span>
                            </td>
                            <td className="px-5 py-5 md:px-6">
                              <span className="inline-flex items-center gap-2 rounded-full bg-sky-50 px-3 py-1.5 text-sm font-semibold text-sky-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)]">
                                <AppIcon icon={MapPin} size="sm" decorative />
                                {getLocationLabel(session)}
                              </span>
                            </td>
                            <td className="px-5 py-5 md:px-6">
                              <SessionOccupancyBar session={session} />
                            </td>
                            <td className="px-5 py-5 md:px-6">
                              <SessionStatusBadge status={status} />
                            </td>
                            <td className="px-5 py-5 md:px-6">
                              <div className="flex justify-end gap-2">
                                <SessionActionButton
                                  label="Ver agendamentos"
                                  icon={ClipboardList}
                                  onClick={() =>
                                    navigate(
                                      `/app/turmas/${session.session_id}/agendamentos`,
                                    )
                                  }
                                />
                                <SessionActionButton
                                  label={
                                    isCompleted
                                      ? "Sessão concluída não pode ser editada"
                                      : "Editar sessão"
                                  }
                                  icon={Edit2}
                                  onClick={() =>
                                    navigate(
                                      `/app/turmas/${session.session_id}/editar`,
                                    )
                                  }
                                  disabled={isCompleted}
                                />
                                <SessionActionButton
                                  label="Configurações da sessão"
                                  icon={Settings}
                                  onClick={() => navigate("/app/configuracoes")}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              {!loading && !error && filteredSessions.length > pageSize && (
                <div className="flex items-center justify-between border-t border-slate-200 bg-white/80 px-5 py-4 text-sm md:px-6">
                  <p className="text-slate-500">
                    {paginatedSessions.length} de {filteredSessions.length}{" "}
                    sessões exibidas
                  </p>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      disabled={page <= 1}
                      onClick={() =>
                        setPage((currentPage) => Math.max(1, currentPage - 1))
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-primary/25 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label="Página anterior"
                    >
                      <AppIcon icon={ChevronLeft} size="sm" decorative />
                    </button>
                    {Array.from(
                      { length: pageCount },
                      (_, index) => index + 1,
                    ).map((pageNumber) => (
                      <button
                        key={pageNumber}
                        type="button"
                        onClick={() => setPage(pageNumber)}
                        className={`flex h-9 w-9 items-center justify-center rounded-xl border text-xs font-bold ${
                          pageNumber === page
                            ? "border-[var(--sessions-hero)] bg-[var(--sessions-hero)] text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:border-primary/25 hover:text-primary"
                        }`}
                      >
                        {pageNumber}
                      </button>
                    ))}
                    <button
                      type="button"
                      disabled={page >= pageCount}
                      onClick={() =>
                        setPage((currentPage) =>
                          Math.min(pageCount, currentPage + 1),
                        )
                      }
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-primary/25 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
                      aria-label="Próxima página"
                    >
                      <AppIcon icon={ChevronRight} size="sm" decorative />
                    </button>
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </div>
    </Layout>
  );
};

export default SessionsManagement;
