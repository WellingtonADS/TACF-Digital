/**
 * @page SessionsManagement
 * @description Administração geral das sessões.
 * @path src/pages/SessionsManagement.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import { fetchCoordinators, type Coordinator } from "@/hooks/usePersonnel";
import { useResponsive } from "@/hooks/useResponsive";
import useSessions, { type SessionAvailability } from "@/hooks/useSessions";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Edit2,
  FileDown,
  MapPin,
  Plus,
  Search,
  Settings,
  UserCheck,
  X,
  XCircle,
  type LucideIcon,
} from "@/icons";
import OmLocationEditor from "@/pages/OmLocationEditor";
import OmLocationManager from "@/pages/OmLocationManager";
import OmScheduleEditor from "@/pages/OmScheduleEditor";
import ReschedulingManagement from "@/pages/ReschedulingManagement";
import ScoreEntry from "@/pages/ScoreEntry";
import { createSessions } from "@/services/bookings";
import {
  closeSessionWithChecklist,
  fetchSessionBookingsWithProfiles,
  fetchSessionById,
  fetchSessionClosureChecklist,
  updateBookingResult,
  type SessionClosureChecklist,
} from "@/services/sessions";
import type { SessionStatus } from "@/types/database.types";
import { formatSessionPeriod } from "@/utils/booking";
import { generateAttendanceListPdf } from "@/utils/pdf/generateAttendanceList";
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
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type StatusFilter = "all" | SessionStatus;
type PeriodOption = "manha" | "tarde";
type RecurrenceOption = "single" | "week" | "biweekly" | "month";
type FitnessResult = "apto" | "inapto";

type BookingModalRow = {
  bookingId: string;
  userId: string;
  rank: string | null;
  fullName: string;
  warName: string | null;
  saram: string | null;
  status: string;
  result: FitnessResult | null;
};

type ManagementState = {
  session: SessionAvailability;
  sessionStatus: SessionStatus;
  rows: BookingModalRow[];
  checklist: SessionClosureChecklist | null;
};

type CreatorState = {
  locationId: string;
  coordinatorId: string;
  period: PeriodOption;
  withIndexes: boolean;
  date: string;
  recurrence: RecurrenceOption;
};

const INITIAL_CREATOR_STATE: CreatorState = {
  locationId: "",
  coordinatorId: "",
  period: "manha",
  withIndexes: true,
  date: "",
  recurrence: "single",
};

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

const HUB_DASHBOARD_STYLE: CSSProperties & Record<string, string> = {
  "--sessions-hero": "#1a365d",
  "--sessions-hero-accent": "#2b6cb0",
  "--sessions-hero-highlight": "rgba(129, 199, 255, 0.22)",
  "--sessions-surface": "rgba(255, 255, 255, 0.88)",
  "--sessions-surface-strong": "rgba(255, 255, 255, 0.96)",
  "--sessions-border": "rgba(26, 54, 93, 0.14)",
  "--sessions-shadow": "0 26px 70px rgba(18, 38, 66, 0.18)",
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
  return sessionId.slice(0, 11).toUpperCase();
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

function getRecurringDates(
  baseDate: string,
  recurrence: RecurrenceOption,
): string[] {
  if (!baseDate) return [];

  const result = [baseDate];
  if (recurrence === "single") return result;

  const date = new Date(`${baseDate}T12:00:00`);
  const step = recurrence === "week" ? 7 : recurrence === "biweekly" ? 14 : 30;
  const limit = recurrence === "month" ? 3 : 4;

  for (let index = 1; index < limit; index += 1) {
    const next = new Date(date);
    next.setDate(date.getDate() + step * index);
    result.push(next.toISOString().slice(0, 10));
  }

  return result;
}

function parseFitnessResult(value: unknown): FitnessResult | null {
  if (typeof value === "string") {
    const normalized = value.toLowerCase();
    if (normalized === "apto") return "apto";
    if (normalized === "inapto") return "inapto";
  }

  return null;
}

function AppModal({
  open,
  zIndex,
  children,
  onOverlayClick,
}: {
  open: boolean;
  zIndex: number;
  children: JSX.Element;
  onOverlayClick?: () => void;
}) {
  if (!open || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="fixed inset-0"
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="absolute inset-0 bg-slate-950/35 backdrop-blur-[2px]"
        onClick={onOverlayClick}
      />
      <div className="relative flex min-h-full items-center justify-center p-4 md:p-6">
        {children}
      </div>
    </div>,
    document.body,
  );
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
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-slate-600">
        <span>{percent}%</span>
        <span>
          {occupied}/{capacity}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-slate-200">
        <div
          className="h-full rounded-full bg-[var(--sessions-hero-accent)]"
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
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-800 shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
    >
      <AppIcon icon={icon} size="sm" decorative />
    </button>
  );
}

export const SessionsManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const { sessions, loading, error, refresh } = useSessions(
    ADMIN_START_STR,
    ADMIN_END_STR,
  );
  const { locations, fetch: fetchLocations } = useLocations();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorState, setCreatorState] = useState<CreatorState>(
    INITIAL_CREATOR_STATE,
  );
  const [coordinators, setCoordinators] = useState<Coordinator[]>([]);
  const [loadingCoordinators, setLoadingCoordinators] = useState(false);
  const [submittingCreator, setSubmittingCreator] = useState(false);

  const [managementOpen, setManagementOpen] = useState(false);
  const [managementLoading, setManagementLoading] = useState(false);
  const [managementState, setManagementState] =
    useState<ManagementState | null>(null);

  const [performanceOpen, setPerformanceOpen] = useState(false);
  const [performanceIndex, setPerformanceIndex] = useState(0);
  const [performanceSaving, setPerformanceSaving] = useState(false);
  const [performanceDecision, setPerformanceDecision] =
    useState<FitnessResult>("apto");
  const [performanceInputs, setPerformanceInputs] = useState({
    flexao: "",
    abdominal: "",
    corrida: "",
  });

  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);

  const isCompactViewport = isMobile || isTablet;
  const pageSize = 10;
  const activeTab = parseSessionHubTab(searchParams.get("tab"));
  const activeIndicesSessionId = searchParams.get("sessionId") ?? "";
  const localMode = searchParams.get("mode") ?? "list";
  const localId = searchParams.get("locationId") ?? undefined;
  const todayTs = useMemo(() => startOfDay(new Date()).getTime(), []);

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === creatorState.locationId),
    [locations, creatorState.locationId],
  );

  const evaluatedCount = useMemo(
    () =>
      (managementState?.rows ?? []).filter((row) => row.result !== null).length,
    [managementState],
  );

  const pendingCount = useMemo(
    () =>
      (managementState?.rows ?? []).filter((row) => row.result === null).length,
    [managementState],
  );

  const performanceRows = useMemo(
    () => managementState?.rows ?? [],
    [managementState],
  );

  const currentPerformanceRow = performanceRows[performanceIndex] ?? null;

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

  useEffect(() => {
    if (!creatorOpen) return;

    fetchLocations({ status: "active", limit: 100 });
    setLoadingCoordinators(true);
    fetchCoordinators()
      .then((response) => {
        setCoordinators(response);
      })
      .catch((requestError) => {
        console.error(requestError);
        toast.error("Não foi possível carregar coordenadores.");
      })
      .finally(() => setLoadingCoordinators(false));
  }, [creatorOpen, fetchLocations]);

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

  const closeCreatorModal = () => {
    setCreatorOpen(false);
    setCreatorState(INITIAL_CREATOR_STATE);
  };

  const openCreatorModal = () => {
    setCreatorOpen(true);
  };

  const handleCreatorField = <K extends keyof CreatorState>(
    field: K,
    value: CreatorState[K],
  ) => {
    setCreatorState((previous) => ({ ...previous, [field]: value }));
  };

  const handleCreateSessions = async () => {
    if (
      !creatorState.locationId ||
      !creatorState.coordinatorId ||
      !creatorState.date
    ) {
      toast.error("Preencha local, coordenador e data inicial.");
      return;
    }

    setSubmittingCreator(true);
    try {
      const dates = getRecurringDates(
        creatorState.date,
        creatorState.recurrence,
      );
      const payload = dates.map((date) => ({
        date,
        period: creatorState.period,
        max_capacity: selectedLocation?.max_capacity ?? 21,
        location_id: creatorState.locationId,
        applicators: [creatorState.coordinatorId],
        metadata: {
          with_indexes: creatorState.withIndexes,
          source: "hub_modal_creator",
        },
      }));

      await createSessions(payload);
      toast.success(
        dates.length === 1
          ? "Sessão criada com sucesso."
          : `${dates.length} sessões geradas com sucesso.`,
      );
      closeCreatorModal();
      await refresh();
    } catch (requestError) {
      console.error(requestError);
      toast.error("Não foi possível gerar as sessões.");
    } finally {
      setSubmittingCreator(false);
    }
  };

  const buildManagementRows = (
    bookings: unknown[],
    profilesById: Map<
      string,
      {
        id: string;
        full_name: string | null;
        war_name: string | null;
        saram: string | null;
        rank: string | null;
      }
    >,
  ): BookingModalRow[] => {
    return (bookings as Array<Record<string, unknown>>).map((booking) => {
      const userId = String(booking.user_id ?? "");
      const profile = profilesById.get(userId);

      return {
        bookingId: String(booking.id),
        userId,
        rank: profile?.rank ?? null,
        fullName: profile?.full_name ?? "Militar sem nome",
        warName: profile?.war_name ?? null,
        saram: profile?.saram ?? null,
        status: String(booking.status ?? "agendado"),
        result: parseFitnessResult(booking.result_details),
      };
    });
  };

  const openManagementModal = async (session: SessionAvailability) => {
    setManagementOpen(true);
    setManagementLoading(true);
    setPerformanceOpen(false);
    setFinalizeOpen(false);

    try {
      const [bookingsResponse, checklist, sessionDetails] = await Promise.all([
        fetchSessionBookingsWithProfiles(session.session_id),
        fetchSessionClosureChecklist(session.session_id),
        fetchSessionById(session.session_id),
      ]);

      setManagementState({
        session,
        sessionStatus: sessionDetails?.status ?? getSessionStatus(session),
        rows: buildManagementRows(
          bookingsResponse.bookings,
          bookingsResponse.profilesById,
        ),
        checklist,
      });
    } catch (requestError) {
      console.error(requestError);
      setManagementOpen(false);
      toast.error("Não foi possível carregar a gestão da turma.");
    } finally {
      setManagementLoading(false);
    }
  };

  const openPerformanceModal = (startIndex = 0) => {
    if (!managementState || managementState.rows.length === 0) {
      toast.error("Não há militares para lançamento de performance.");
      return;
    }

    const nextIndex = Math.min(
      Math.max(startIndex, 0),
      managementState.rows.length - 1,
    );
    const row = managementState.rows[nextIndex];

    setPerformanceIndex(nextIndex);
    setPerformanceDecision(row.result ?? "apto");
    setPerformanceInputs({ flexao: "", abdominal: "", corrida: "" });
    setPerformanceOpen(true);
  };

  const savePerformanceResult = async () => {
    if (!managementState || !currentPerformanceRow) {
      return;
    }

    setPerformanceSaving(true);

    try {
      await updateBookingResult(
        currentPerformanceRow.bookingId,
        performanceDecision,
      );

      const updatedRows = managementState.rows.map((row, rowIndex) =>
        rowIndex === performanceIndex
          ? { ...row, result: performanceDecision }
          : row,
      );

      setManagementState((previous) =>
        previous
          ? {
              ...previous,
              rows: updatedRows,
            }
          : previous,
      );

      const nextIndex = performanceIndex + 1;
      if (nextIndex < updatedRows.length) {
        const nextRow = updatedRows[nextIndex];
        setPerformanceIndex(nextIndex);
        setPerformanceDecision(nextRow.result ?? "apto");
        setPerformanceInputs({ flexao: "", abdominal: "", corrida: "" });
      } else {
        setPerformanceOpen(false);
        toast.success("Último militar processado.");
      }
    } catch (requestError) {
      console.error(requestError);
      toast.error("Erro ao salvar performance.");
    } finally {
      setPerformanceSaving(false);
    }
  };

  const handleGenerateAttendancePdf = () => {
    if (!managementState) return;

    generateAttendanceListPdf({
      session: {
        id: managementState.session.session_id,
        date: managementState.session.date,
        period: managementState.session.period,
        max_capacity: managementState.session.max_capacity,
      },
      bookings: managementState.rows.map((row, index) => ({
        order_number: String(index + 1).padStart(2, "0"),
        rank: row.rank,
        full_name: row.fullName,
        war_name: row.warName,
        saram: row.saram,
        status: row.status,
        attendance_confirmed: row.result !== null,
      })),
    });
  };

  const handleFinalizeSession = async () => {
    if (!managementState) return;

    setFinalizing(true);
    try {
      const pendingRows = managementState.rows.filter(
        (row) => row.result === null,
      );

      if (pendingRows.length > 0) {
        await Promise.all(
          pendingRows.map((row) =>
            updateBookingResult(row.bookingId, "inapto"),
          ),
        );
      }

      await closeSessionWithChecklist(managementState.session.session_id);
      await refresh();
      setFinalizeOpen(false);
      setPerformanceOpen(false);
      setManagementOpen(false);
      setManagementState(null);
      toast.success("Sessão finalizada e pendentes convertidos para inapto.");
    } catch (requestError) {
      console.error(requestError);
      toast.error("Não foi possível finalizar a sessão.");
    } finally {
      setFinalizing(false);
    }
  };

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
          </div>

          <div className="relative z-10 flex flex-col gap-8">
            <div className="flex flex-col gap-6 xl:flex-row xl:items-start xl:justify-between">
              <div className="max-w-3xl">
                <h1
                  className="font-['Space_Grotesk'] text-4xl font-bold tracking-tight text-white sm:text-5xl"
                  data-testid="sessions-management-title"
                >
                  Hub de Sessões Dashboard
                </h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-white/82 sm:text-base">
                  Centro operacional para criação, acompanhamento e execução das
                  sessões de avaliação física.
                </p>
              </div>

              <button
                type="button"
                onClick={openCreatorModal}
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
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4 xl:gap-5">
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
                            label="Gestão da turma"
                            icon={ClipboardList}
                            onClick={() => void openManagementModal(session)}
                          />
                          <SessionActionButton
                            label="Lançamento de performance"
                            icon={Edit2}
                            onClick={() => {
                              void openManagementModal(session).then(() => {
                                setTimeout(() => openPerformanceModal(0), 0);
                              });
                            }}
                          />
                          <SessionActionButton
                            label="Configurar nova sessão"
                            icon={Settings}
                            onClick={openCreatorModal}
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
                          Local (Badge)
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
                                  label="Gestão da turma"
                                  icon={ClipboardList}
                                  onClick={() =>
                                    void openManagementModal(session)
                                  }
                                />
                                <SessionActionButton
                                  label="Lançamento de performance"
                                  icon={Edit2}
                                  onClick={() => {
                                    void openManagementModal(session).then(
                                      () => {
                                        setTimeout(
                                          () => openPerformanceModal(0),
                                          0,
                                        );
                                      },
                                    );
                                  }}
                                />
                                <SessionActionButton
                                  label="Configurar nova sessão"
                                  icon={Settings}
                                  onClick={openCreatorModal}
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

      <AppModal
        open={creatorOpen}
        zIndex={60}
        onOverlayClick={closeCreatorModal}
      >
        <section className="w-full max-w-[860px] overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h2 className="font-['Space_Grotesk'] text-3xl font-bold text-slate-900">
              Configurar Nova Sessão
            </h2>
            <button
              type="button"
              onClick={closeCreatorModal}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <AppIcon icon={X} size="sm" decorative />
            </button>
          </header>

          <div className="space-y-6 px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Local
                </span>
                <select
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  value={creatorState.locationId}
                  onChange={(event) =>
                    handleCreatorField("locationId", event.target.value)
                  }
                >
                  <option value="">Selecione o local</option>
                  {locations.map((location) => (
                    <option key={location.id} value={location.id}>
                      {location.name}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-slate-500">
                  Capacidade Min/Max: 8 /{" "}
                  {selectedLocation?.max_capacity ?? "--"}
                </p>
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Aplicador/Coordenador
                </span>
                <select
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                  value={creatorState.coordinatorId}
                  onChange={(event) =>
                    handleCreatorField("coordinatorId", event.target.value)
                  }
                >
                  <option value="">
                    {loadingCoordinators
                      ? "Carregando coordenadores..."
                      : "Selecione um coordenador"}
                  </option>
                  {coordinators.map((coordinator) => (
                    <option key={coordinator.id} value={coordinator.id}>
                      {coordinator.full_name ??
                        coordinator.war_name ??
                        coordinator.id}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Turno
                </span>
                <div className="grid grid-cols-2 rounded-xl border border-slate-300 bg-slate-50 p-1">
                  <button
                    type="button"
                    onClick={() => handleCreatorField("period", "manha")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      creatorState.period === "manha"
                        ? "bg-[var(--sessions-hero-accent)] text-white"
                        : "text-slate-700"
                    }`}
                  >
                    Manhã
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreatorField("period", "tarde")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      creatorState.period === "tarde"
                        ? "bg-[var(--sessions-hero-accent)] text-white"
                        : "text-slate-700"
                    }`}
                  >
                    Tarde
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Tipo de Avaliação
                </span>
                <div className="flex h-11 items-center gap-3 rounded-xl border border-slate-300 px-3">
                  <button
                    type="button"
                    onClick={() => handleCreatorField("withIndexes", true)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      creatorState.withIndexes
                        ? "bg-primary/10 text-primary"
                        : "text-slate-500"
                    }`}
                  >
                    Com Índices
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreatorField("withIndexes", false)}
                    className={`rounded-full px-3 py-1 text-xs font-semibold ${
                      !creatorState.withIndexes
                        ? "bg-primary/10 text-primary"
                        : "text-slate-500"
                    }`}
                  >
                    Sem Índices
                  </button>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-slate-700">
                  Data inicial
                </span>
                <input
                  type="date"
                  value={creatorState.date}
                  onChange={(event) =>
                    handleCreatorField("date", event.target.value)
                  }
                  className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm"
                />
              </label>

              <div className="flex flex-wrap gap-2">
                {[
                  { value: "single", label: "Dia Único" },
                  { value: "week", label: "Semana" },
                  { value: "biweekly", label: "Quinzena" },
                  { value: "month", label: "Mês" },
                ].map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      handleCreatorField(
                        "recurrence",
                        option.value as RecurrenceOption,
                      )
                    }
                    className={`rounded-full border px-3 py-1 text-xs font-semibold ${
                      creatorState.recurrence === option.value
                        ? "border-primary/30 bg-primary/10 text-primary"
                        : "border-slate-300 text-slate-600"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={closeCreatorModal}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleCreateSessions()}
              disabled={submittingCreator}
              className="rounded-xl bg-[var(--sessions-hero)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submittingCreator ? "Gerando..." : "Gerar Sessões"}
            </button>
          </footer>
        </section>
      </AppModal>

      <AppModal
        open={managementOpen}
        zIndex={65}
        onOverlayClick={() => {
          if (!performanceOpen && !finalizeOpen) {
            setManagementOpen(false);
            setManagementState(null);
          }
        }}
      >
        <section className="w-full max-w-4xl overflow-hidden rounded-[24px] border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-slate-200 px-6 py-5">
            <div>
              <h2 className="font-['Space_Grotesk'] text-4xl font-bold text-slate-900">
                Gestão da Turma
              </h2>
              {managementState && (
                <div className="mt-4 flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <AppIcon icon={MapPin} size="sm" decorative />
                    Local: {getLocationLabel(managementState.session)}
                  </span>
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <AppIcon icon={Calendar} size="sm" decorative />
                    Data: {format(managementState.session.date, "dd/MM/yyyy")}
                  </span>
                  <span className="inline-flex items-center gap-2 font-semibold">
                    <AppIcon icon={Clock3} size="sm" decorative />
                    Turno: {formatSessionPeriod(managementState.session.period)}
                  </span>
                  <button
                    type="button"
                    onClick={handleGenerateAttendancePdf}
                    className="ml-auto rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                  >
                    <span className="inline-flex items-center gap-2">
                      <AppIcon icon={FileDown} size="sm" decorative />
                      Gerar PDF de Chamada
                    </span>
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setManagementOpen(false);
                setManagementState(null);
              }}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <AppIcon icon={X} size="sm" decorative />
            </button>
          </header>

          <div className="max-h-[55vh] overflow-auto px-6 py-5">
            {managementLoading ? (
              <p className="text-sm text-slate-600">
                Carregando dados da turma...
              </p>
            ) : !managementState ? (
              <p className="text-sm text-slate-600">
                Nenhum dado de turma disponível.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200 text-left text-xs font-bold uppercase tracking-[0.08em] text-slate-500">
                    <th className="py-3">Posto</th>
                    <th className="py-3">Nome</th>
                    <th className="py-3">SARAM</th>
                    <th className="py-3">Status</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {managementState.rows.map((row, index) => (
                    <tr key={row.bookingId}>
                      <td className="py-3 font-medium text-slate-700">
                        {row.rank ?? "--"}
                      </td>
                      <td className="py-3 text-slate-900">
                        {row.warName ?? row.fullName}
                      </td>
                      <td className="py-3 font-mono text-slate-600">
                        {row.saram ?? "--"}
                      </td>
                      <td className="py-3">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            row.result === "apto"
                              ? "bg-success/10 text-success"
                              : row.result === "inapto"
                                ? "bg-error/10 text-error"
                                : "bg-alert/10 text-alert"
                          }`}
                        >
                          {row.result === "apto"
                            ? "Apto"
                            : row.result === "inapto"
                              ? "Inapto"
                              : "Pendente"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          type="button"
                          onClick={() => openPerformanceModal(index)}
                          className="rounded-xl border border-slate-300 px-3 py-2 text-sm font-semibold text-slate-700"
                        >
                          <span className="inline-flex items-center gap-2">
                            <AppIcon icon={Edit2} size="sm" decorative />
                            Lançar Resultado
                          </span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          <footer className="border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={() => setFinalizeOpen(true)}
              disabled={!managementState}
              className="w-full rounded-xl bg-[var(--sessions-hero)] px-4 py-3 text-base font-semibold text-white disabled:opacity-50"
            >
              Finalizar Sessão
            </button>
          </footer>
        </section>
      </AppModal>

      <AppModal
        open={performanceOpen}
        zIndex={75}
        onOverlayClick={() => setPerformanceOpen(false)}
      >
        <section className="w-full max-w-2xl overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-2xl">
          <header className="flex items-center justify-between border-b border-slate-200 px-6 py-4">
            <h3 className="font-['Space_Grotesk'] text-3xl font-bold text-slate-900">
              Lançamento de Performance
            </h3>
            <button
              type="button"
              onClick={() => setPerformanceOpen(false)}
              className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
            >
              <AppIcon icon={X} size="sm" decorative />
            </button>
          </header>

          <div className="space-y-5 px-6 py-5">
            <p className="text-2xl font-semibold text-slate-900">
              Avaliado:{" "}
              {currentPerformanceRow?.warName ??
                currentPerformanceRow?.fullName ??
                "--"}
            </p>

            <div className="grid gap-3">
              {["flexao", "abdominal", "corrida"].map((field) => (
                <label
                  key={field}
                  className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 px-4 py-3"
                >
                  <span className="text-sm font-medium text-slate-700">
                    {field === "flexao"
                      ? "Flexão de Braço (Repetições)"
                      : field === "abdominal"
                        ? "Abdominal (Repetições)"
                        : "Corrida (Metros)"}
                  </span>
                  <input
                    type="number"
                    className="h-10 w-24 rounded-lg border border-slate-300 px-3 text-center"
                    value={
                      performanceInputs[field as keyof typeof performanceInputs]
                    }
                    onChange={(event) =>
                      setPerformanceInputs((previous) => ({
                        ...previous,
                        [field]: event.target.value,
                      }))
                    }
                  />
                </label>
              ))}
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setPerformanceDecision("apto")}
                className={`rounded-xl px-4 py-4 text-lg font-bold ${
                  performanceDecision === "apto"
                    ? "bg-success text-white"
                    : "bg-success/10 text-success"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <AppIcon icon={CheckCircle2} size="md" decorative /> APTO
                </span>
              </button>
              <button
                type="button"
                onClick={() => setPerformanceDecision("inapto")}
                className={`rounded-xl px-4 py-4 text-lg font-bold ${
                  performanceDecision === "inapto"
                    ? "bg-error text-white"
                    : "bg-error/10 text-error"
                }`}
              >
                <span className="inline-flex items-center gap-2">
                  <AppIcon icon={XCircle} size="md" decorative /> INAPTO
                </span>
              </button>
            </div>

            <div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${
                      performanceRows.length > 0
                        ? Math.round(
                            ((performanceIndex + 1) / performanceRows.length) *
                              100,
                          )
                        : 0
                    }%`,
                  }}
                />
              </div>
              <p className="mt-2 text-center text-sm text-slate-600">
                Variante{" "}
                {Math.min(performanceIndex + 1, performanceRows.length)} de{" "}
                {performanceRows.length || 1}
              </p>
            </div>
          </div>

          <footer className="flex items-center justify-between border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={() => setPerformanceOpen(false)}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void savePerformanceResult()}
              disabled={performanceSaving}
              className="rounded-xl bg-[var(--sessions-hero)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {performanceSaving ? "Salvando..." : "Salvar e Próximo"}
            </button>
          </footer>
        </section>
      </AppModal>

      <AppModal
        open={finalizeOpen}
        zIndex={80}
        onOverlayClick={() => setFinalizeOpen(false)}
      >
        <section className="w-full max-w-xl overflow-hidden rounded-[20px] border border-slate-200 bg-white shadow-2xl">
          <header className="bg-[var(--sessions-hero)] px-6 py-4 text-white">
            <h3 className="font-['Space_Grotesk'] text-3xl font-bold">
              Confirmação de Finalização
            </h3>
          </header>

          <div className="space-y-4 px-6 py-5">
            <div className="grid grid-cols-2 gap-3 rounded-xl border border-slate-200 bg-slate-50 p-4">
              <p className="text-lg font-semibold text-slate-800">
                <span className="inline-flex items-center gap-2">
                  <AppIcon icon={UserCheck} size="sm" decorative /> Avaliados:{" "}
                  {evaluatedCount}
                </span>
              </p>
              <p className="text-lg font-semibold text-slate-800">
                <span className="inline-flex items-center gap-2">
                  <AppIcon icon={Clock3} size="sm" decorative /> Pendentes:{" "}
                  {pendingCount}
                </span>
              </p>
            </div>

            <p className="text-base text-slate-700">
              Você está prestes a finalizar a sessão. O fluxo converterá
              pendentes para "Inapto" antes da geração do PDF final.
            </p>
          </div>

          <footer className="flex flex-wrap items-center justify-end gap-3 border-t border-slate-200 px-6 py-4">
            <button
              type="button"
              onClick={() => setFinalizeOpen(false)}
              className="px-2 py-2 text-sm font-semibold text-slate-600"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => setFinalizeOpen(false)}
              className="rounded-xl border border-primary/40 px-4 py-2 text-sm font-semibold text-primary"
            >
              Salvar como Rascunho
            </button>
            <button
              type="button"
              onClick={() => void handleFinalizeSession()}
              disabled={finalizing}
              className="rounded-xl bg-[var(--sessions-hero)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {finalizing ? "Finalizando..." : "Finalizar e Gerar PDF"}
            </button>
          </footer>
        </section>
      </AppModal>
    </Layout>
  );
};

export default SessionsManagement;
