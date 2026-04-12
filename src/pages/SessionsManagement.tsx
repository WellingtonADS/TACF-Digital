/**
 * @page SessionsManagement
 * @description Administração geral das sessões.
 * @path src/pages/SessionsManagement.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import CustomCalendar from "@/components/atomic/CustomCalendar";
import KpiCard, { type KpiAccent } from "@/components/atomic/KpiCard";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useLocations from "@/hooks/useLocations";
import { fetchCoordinators, type Coordinator } from "@/hooks/usePersonnel";
import { useResponsive } from "@/hooks/useResponsive";
import {
  useSessionHubSessions,
  type SessionAvailability,
} from "@/hooks/useSessions";
import {
  Calendar,
  CalendarClock,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Clock3,
  Copy,
  Edit2,
  MapPin,
  Plus,
  Printer,
  Search,
  Trash2,
  UserCheck,
  X,
  XCircle,
  type LucideIcon,
} from "@/icons";
import ReschedulingManagement from "@/pages/ReschedulingManagement";
import { cancelBooking, createSessions } from "@/services/bookings";
import {
  cancelSession,
  closeSessionWithChecklist,
  fetchSessionBookingsWithProfiles,
  fetchSessionById,
  fetchSessionClosureChecklist,
  fetchSessionForEdit,
  reopenSession,
  updateBookingResult,
  updateSession,
  type SessionClosureChecklist,
} from "@/services/sessions";
import type { BookingStatus, SessionStatus } from "@/types/database.types";
import {
  BOOKING_STATUS_BADGE_CLASSES,
  formatSessionPeriod,
  getBookingStatusLabel,
} from "@/utils/booking";
import { getAuthorizationErrorMessage } from "@/utils/getAuthorizationErrorMessage";
import { generateAttendanceListPdf } from "@/utils/pdf/generateAttendanceList";
import { generateSessionFinalReportPdf } from "@/utils/pdf/generateSessionFinalReport";
import {
  buildStructuredBookingResultPayload,
  parseStructuredBookingResultDetails,
  type StructuredBookingResultDetails,
} from "@/utils/results";
import {
  buildSessionHubPath,
  parseSessionHubTab,
  type SessionHubTab,
} from "@/utils/sessionHub";
import { getSessionClosureFailureMessage } from "@/utils/sessionClosure";
import { addDays, eachDayOfInterval, endOfMonth, format, getDay, parseISO, startOfDay, startOfMonth, startOfWeek } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type StatusFilter = "all" | SessionStatus;
type PeriodOption = "manha" | "tarde";
type RecurrenceOption = "single" | "week" | "biweekly" | "month";
type FitnessResult = "apto" | "inapto";
type CreatorModalMode = "create" | "edit" | "duplicate";
type ManagementMode = "manage" | "view";

type BookingModalRow = {
  bookingId: string;
  userId: string;
  rank: string | null;
  fullName: string;
  warName: string | null;
  saram: string | null;
  status: BookingStatus;
  result: FitnessResult | null;
  resultDetails: StructuredBookingResultDetails | null;
};

type ManagementState = {
  session: SessionAvailability;
  sessionStatus: SessionStatus;
  mode: ManagementMode;
  rows: BookingModalRow[];
  checklist: SessionClosureChecklist | null;
};

type CreatorState = {
  locationId: string;
  coordinatorId: string;
  applicatorId: string;
  minCapacity: number;
  maxCapacity: number;
  period: PeriodOption;
  withIndexes: boolean;
  date: string;
  recurrence: RecurrenceOption;
};

const INITIAL_CREATOR_STATE: CreatorState = {
  locationId: "",
  coordinatorId: "",
  applicatorId: "",
  minCapacity: 8,
  maxCapacity: 21,
  period: "manha",
  withIndexes: true,
  date: "",
  recurrence: "single",
};

const HUB_TAB_META: Array<{ tab: SessionHubTab; label: string }> = [
  { tab: "sessoes", label: "Sessões" },
  { tab: "reagendamentos", label: "Reagendamentos" },
];

const ADMIN_START = new Date();
ADMIN_START.setFullYear(ADMIN_START.getFullYear() - 2);
const ADMIN_END = new Date();
ADMIN_END.setFullYear(ADMIN_END.getFullYear() + 1);
const ADMIN_START_STR = ADMIN_START.toISOString().split("T")[0];
const ADMIN_END_STR = ADMIN_END.toISOString().split("T")[0];

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
    accent: KpiAccent;
  }
> = {
  open: {
    label: "ABERTA",
    summaryLabel: "Abertas",
    icon: CalendarClock,
    badgeClassName:
      "border-primary/20 bg-primary/10 text-primary shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    accent: "primary",
  },
  closed: {
    label: "CANCELADA",
    summaryLabel: "Canceladas",
    icon: XCircle,
    badgeClassName:
      "border-error/20 bg-error/10 text-error shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    accent: "error",
  },
  completed: {
    label: "CONCLUÍDA",
    summaryLabel: "Concluídas",
    icon: CheckCircle2,
    badgeClassName:
      "border-success/20 bg-success/10 text-success shadow-[inset_0_1px_0_rgba(255,255,255,0.4)]",
    accent: "success",
  },
};

const RESULT_BADGE_CLASSNAMES: Record<FitnessResult | "pendente", string> = {
  apto: "bg-success/10 text-success",
  inapto: "bg-error/10 text-error",
  pendente: "bg-alert/10 text-alert",
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

function isWeekend(d: Date): boolean {
  const dow = getDay(d);
  return dow === 0 || dow === 6;
}

function getRecurringDates(
  baseDate: string,
  recurrence: RecurrenceOption,
): string[] {
  if (!baseDate) return [];

  const date = new Date(`${baseDate}T12:00:00`);
  const fmt = (d: Date) => format(d, "yyyy-MM-dd");

  if (recurrence === "single") {
    return isWeekend(date) ? [] : [baseDate];
  }

  if (recurrence === "month") {
    return eachDayOfInterval({
      start: startOfMonth(date),
      end: endOfMonth(date),
    })
      .filter((d) => !isWeekend(d))
      .map(fmt);
  }

  // week: Mon–Fri of the selected date's week
  // biweekly: Mon–Fri of selected week + following week (10 working days)
  const weekMon = startOfWeek(date, { weekStartsOn: 1 });
  const end =
    recurrence === "week" ? addDays(weekMon, 4) : addDays(weekMon, 11);

  return eachDayOfInterval({ start: weekMon, end })
    .filter((d) => !isWeekend(d))
    .map(fmt);
}

function parseFitnessResult(value: unknown): FitnessResult | null {
  return parseStructuredBookingResultDetails(value)?.result_status ?? null;
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
        className="absolute inset-0 bg-text-body/30 backdrop-blur-[2px]"
        onClick={onOverlayClick}
      />
      <div className="relative flex min-h-full items-start justify-center overflow-y-auto p-4 md:items-center md:p-6">
        {children}
      </div>
    </div>,
    document.body,
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
      <div className="mb-1.5 flex items-center justify-between text-xs font-semibold text-text-muted">
        <span>{percent}%</span>
        <span>
          {occupied}/{capacity}
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-border-default">
        <div
          className="h-full rounded-full bg-primary"
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
      onClick={(event) => {
        event.stopPropagation();
        onClick();
      }}
      disabled={disabled}
      title={label}
      aria-label={label}
      className="flex h-10 w-10 items-center justify-center rounded-xl border border-border-default bg-bg-card text-text-body shadow-sm transition-transform duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:translate-y-0"
    >
      <AppIcon icon={icon} size="sm" decorative />
    </button>
  );
}

export const SessionsManagement = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isMobile, isTablet } = useResponsive();
  const { sessions, loading, error, refresh } = useSessionHubSessions(
    ADMIN_START_STR,
    ADMIN_END_STR,
  );
  const { locations, fetch: fetchLocations } = useLocations();

  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [creatorOpen, setCreatorOpen] = useState(false);
  const [creatorMode, setCreatorMode] = useState<CreatorModalMode>("create");
  const [creatorEditingSessionId, setCreatorEditingSessionId] = useState<
    string | null
  >(null);
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
  const performancePrimaryInputRef = useRef<HTMLInputElement | null>(null);
  const [creatorCalendarMonth, setCreatorCalendarMonth] = useState(() =>
    startOfMonth(new Date()),
  );

  const [finalizeOpen, setFinalizeOpen] = useState(false);
  const [finalizing, setFinalizing] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<SessionAvailability | null>(
    null,
  );
  const [cancellingSession, setCancellingSession] = useState(false);
  const [reopeningSessionId, setReopeningSessionId] = useState<string | null>(
    null,
  );

  const isCompactViewport = isMobile || isTablet;
  const pageSize = 10;
  const activeTab = parseSessionHubTab(searchParams.get("tab"));
  const todayTs = useMemo(() => startOfDay(new Date()).getTime(), []);

  const selectedLocation = useMemo(
    () => locations.find((location) => location.id === creatorState.locationId),
    [locations, creatorState.locationId],
  );

  const evaluatedCount = useMemo(
    () =>
      (managementState?.rows ?? []).filter(
        (row) => row.status === "agendado" && row.result !== null,
      ).length,
    [managementState],
  );

  const pendingCount = useMemo(
    () =>
      (managementState?.rows ?? []).filter(
        (row) => row.status === "agendado" && row.result === null,
      ).length,
    [managementState],
  );

  const performanceRows = useMemo(
    () =>
      (managementState?.rows ?? []).filter((row) => row.status === "agendado"),
    [managementState],
  );

  const currentPerformanceRow = performanceRows[performanceIndex] ?? null;

  const selectedCreatorDate = creatorState.date
    ? parseISO(creatorState.date)
    : null;

  // All dates that will be created for the selected recurrence (excludes the base date for range modes to avoid double-highlight)
  const creatorPreviewDates = useMemo<string[]>(() => {
    if (!creatorState.date || creatorState.recurrence === "single") return [];
    const all = getRecurringDates(creatorState.date, creatorState.recurrence);
    return all.filter((d) => d !== creatorState.date);
  }, [creatorState.date, creatorState.recurrence]);

  const creatorTotalDates = useMemo<string[]>(() => {
    if (!creatorState.date) return [];
    return getRecurringDates(creatorState.date, creatorState.recurrence);
  }, [creatorState.date, creatorState.recurrence]);

  const resolveCreatorCalendarDayState = useCallback(
    (date: Date, context: { isCurrentMonth: boolean }) => {
      if (!context.isCurrentMonth) {
        return { disabled: true, tone: "muted" as const };
      }
      if (isWeekend(date)) {
        return { disabled: true, tone: "muted" as const };
      }
      return { tone: "default" as const };
    },
    [],
  );

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

  useEffect(() => {
    if (!selectedLocation) return;

    setCreatorState((previous) => {
      if (previous.locationId !== selectedLocation.id) {
        return previous;
      }

      return {
        ...previous,
        maxCapacity: selectedLocation.max_capacity,
        minCapacity: Math.min(
          previous.minCapacity,
          selectedLocation.max_capacity,
        ),
      };
    });
  }, [selectedLocation]);

  useEffect(() => {
    if (!performanceOpen) return;

    performancePrimaryInputRef.current?.focus();
    performancePrimaryInputRef.current?.select();
  }, [performanceOpen, performanceIndex]);

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

  const closeCreatorModal = () => {
    setCreatorOpen(false);
    setCreatorMode("create");
    setCreatorEditingSessionId(null);
    setCreatorState(INITIAL_CREATOR_STATE);
  };

  const openCreatorModal = () => {
    setCreatorCalendarMonth(startOfMonth(new Date()));
    setCreatorMode("create");
    setCreatorEditingSessionId(null);
    setCreatorState(INITIAL_CREATOR_STATE);
    setCreatorOpen(true);
  };

  const openEditSessionModal = async (
    session: SessionAvailability,
    mode: CreatorModalMode = "edit",
  ) => {
    if (mode === "edit" && getSessionStatus(session) !== "open") {
      toast.error("Apenas turmas abertas podem ser editadas.");
      return;
    }

    setCreatorMode(mode);
    setCreatorEditingSessionId(mode === "edit" ? session.session_id : null);

    try {
      const { session: sessionForEdit } = await fetchSessionForEdit(
        session.session_id,
      );

      const primaryApplicator = sessionForEdit.applicators?.[0] ?? "";
      const locationId = sessionForEdit.location_id ?? "";
      const date = mode === "duplicate" ? "" : (sessionForEdit.date ?? "");
      const maxCapacity = sessionForEdit.max_capacity ?? 21;
      const minCapacity = sessionForEdit.capacity ?? Math.min(8, maxCapacity);
      const coordinatorId =
        sessionForEdit.coordinator_id ?? primaryApplicator ?? "";

      setCreatorState({
        locationId,
        coordinatorId,
        applicatorId: primaryApplicator,
        minCapacity,
        maxCapacity,
        period:
          sessionForEdit.period === "tarde"
            ? "tarde"
            : ("manha" as PeriodOption),
        withIndexes: true,
        date,
        recurrence: "single",
      });

      setCreatorCalendarMonth(startOfMonth(date ? parseISO(date) : new Date()));
      setCreatorOpen(true);
    } catch (requestError) {
      console.error(requestError);
      toast.error("Não foi possível carregar dados da sessão para edição.");
    }
  };

  const handleCancelSession = async () => {
    if (!cancelTarget) return;

    setCancellingSession(true);
    try {
      await cancelSession(cancelTarget.session_id);
      if (managementState?.session.session_id === cancelTarget.session_id) {
        setManagementState((previous) =>
          previous
              ? {
                  ...previous,
                  sessionStatus: "closed",
                  mode: "view",
                }
              : previous,
        );
        }
      setCancelTarget(null);
      toast.success("Sessão cancelada com sucesso.");
      await refresh();
    } catch (requestError) {
      console.error(requestError);
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível cancelar a sessão.",
      );
    } finally {
      setCancellingSession(false);
    }
  };

  const handleReopenSession = async (session: SessionAvailability) => {
    setReopeningSessionId(session.session_id);
    try {
      await reopenSession(session.session_id);
      if (managementState?.session.session_id === session.session_id) {
        setManagementState((previous) =>
          previous
            ? {
                ...previous,
                sessionStatus: "open",
                mode: "manage",
              }
            : previous,
        );
      }
      toast.success("Sessão reaberta e liberada novamente para agendamento.");
      await refresh();
    } catch (requestError) {
      console.error(requestError);
      toast.error(
        requestError instanceof Error
          ? requestError.message
          : "Não foi possível reabrir a sessão.",
      );
    } finally {
      setReopeningSessionId(null);
    }
  };

  const handlePrintFinalReport = async (session: SessionAvailability) => {
    try {
      const bookingsResponse = await fetchSessionBookingsWithProfiles(
        session.session_id,
      );
      const rows = buildManagementRows(
        bookingsResponse.bookings,
        bookingsResponse.profilesById,
      );

      generateAttendanceListPdf({
        session: {
          id: session.session_id,
          date: session.date,
          period: session.period,
          max_capacity: session.max_capacity,
        },
        bookings: rows.map((row, index) => ({
          order_number: String(index + 1).padStart(2, "0"),
          rank: row.rank,
          full_name: row.fullName,
          war_name: row.warName,
          saram: row.saram,
          status: row.status,
          attendance_confirmed: row.result !== null,
        })),
      });
    } catch (requestError) {
      console.error(requestError);
      toast.error("Não foi possível imprimir a lista de presença.");
    }
  };

  const handleCreatorField = <K extends keyof CreatorState>(
    field: K,
    value: CreatorState[K],
  ) => {
    setCreatorState((previous) => ({ ...previous, [field]: value }));
  };

  const handleCreateSessions = async () => {
    if (!creatorState.locationId || !creatorState.applicatorId) {
      toast.error("Preencha o local e o coordenador aplicador da sessão.");
      return;
    }

    if (!creatorState.date) {
      toast.error(
        creatorMode === "duplicate"
          ? "Selecione a nova data da turma duplicada."
          : "Selecione a data da sessão.",
      );
      return;
    }

    if (creatorState.minCapacity < 1 || creatorState.maxCapacity < 1) {
      toast.error("Capacidades mínima e máxima devem ser maiores que zero.");
      return;
    }

    if (creatorState.maxCapacity < creatorState.minCapacity) {
      toast.error("Capacidade máxima não pode ser menor que a mínima.");
      return;
    }

    setSubmittingCreator(true);
    try {
      if (creatorMode === "edit" && creatorEditingSessionId) {
        await updateSession(creatorEditingSessionId, {
          date: creatorState.date,
          period: creatorState.period,
          max_capacity: creatorState.maxCapacity,
          capacity: creatorState.minCapacity,
          location_id: creatorState.locationId,
          applicators: Array.from(
            new Set(
              [creatorState.applicatorId, creatorState.coordinatorId].filter(
                (personId) => personId.length > 0,
              ),
            ),
          ),
          coordinator_id:
            creatorState.coordinatorId || creatorState.applicatorId,
          metadata: {
            with_indexes: creatorState.withIndexes,
            min_capacity: creatorState.minCapacity,
            max_capacity: creatorState.maxCapacity,
            source: "hub_modal_editor",
          },
        });

        if (managementState?.session.session_id === creatorEditingSessionId) {
          setManagementState((previous) =>
            previous
              ? {
                  ...previous,
                  session: {
                    ...previous.session,
                    date: creatorState.date,
                    period: creatorState.period,
                    max_capacity: creatorState.maxCapacity,
                    location_name:
                      locations.find(
                        (location) => location.id === creatorState.locationId,
                      )?.name ?? previous.session.location_name,
                  },
                }
              : previous,
          );
        }

        toast.success("Sessão atualizada com sucesso.");
        closeCreatorModal();
        await refresh();
        return;
      }

      const dates = creatorTotalDates;
      const payload = dates.map((date) => ({
        date,
        period: creatorState.period,
        max_capacity: creatorState.maxCapacity,
        location_id: creatorState.locationId,
        applicators: Array.from(
          new Set(
            [creatorState.applicatorId, creatorState.coordinatorId].filter(
              (personId) => personId.length > 0,
            ),
          ),
        ),
        coordinator_id: creatorState.coordinatorId || creatorState.applicatorId,
        capacity: creatorState.minCapacity,
        metadata: {
          with_indexes: creatorState.withIndexes,
          min_capacity: creatorState.minCapacity,
          max_capacity: creatorState.maxCapacity,
          source: "hub_modal_creator",
        },
      }));

      await createSessions(payload);
      toast.success(
        dates.length === 1
          ? creatorMode === "duplicate"
            ? "Sessão duplicada com sucesso."
            : "Sessão criada com sucesso."
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
        status:
          booking.status === "cancelado" || booking.status === "remarcado"
            ? booking.status
            : "agendado",
        result: parseFitnessResult(booking.result_details),
        resultDetails: parseStructuredBookingResultDetails(
          booking.result_details,
        ),
      };
    });
  };

  const openManagementModal = async (session: SessionAvailability) => {
    try {
      const sessionDetails = await fetchSessionById(session.session_id);
      const sessionStatus = getSessionStatus({
        ...session,
        status: sessionDetails?.status ?? session.status,
      });
      const mode: ManagementMode =
        sessionStatus === "open" ? "manage" : "view";

      setManagementOpen(true);
      setManagementLoading(true);
      setPerformanceOpen(false);
      setFinalizeOpen(false);

      const [bookingsResponse, checklist] = await Promise.all([
        fetchSessionBookingsWithProfiles(session.session_id),
        fetchSessionClosureChecklist(session.session_id),
      ]);

      setManagementState({
        session,
        sessionStatus,
        mode,
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
    if (!managementState || performanceRows.length === 0) {
      toast.error("Não há militares para lançamento de performance.");
      return;
    }

    if (managementState.mode === "view") {
      toast.error("Sessão em consulta não permite alterar resultados.");
      return;
    }

    const nextIndex = Math.min(
      Math.max(startIndex, 0),
      performanceRows.length - 1,
    );
    const row = performanceRows[nextIndex];
    const existingDetails = row.resultDetails;

    setPerformanceIndex(nextIndex);
    setPerformanceDecision(row.result ?? "apto");
    setPerformanceInputs({
      flexao: existingDetails?.flexao ?? "",
      abdominal: existingDetails?.abdominal ?? "",
      corrida: existingDetails?.corrida ?? "",
    });
    setPerformanceOpen(true);
  };

  const openPerformanceModalByBookingId = (bookingId: string) => {
    const nextIndex = performanceRows.findIndex(
      (row) => row.bookingId === bookingId,
    );

    if (nextIndex < 0) {
      toast.error("Somente bookings ativos permitem lançamento de resultado.");
      return;
    }

    openPerformanceModal(nextIndex);
  };

  const savePerformanceResult = async () => {
    if (!managementState || !currentPerformanceRow) {
      return;
    }

    setPerformanceSaving(true);

    try {
      const payload = buildStructuredBookingResultPayload(
        performanceDecision,
        performanceInputs,
      );

      await updateBookingResult(
        currentPerformanceRow.bookingId,
        payload,
      );

      const updatedRows = managementState.rows.map((row) =>
        row.bookingId === currentPerformanceRow.bookingId
          ? {
              ...row,
              result: performanceDecision,
              resultDetails: payload,
            }
          : row,
      );

      const updatedPerformanceRows = updatedRows.filter(
        (row) => row.status === "agendado",
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
      if (nextIndex < updatedPerformanceRows.length) {
        const nextRow = updatedPerformanceRows[nextIndex];
        setPerformanceIndex(nextIndex);
        setPerformanceDecision(nextRow.result ?? "apto");
        setPerformanceInputs({
          flexao: nextRow.resultDetails?.flexao ?? "",
          abdominal: nextRow.resultDetails?.abdominal ?? "",
          corrida: nextRow.resultDetails?.corrida ?? "",
        });
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

  const handleCancelManagementBooking = async (
    row: BookingModalRow,
  ): Promise<void> => {
    if (!managementState) {
      return;
    }

    if (managementState.mode !== "manage") {
      toast.error("Sessão em consulta não permite cancelar agendamentos.");
      return;
    }

    if (row.status !== "agendado") {
      toast.error("Apenas agendamentos ativos podem ser cancelados.");
      return;
    }

    const reasonInput = window.prompt(
      `Cancelar o agendamento de ${row.warName ?? row.fullName}.\n\nInforme o motivo do cancelamento (opcional):`,
      "",
    );

    if (reasonInput === null) {
      return;
    }

    try {
      const result = await cancelBooking(row.bookingId, reasonInput.trim());

      if (!result.success) {
        throw new Error(result.error ?? "Falha ao cancelar agendamento.");
      }

      let nextChecklist: SessionClosureChecklist | null = null;

      try {
        nextChecklist = await fetchSessionClosureChecklist(
          managementState.session.session_id,
        );
      } catch {
        nextChecklist = managementState.checklist;
      }

      setManagementState((previous) =>
        previous
          ? {
              ...previous,
              rows: previous.rows.map((currentRow) =>
                currentRow.bookingId === row.bookingId
                  ? {
                      ...currentRow,
                      status: result.booking_status ?? "cancelado",
                    }
                  : currentRow,
              ),
              checklist: nextChecklist,
            }
          : previous,
      );

      const cancelledSwaps = result.cancelled_swap_requests ?? 0;
      toast.success(
        cancelledSwaps > 0
          ? `Agendamento cancelado. ${cancelledSwaps} solicitação(ões) pendente(s) de reagendamento também foram encerradas.`
          : "Agendamento cancelado com sucesso.",
      );
    } catch (error) {
      const authMessage = getAuthorizationErrorMessage(
        error,
        "cancelar agendamento",
      );
      toast.error(
        authMessage ??
          (error instanceof Error
            ? error.message
            : "Não foi possível cancelar o agendamento."),
      );
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
        (row) => row.status === "agendado" && row.result === null,
      );

      if (pendingRows.length > 0) {
        await Promise.all(
          pendingRows.map((row) =>
            updateBookingResult(
              row.bookingId,
              buildStructuredBookingResultPayload("inapto"),
            ),
          ),
        );
      }

      const finalizedRows = managementState.rows.map((row) => ({
        ...row,
        result: row.result ?? "inapto",
        resultDetails:
          row.resultDetails ?? buildStructuredBookingResultPayload("inapto"),
      }));

      await closeSessionWithChecklist(managementState.session.session_id);

      generateSessionFinalReportPdf({
        session: {
          id: managementState.session.session_id,
          date: managementState.session.date,
          period: managementState.session.period,
          max_capacity: managementState.session.max_capacity,
          location_name: getLocationLabel(managementState.session),
        },
        rows: finalizedRows.map((row, index) => ({
          order_number: String(index + 1).padStart(2, "0"),
          rank: row.rank,
          full_name: row.fullName,
          war_name: row.warName,
          saram: row.saram,
          result: row.result,
        })),
        pendingConvertedCount: pendingRows.length,
      });

      await refresh();
      setFinalizeOpen(false);
      setPerformanceOpen(false);
      setManagementOpen(false);
      setManagementState(null);
      toast.success(
        pendingRows.length > 0
          ? "Sessão finalizada. Pendências foram convertidas para inapto e o relatório técnico foi gerado."
          : "Sessão finalizada e relatório técnico PDF gerado automaticamente.",
      );
    } catch (requestError) {
      console.error(requestError);
      let nextChecklist: SessionClosureChecklist | null = null;

      try {
        nextChecklist = await fetchSessionClosureChecklist(
          managementState.session.session_id,
        );
        setManagementState((previous) =>
          previous ? { ...previous, checklist: nextChecklist } : previous,
        );
      } catch {
        // Mantém a mensagem original se a checagem não puder ser atualizada.
      }

      toast.error(
        nextChecklist
          ? getSessionClosureFailureMessage(nextChecklist)
          : "Não foi possível finalizar a sessão.",
      );
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
        className="mx-auto w-full max-w-6xl space-y-6 px-4 pb-8 sm:px-6 lg:px-0"
        data-testid="sessions-management-page"
      >
        <section className="mb-8">
          <header className="relative overflow-hidden rounded-3xl bg-primary p-5 text-white shadow-2xl shadow-primary/20 md:p-8">
            <div className="pointer-events-none absolute inset-0 opacity-10 dashboard-hero-texture" />
            <div className="relative z-10">
              <h1
                className="text-xl font-bold tracking-tight md:text-2xl lg:text-3xl"
                data-testid="sessions-management-title"
              >
                Hub de Sessões
              </h1>
              <p className="mt-2 max-w-2xl text-sm font-normal text-white/80 md:text-base">
                Centro operacional para criação, acompanhamento e execução das
                sessões de avaliação física.
              </p>
            </div>
          </header>
        </section>

        <div className="flex items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {HUB_TAB_META.map((item) => (
              <button
                key={item.tab}
                type="button"
                onClick={() => openHubTab(item.tab)}
                className={`flex shrink-0 items-center rounded-full border px-4 py-2 text-xs font-semibold transition-colors ${
                  activeTab === item.tab
                    ? "border-primary bg-primary/5 text-primary"
                    : "border-border-default text-text-muted hover:border-primary/40 hover:text-text-body"
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            onClick={openCreatorModal}
            className="flex shrink-0 items-center gap-2 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-white transition-colors hover:bg-primary/90"
          >
            <AppIcon icon={Plus} size="sm" decorative />
            Criar Nova Sessão
          </button>
        </div>

        {activeTab === "reagendamentos" && (
          <section className="rounded-2xl border border-border-default bg-bg-card p-4 shadow-sm md:p-6">
            <ReschedulingManagement embedded />
          </section>
        )}

        {activeTab !== "sessoes" ? null : (
          <>
            <div className="grid grid-cols-2 gap-4 xl:grid-cols-4 xl:gap-5">
                <KpiCard
                  label="Total"
                  value={sessions.length}
                  icon={Calendar}
                  accent="primary"
                />
                <KpiCard
                  label={STATUS_META.open.summaryLabel}
                  value={statusCounts.open}
                  icon={STATUS_META.open.icon}
                  accent={STATUS_META.open.accent}
                />
                <KpiCard
                  label={STATUS_META.closed.summaryLabel}
                  value={statusCounts.closed}
                  icon={STATUS_META.closed.icon}
                  accent={STATUS_META.closed.accent}
                />
                <KpiCard
                  label={STATUS_META.completed.summaryLabel}
                  value={statusCounts.completed}
                  icon={STATUS_META.completed.icon}
                  accent={STATUS_META.completed.accent}
                />
              </div>

            <section className="overflow-hidden rounded-2xl border border-border-default bg-bg-card shadow-sm">
              <div className="border-b border-border-default px-5 py-4 md:px-6">
                <div className="flex flex-wrap items-center gap-3">
                  <label className="relative min-w-0 flex-1">
                    <span className="sr-only">Buscar sessões</span>
                    <AppIcon
                      icon={Search}
                      size="sm"
                      className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted"
                      decorative
                    />
                    <input
                      className="h-10 w-full rounded-full border border-border-default bg-bg-card pl-9 pr-4 text-sm focus:border-primary/40 focus:outline-none focus:ring-2 focus:ring-primary/15"
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
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                          statusFilter === filter.value
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border-default bg-bg-default text-text-muted hover:border-primary/40 hover:text-text-body"
                        }`}
                      >
                        {filter.label}
                      </button>
                    ))}
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
                    className="mx-auto mb-3 text-text-muted"
                    decorative
                  />
                  <p className="text-sm text-text-muted">
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
                        className="cursor-pointer rounded-[24px] border border-border-default bg-bg-card p-5 shadow-sm"
                        onClick={() => void openManagementModal(session)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-lg font-bold text-text-body">
                              {getShortSessionId(session.session_id)}
                            </p>
                            <p className="mt-1 text-sm font-medium text-text-body">
                              {formatFullSessionDate(session.date)}
                            </p>
                            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-text-muted">
                              {formatSessionPeriod(session.period)}
                            </p>
                          </div>
                          <SessionStatusBadge status={status} />
                        </div>

                        <div className="mt-5 flex flex-wrap gap-3">
                          <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                            {getLocationLabel(session)}
                          </span>
                        </div>

                        <div className="mt-5">
                          <SessionOccupancyBar session={session} compact />
                        </div>

                        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border-default pt-4">
                          <SessionActionButton
                            label="Abrir sessão"
                            icon={ClipboardList}
                            onClick={() => void openManagementModal(session)}
                          />
                          <SessionActionButton
                            label="Editar sessão"
                            icon={Edit2}
                            disabled={status !== "open"}
                            onClick={() =>
                              void openEditSessionModal(session, "edit")
                            }
                          />
                          <SessionActionButton
                            label="Duplicar sessão"
                            icon={Copy}
                            onClick={() =>
                              void openEditSessionModal(session, "duplicate")
                            }
                          />
                          {status === "open" ? (
                            <SessionActionButton
                              label="Cancelar sessão"
                              icon={Trash2}
                              onClick={() => setCancelTarget(session)}
                            />
                          ) : status === "closed" ? (
                            <SessionActionButton
                              label="Reabrir sessão"
                              icon={CalendarClock}
                              disabled={reopeningSessionId === session.session_id}
                              onClick={() => void handleReopenSession(session)}
                            />
                          ) : null}
                          {status === "completed" && (
                            <SessionActionButton
                              label="Imprimir lista de presença"
                              icon={Printer}
                              onClick={() =>
                                void handlePrintFinalReport(session)
                              }
                            />
                          )}
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[1100px] text-left">
                    <thead>
                      <tr className="border-b border-border-default text-xs font-bold uppercase tracking-wider text-text-muted">
                        <th className="px-5 py-4 md:px-6">
                          ID
                        </th>
                        <th className="px-5 py-4 md:px-6">
                          Data
                        </th>
                        <th className="px-5 py-4 md:px-6">
                          Turno
                        </th>
                        <th className="px-5 py-4 md:px-6">
                          Local
                        </th>
                        <th className="px-5 py-4 md:px-6">
                          Ocupação
                        </th>
                        <th className="px-5 py-4 md:px-6">
                          Status
                        </th>
                        <th className="px-5 py-4 text-right md:px-6">
                          Ações
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border-default bg-bg-card/90">
                      {paginatedSessions.map((session) => {
                        const status = getSessionStatus(session);

                        return (
                          <tr
                            key={session.session_id}
                            className="cursor-pointer transition-colors hover:bg-bg-default/80"
                            onClick={() => void openManagementModal(session)}
                          >
                            <td className="px-5 py-4 md:px-6">
                              <span className="font-mono text-sm font-semibold text-text-body">
                                {getShortSessionId(session.session_id)}
                              </span>
                            </td>
                            <td className="px-5 py-4 md:px-6">
                              <span className="text-sm text-text-body">
                                {formatFullSessionDate(session.date)}
                              </span>
                            </td>
                            <td className="px-5 py-4 md:px-6">
                              <span className="text-sm text-text-body">
                                {formatSessionPeriod(session.period)}
                              </span>
                            </td>
                            <td className="px-5 py-4 md:px-6">
                              <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                                {getLocationLabel(session)}
                              </span>
                            </td>
                            <td className="px-5 py-4 md:px-6">
                              <span className="text-sm font-semibold text-text-body">
                                {session.occupied_count ?? 0}
                                <span className="font-normal text-text-muted">
                                  /{session.max_capacity ?? 0}
                                </span>
                              </span>
                            </td>
                            <td className="px-5 py-4 md:px-6">
                              <SessionStatusBadge status={status} />
                            </td>
                            <td className="px-5 py-4 md:px-6">
                              <div className="flex justify-end gap-2">
                                <SessionActionButton
                                  label="Abrir sessão"
                                  icon={ClipboardList}
                                  onClick={() =>
                                    void openManagementModal(session)
                                  }
                                />
                                <SessionActionButton
                                  label="Editar sessão"
                                  icon={Edit2}
                                  disabled={status !== "open"}
                                  onClick={() =>
                                    void openEditSessionModal(session, "edit")
                                  }
                                />
                                <SessionActionButton
                                  label="Duplicar sessão"
                                  icon={Copy}
                                  onClick={() =>
                                    void openEditSessionModal(
                                      session,
                                      "duplicate",
                                    )
                                  }
                                />
                                {status === "open" ? (
                                  <SessionActionButton
                                    label="Cancelar sessão"
                                    icon={Trash2}
                                    onClick={() => setCancelTarget(session)}
                                  />
                                ) : status === "closed" ? (
                                  <SessionActionButton
                                    label="Reabrir sessão"
                                    icon={CalendarClock}
                                    disabled={
                                      reopeningSessionId === session.session_id
                                    }
                                    onClick={() =>
                                      void handleReopenSession(session)
                                    }
                                  />
                                ) : null}
                                {status === "completed" && (
                                  <SessionActionButton
                                    label="Imprimir lista de presença"
                                    icon={Printer}
                                    onClick={() =>
                                      void handlePrintFinalReport(session)
                                    }
                                  />
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

              {!loading && !error && filteredSessions.length > pageSize && (
                <div className="flex items-center justify-between border-t border-border-default bg-bg-card/80 px-5 py-4 text-sm md:px-6">
                  <p className="text-text-muted">
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
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-default bg-bg-card text-text-body shadow-sm transition-colors hover:border-primary/25 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
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
                            ? "border-primary bg-primary text-primary-foreground"
                            : "border-border-default bg-bg-card text-text-body hover:border-primary/25 hover:text-primary"
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
                      className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-default bg-bg-card text-text-body shadow-sm transition-colors hover:border-primary/25 hover:text-primary disabled:cursor-not-allowed disabled:opacity-45"
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
        zIndex={managementOpen ? 85 : 60}
        onOverlayClick={closeCreatorModal}
      >
        <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-[860px] flex-col overflow-hidden rounded-[22px] border border-border-default bg-bg-card shadow-2xl md:max-h-[calc(100vh-3rem)]">
          <header className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <h2 className="text-xl font-bold text-text-body">
              {creatorMode === "edit"
                ? "Editar Dados da Sessão"
                : creatorMode === "duplicate"
                  ? "Duplicar Sessão"
                  : "Configurar Nova Sessão"}
            </h2>
            <button
              type="button"
              onClick={closeCreatorModal}
              className="rounded-full p-2 text-text-muted hover:bg-bg-default"
            >
              <AppIcon icon={X} size="sm" decorative />
            </button>
          </header>

          <div className="space-y-6 overflow-y-auto px-6 py-5">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-text-body">
                  Local
                </span>
                <p className="text-xs text-text-muted">
                  Esta alteração vale apenas para a sessão atual. O padrão global
                  do local é mantido em Configurações.
                </p>
                <select
                  className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm"
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
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-text-body">
                  Coordenador Aplicador
                </span>
                <p className="text-xs text-text-muted">
                  Selecione o coordenador responsável por aplicar o teste no dia
                  desta sessão.
                </p>
                <select
                  className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm"
                  value={creatorState.applicatorId}
                  onChange={(event) =>
                    setCreatorState((previous) => ({
                      ...previous,
                      applicatorId: event.target.value,
                      coordinatorId: event.target.value,
                    }))
                  }
                >
                  <option value="">
                    {loadingCoordinators
                      ? "Carregando..."
                      : "Selecione o coordenador aplicador"}
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
                <span className="text-sm font-semibold text-text-body">
                  Turno
                </span>
                <div className="grid grid-cols-2 rounded-xl border border-border-default bg-bg-default p-1">
                  <button
                    type="button"
                    onClick={() => handleCreatorField("period", "manha")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      creatorState.period === "manha"
                        ? "bg-primary text-white"
                        : "text-text-muted"
                    }`}
                  >
                    Manhã
                  </button>
                  <button
                    type="button"
                    onClick={() => handleCreatorField("period", "tarde")}
                    className={`rounded-lg px-4 py-2 text-sm font-semibold ${
                      creatorState.period === "tarde"
                        ? "bg-primary text-white"
                        : "text-text-muted"
                    }`}
                  >
                    Tarde
                  </button>
                </div>
              </div>

              {creatorMode === "create" && (
                <div className="space-y-1">
                  <span className="text-sm font-semibold text-text-body">
                    Tipo de Avaliação
                  </span>
                  <div className="flex h-11 items-center gap-3 rounded-xl border border-border-default px-3">
                    <button
                      type="button"
                      onClick={() => handleCreatorField("withIndexes", true)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        creatorState.withIndexes
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      Padrão
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCreatorField("withIndexes", false)}
                      className={`rounded-full px-3 py-1 text-xs font-semibold ${
                        !creatorState.withIndexes
                          ? "bg-primary/10 text-primary"
                          : "text-text-muted"
                      }`}
                    >
                      Especializada
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <label className="space-y-1">
                <span className="text-sm font-semibold text-text-body">
                  Capacidade Mínima
                </span>
                <input
                  type="number"
                  min={1}
                  value={creatorState.minCapacity || ""}
                  onChange={(event) =>
                    handleCreatorField(
                      "minCapacity",
                      Number(event.target.value),
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm"
                />
              </label>

              <label className="space-y-1">
                <span className="text-sm font-semibold text-text-body">
                  Capacidade Máxima
                </span>
                <input
                  type="number"
                  min={1}
                  value={creatorState.maxCapacity || ""}
                  onChange={(event) =>
                    handleCreatorField(
                      "maxCapacity",
                      Number(event.target.value),
                    )
                  }
                  className="h-11 w-full rounded-xl border border-border-default bg-bg-card px-3 text-sm"
                />
              </label>
            </div>
            <p className="text-xs text-text-muted">
              As capacidades abaixo ajustam apenas esta sessão e não alteram o
              padrão global cadastrado para o local.
            </p>

            <div className="space-y-3">
              {creatorMode !== "edit" ? (
                <div className="space-y-2">
                  <span className="text-sm font-semibold text-text-body">
                    {creatorMode === "duplicate" ? "Nova data" : "Data inicial"}
                  </span>
                  <div className="rounded-xl border border-border-default bg-bg-card p-3">
                    <CustomCalendar
                      viewDate={creatorCalendarMonth}
                      onViewDateChange={setCreatorCalendarMonth}
                      selectedDateKey={creatorState.date || null}
                      selectedDateKeys={creatorPreviewDates}
                      onSelectDate={(dateKey) => {
                        handleCreatorField("date", dateKey);
                      }}
                      resolveDayState={resolveCreatorCalendarDayState}
                      weekStartsOn={1}
                      size="compact"
                    />

                    {creatorState.recurrence === "single" ? (
                      <p className="mt-3 text-xs text-text-muted">
                        {selectedCreatorDate
                          ? `Data selecionada: ${format(selectedCreatorDate, "dd/MM/yyyy")}`
                          : "Selecione um dia útil no calendário."}
                      </p>
                    ) : (
                      <p className="mt-3 text-xs font-semibold text-primary">
                        {creatorTotalDates.length > 0
                          ? `${creatorTotalDates.length} sess${creatorTotalDates.length === 1 ? "ão" : "ões"} serão geradas (${format(parseISO(creatorTotalDates[0]), "dd/MM")} – ${format(parseISO(creatorTotalDates[creatorTotalDates.length - 1]), "dd/MM/yyyy")})`
                          : "Selecione um dia útil para definir o período."}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border-default bg-bg-default px-4 py-3 text-sm text-text-muted">
                  Data da sessão:{" "}
                  <strong>
                    {selectedCreatorDate
                      ? format(selectedCreatorDate, "dd/MM/yyyy")
                      : "--"}
                  </strong>
                </div>
              )}

              {creatorMode === "create" && (
                <div className="flex flex-wrap gap-5">
                  {[
                    { value: "single", label: "Dia Único" },
                    { value: "week", label: "Semana" },
                    { value: "biweekly", label: "Quinzena" },
                    { value: "month", label: "Mês" },
                  ].map((option) => (
                    <label
                      key={option.value}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <input
                        type="radio"
                        name="recurrence"
                        value={option.value}
                        checked={creatorState.recurrence === option.value}
                        onChange={() =>
                          handleCreatorField(
                            "recurrence",
                            option.value as RecurrenceOption,
                          )
                        }
                        className="h-4 w-4 accent-primary"
                      />
                      <span className="text-sm text-text-body">
                        {option.label}
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4">
            <button
              type="button"
              onClick={closeCreatorModal}
              className="rounded-xl border border-border-default px-4 py-2 text-sm font-semibold text-text-body"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handleCreateSessions()}
              disabled={submittingCreator}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {submittingCreator
                ? creatorMode === "edit"
                  ? "Salvando..."
                  : "Gerando..."
                : creatorMode === "edit"
                  ? "Salvar Alterações"
                  : creatorMode === "duplicate"
                    ? "Duplicar Sessão"
                    : "Gerar Sessões"}
            </button>
          </footer>
        </section>
      </AppModal>

      <AppModal
        open={managementOpen}
        zIndex={65}
        onOverlayClick={() => {
          if (!performanceOpen && !finalizeOpen && !creatorOpen) {
            setManagementOpen(false);
            setManagementState(null);
          }
        }}
      >
        <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-4xl flex-col overflow-hidden rounded-[24px] border border-border-default bg-bg-card shadow-2xl md:max-h-[calc(100vh-3rem)]">
          <header className="flex items-center justify-between gap-4 border-b border-border-default px-6 py-5">
            <div className="min-w-0 flex-1">
              <h2 className="text-2xl font-bold text-text-body">
                {managementState?.mode === "view"
                  ? "Consulta da Sessão"
                  : "Operação da Sessão"}
              </h2>
              {managementState && (
                <div className="mt-2 flex flex-wrap items-center gap-4 rounded-xl border border-border-default bg-bg-default px-4 py-2.5">
                  <span className="inline-flex items-center gap-1.5 text-sm text-text-body">
                    <AppIcon icon={MapPin} size="sm" decorative />
                    <span className="text-text-muted">Local:</span>{" "}
                    <strong>{getLocationLabel(managementState.session)}</strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-text-body">
                    <AppIcon icon={Calendar} size="sm" decorative />
                    <span className="text-text-muted">Data:</span>{" "}
                    <strong>
                      {format(
                        parseISO(managementState.session.date),
                        "d 'de' MMMM 'de' yyyy",
                        { locale: ptBR },
                      )}
                    </strong>
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sm text-text-body">
                    <AppIcon icon={Clock3} size="sm" decorative />
                    <span className="text-text-muted">Turno:</span>{" "}
                    <strong>
                      {formatSessionPeriod(managementState.session.period)}
                    </strong>
                  </span>
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => {
                setManagementOpen(false);
                setManagementState(null);
              }}
              className="shrink-0 rounded-full p-2 text-text-muted hover:bg-bg-default"
            >
              <AppIcon icon={X} size="sm" decorative />
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
            {managementLoading ? (
              <p className="text-sm text-text-muted">
                Carregando dados da turma...
              </p>
            ) : !managementState ? (
              <p className="text-sm text-text-muted">
                Nenhum dado de turma disponível.
              </p>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border-default text-left text-xs font-bold uppercase tracking-[0.08em] text-text-muted">
                    <th className="py-3">Posto</th>
                    <th className="py-3">Nome</th>
                    <th className="py-3">SARAM</th>
                    <th className="py-3">Booking</th>
                    <th className="py-3">Resultado</th>
                    <th className="py-3 text-right">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {managementState.rows.map((row) => {
                    const canOperateBooking =
                      managementState.mode === "manage" &&
                      row.status === "agendado";

                    return (
                      <tr key={row.bookingId}>
                        <td className="py-3 font-medium text-text-body">
                          {row.rank ?? "--"}
                        </td>
                        <td className="py-3 text-text-body">
                          {row.warName ?? row.fullName}
                        </td>
                        <td className="py-3 font-mono text-text-muted">
                          {row.saram ?? "--"}
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${BOOKING_STATUS_BADGE_CLASSES[row.status]}`}
                          >
                            {getBookingStatusLabel(row.status)}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                              RESULT_BADGE_CLASSNAMES[row.result ?? "pendente"]
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
                          <div className="flex items-center justify-end gap-2">
                            {canOperateBooking ? (
                              <>
                                {row.result === null ? (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPerformanceModalByBookingId(
                                        row.bookingId,
                                      )
                                    }
                                    className="rounded-xl border border-border-default px-3 py-2 text-sm font-semibold text-text-body hover:bg-bg-default"
                                  >
                                    <span className="inline-flex items-center gap-2">
                                      <AppIcon
                                        icon={ClipboardList}
                                        size="sm"
                                        decorative
                                      />
                                      Lançar Resultado
                                    </span>
                                  </button>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() =>
                                      openPerformanceModalByBookingId(
                                        row.bookingId,
                                      )
                                    }
                                    title="Editar resultado"
                                    className="flex h-9 w-9 items-center justify-center rounded-xl border border-border-default text-text-muted hover:bg-bg-default"
                                  >
                                    <AppIcon
                                      icon={ClipboardList}
                                      size="sm"
                                      decorative
                                    />
                                  </button>
                                )}
                                <button
                                  type="button"
                                  onClick={() =>
                                    void handleCancelManagementBooking(row)
                                  }
                                  className="rounded-xl border border-error/30 bg-error/5 px-3 py-2 text-sm font-semibold text-error hover:bg-error/10"
                                >
                                  Cancelar
                                </button>
                              </>
                            ) : (
                              <span className="text-xs font-medium text-text-muted">
                                {managementState.mode === "view"
                                  ? "Consulta somente leitura"
                                  : row.status === "cancelado"
                                  ? "Cancelado administrativamente"
                                  : "Agendamento histórico remarcado"}
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border-default px-6 py-4">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  if (managementState) {
                    void openEditSessionModal(managementState.session, "edit");
                  }
                }}
                disabled={managementState?.sessionStatus !== "open"}
                className="rounded-xl border border-border-default px-4 py-2.5 text-sm font-semibold text-text-body hover:bg-bg-default disabled:cursor-not-allowed disabled:opacity-50"
              >
                Editar Sessão
              </button>
              <button
                type="button"
                onClick={handleGenerateAttendancePdf}
                className="rounded-xl border border-border-default px-4 py-2.5 text-sm font-semibold text-text-body hover:bg-bg-default"
              >
                Gerar PDF de Chamada
              </button>
            </div>
            <button
              type="button"
              onClick={() => setFinalizeOpen(true)}
              disabled={!managementState || managementState.mode !== "manage"}
              className="rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
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
        <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-2xl flex-col overflow-hidden rounded-[20px] border border-border-default bg-bg-card shadow-2xl md:max-h-[calc(100vh-3rem)]">
          <header className="flex items-center justify-between border-b border-border-default px-6 py-4">
            <h3 className="text-xl font-bold text-text-body">
              Lançamento de Índices e Resultado
            </h3>
            <button
              type="button"
              onClick={() => setPerformanceOpen(false)}
              className="rounded-full p-2 text-text-muted hover:bg-bg-default"
            >
              <AppIcon icon={X} size="sm" decorative />
            </button>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <p className="text-base font-medium text-text-body">
              Avaliado:{" "}
              <strong>
                {currentPerformanceRow?.warName ??
                  currentPerformanceRow?.fullName ??
                  "--"}
              </strong>
            </p>

            <div className="space-y-3">
              {[
                { key: "flexao", label: "Flexão de Braço (Repetições):" },
                { key: "abdominal", label: "Abdominal (Repetições):" },
                { key: "corrida", label: "Corrida (Metros):" },
              ].map(({ key, label }) => (
                <div key={key} className="flex items-center gap-3">
                  <span className="flex-1 text-sm text-text-body">{label}</span>
                  <span className="text-base font-bold text-text-muted">[</span>
                  <input
                    type="number"
                    ref={key === "flexao" ? performancePrimaryInputRef : null}
                    className="h-10 w-24 rounded-lg border border-border-default bg-bg-card px-3 text-center text-sm"
                    value={
                      performanceInputs[key as keyof typeof performanceInputs]
                    }
                    onChange={(event) =>
                      setPerformanceInputs((previous) => ({
                        ...previous,
                        [key]: event.target.value,
                      }))
                    }
                  />
                  <span className="text-base font-bold text-text-muted">]</span>
                </div>
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
              <div className="h-2 overflow-hidden rounded-full bg-border-default">
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
              <p className="mt-2 text-center text-sm text-text-muted">
                Avaliado{" "}
                {Math.min(performanceIndex + 1, performanceRows.length)} de{" "}
                {performanceRows.length || 1}
              </p>
            </div>
          </div>

          <footer className="flex items-center justify-between border-t border-border-default px-6 py-4">
            <button
              type="button"
              onClick={() => setPerformanceOpen(false)}
              className="rounded-xl border border-border-default px-4 py-2 text-sm font-semibold text-text-body"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void savePerformanceResult()}
              disabled={performanceSaving}
              className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
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
        <section className="flex max-h-[calc(100vh-2rem)] w-full max-w-xl flex-col overflow-hidden rounded-[20px] border border-border-default bg-bg-card shadow-2xl md:max-h-[calc(100vh-3rem)]">
          <header className="bg-primary px-6 py-4 text-white">
            <h3 className="text-xl font-bold">Confirmação de Finalização</h3>
          </header>

          <div className="min-h-0 flex-1 space-y-4 overflow-y-auto px-6 py-5">
            <div className="grid grid-cols-2 divide-x divide-border-default rounded-xl border border-border-default">
              <div className="flex items-center gap-3 px-5 py-4">
                <AppIcon
                  icon={UserCheck}
                  size="md"
                  className="text-primary"
                  decorative
                />
                <div>
                  <p className="text-xs text-text-muted">Avaliados:</p>
                  <p className="text-2xl font-bold text-text-body">
                    {evaluatedCount}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 px-5 py-4">
                <AppIcon
                  icon={Clock3}
                  size="md"
                  className="text-text-muted"
                  decorative
                />
                <div>
                  <p className="text-xs text-text-muted">Pendentes:</p>
                  <p className="text-2xl font-bold text-text-body">
                    {pendingCount}
                  </p>
                </div>
              </div>
            </div>

            <p className="text-sm text-text-body">
              Você está prestes a finalizar a sessão. Pendências sem lançamento
              serão convertidas automaticamente para inapto.
            </p>
          </div>

          <footer className="flex flex-wrap items-start justify-end gap-3 border-t border-border-default px-6 py-4">
            <button
              type="button"
              onClick={() => setFinalizeOpen(false)}
              className="px-2 py-2 text-sm font-semibold text-text-muted"
            >
              Cancelar
            </button>
            <div className="flex flex-col items-end gap-1">
              <button
                type="button"
                onClick={() => void handleFinalizeSession()}
                disabled={finalizing}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {finalizing ? "Finalizando..." : "Finalizar e Gerar PDF"}
              </button>
              <p className="text-[11px] text-text-muted">
                Atenção: avaliações pendentes serão convertidas para inapto.
              </p>
            </div>
          </footer>
        </section>
      </AppModal>

      <AppModal
        open={Boolean(cancelTarget)}
        zIndex={95}
        onOverlayClick={() => {
          if (!cancellingSession) {
            setCancelTarget(null);
          }
        }}
      >
        <section className="flex w-full max-w-lg flex-col overflow-hidden rounded-[20px] border border-border-default bg-bg-card shadow-2xl">
          <header className="border-b border-border-default px-6 py-4">
            <h3 className="text-2xl font-bold text-text-body">
              Confirmar cancelamento
            </h3>
          </header>

          <div className="space-y-3 px-6 py-5">
            <p className="text-sm text-text-body">
              Você tem certeza que deseja cancelar esta sessão?
            </p>
            {cancelTarget && (
              <div className="rounded-xl border border-error/20 bg-error/10 px-4 py-3 text-sm text-error">
                <p className="font-semibold">
                  {getShortSessionId(cancelTarget.session_id)} -{" "}
                  {formatFullSessionDate(cancelTarget.date)} (
                  {formatSessionPeriod(cancelTarget.period)})
                </p>
                {(cancelTarget.occupied_count ?? 0) > 0 && (
                  <p className="mt-1">
                    Atenção: existem {cancelTarget.occupied_count} militar(es)
                    agendado(s) nesta sessão.
                  </p>
                )}
              </div>
            )}
            <p className="text-xs text-text-muted">
              Esta ação atualiza o status da sessão para cancelada e ela deixa
              de aparecer como disponível para novos agendamentos.
            </p>
          </div>

          <footer className="flex items-center justify-end gap-3 border-t border-border-default px-6 py-4">
            <button
              type="button"
              onClick={() => setCancelTarget(null)}
              disabled={cancellingSession}
              className="rounded-xl border border-border-default px-4 py-2 text-sm font-semibold text-text-body disabled:opacity-50"
            >
              Voltar
            </button>
            <button
              type="button"
              onClick={() => void handleCancelSession()}
              disabled={cancellingSession}
              className="rounded-xl bg-error px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {cancellingSession ? "Cancelando..." : "Confirmar cancelamento"}
            </button>
          </footer>
        </section>
      </AppModal>
    </Layout>
  );
};

export default SessionsManagement;
