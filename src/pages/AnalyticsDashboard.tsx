import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import supabase from "@/services/supabase";
import type { BookingRow as DBBookingRow, Profile as DBProfile } from "@/types";
import {
  addDays,
  addYears,
  endOfMonth,
  endOfYear,
  format,
  isBefore,
  startOfMonth,
  startOfYear,
  subMonths,
} from "date-fns";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  ChevronDown,
  Download,
  FileText,
  Filter,
  LineChart,
  Search,
  ShieldAlert,
  TrendingUp,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type ProfileRow = Pick<
  DBProfile,
  "id" | "full_name" | "war_name" | "saram" | "rank" | "sector" | "active"
>;

type BookingRow = Pick<
  DBBookingRow,
  | "id"
  | "user_id"
  | "score"
  | "test_date"
  | "created_at"
  | "status"
  | "result_details"
>;

type UnitMetric = {
  unit: string;
  total: number;
  apt: number;
  inapt: number;
  pending: number;
  percent: number;
};

type TrendPoint = {
  key: string;
  label: string;
  apt: number;
  inapt: number;
  total: number;
  percent: number;
};

type PendingRow = {
  id: string;
  priority: "ALTA" | "MEDIA" | "BAIXA";
  militaryName: string;
  warName: string | null;
  identity: string;
  rank: string | null;
  unit: string;
  expiration: string;
  status: "Expirado" | "Pendente" | "Agendado";
  lastResult: "apto" | "inapto" | null;
};

type ReportTab = "overview" | "pending" | "units" | "export";
type DatePreset = "month" | "quarter" | "year" | "custom";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getReferenceDate(booking: BookingRow) {
  return booking.test_date ?? booking.created_at ?? null;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function priorityOrder(p: PendingRow["priority"]) {
  return p === "ALTA" ? 0 : p === "MEDIA" ? 1 : 2;
}

function downloadCSV(filename: string, rows: string[][], headers: string[]) {
  const esc = (v: string) => `"${v.replace(/"/g, '""')}"`;
  const lines = [
    headers.map(esc).join(","),
    ...rows.map((r) => r.map(esc).join(",")),
  ];
  const blob = new Blob(["\uFEFF" + lines.join("\r\n")], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function presetRange(preset: DatePreset): { from: string; to: string } {
  const now = new Date();
  switch (preset) {
    case "month":
      return {
        from: format(startOfMonth(now), "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    case "quarter": {
      const start = subMonths(startOfMonth(now), 2);
      return {
        from: format(start, "yyyy-MM-dd"),
        to: format(endOfMonth(now), "yyyy-MM-dd"),
      };
    }
    case "year":
      return {
        from: format(startOfYear(now), "yyyy-MM-dd"),
        to: format(endOfYear(now), "yyyy-MM-dd"),
      };
    default:
      return {
        from: format(startOfYear(now), "yyyy-MM-dd"),
        to: format(endOfYear(now), "yyyy-MM-dd"),
      };
  }
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function AnalyticsDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const canManage =
    profile?.role === "admin" || profile?.role === "coordinator";

  // Date state
  const [datePreset, setDatePreset] = useState<DatePreset>("year");
  const initialRange = presetRange("year");
  const [fromDate, setFromDate] = useState<string>(initialRange.from);
  const [toDate, setToDate] = useState<string>(initialRange.to);

  function applyPreset(preset: DatePreset) {
    setDatePreset(preset);
    if (preset !== "custom") {
      const r = presetRange(preset);
      setFromDate(r.from);
      setToDate(r.to);
    }
  }

  // UI state
  const [activeTab, setActiveTab] = useState<ReportTab>("overview");
  const [pendingQuery, setPendingQuery] = useState<string>("");
  const [filterUnit, setFilterUnit] = useState<string>("");
  const [filterRank, setFilterRank] = useState<string>("");
  const [filterStatus, setFilterStatus] = useState<string>("");
  const [showFilters, setShowFilters] = useState(false);

  // Data state
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
  const [allBookings, setAllBookings] = useState<BookingRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      if (!canManage) return;
      setLoading(true);
      try {
        const fromTs = `${fromDate}T00:00:00`;
        const toTs = `${toDate}T23:59:59`;

        const [
          { data: profileData, error: profileError },
          { data: bookingData, error: bookingError },
          { data: allBookingData, error: allBookingError },
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, war_name, saram, rank, sector, active"),
          supabase
            .from("bookings")
            .select(
              "id, user_id, score, test_date, created_at, status, result_details",
            )
            .eq("status", "confirmed")
            .gte("created_at", fromTs)
            .lte("created_at", toTs),
          supabase
            .from("bookings")
            .select(
              "id, user_id, score, test_date, created_at, status, result_details",
            )
            .eq("status", "confirmed")
            .not("result_details", "is", null)
            .order("created_at", { ascending: false }),
        ]);

        if (profileError) throw profileError;
        if (bookingError) throw bookingError;
        if (allBookingError) throw allBookingError;

        setProfiles((profileData ?? []) as ProfileRow[]);
        setBookings((bookingData ?? []) as BookingRow[]);
        setAllBookings((allBookingData ?? []) as BookingRow[]);
      } catch (error) {
        console.error(error);
        setProfiles([]);
        setBookings([]);
        setAllBookings([]);
        toast.error("Nao foi possivel carregar os dados analiticos.");
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [fromDate, toDate, canManage]);

  // Latest booking per user (all time)
  const latestByUser = useMemo(() => {
    const map = new Map<string, BookingRow>();
    for (const booking of allBookings) {
      const current = map.get(booking.user_id);
      const bookingDate = getReferenceDate(booking);
      const currentDate = current ? getReferenceDate(current) : null;
      if (
        !current ||
        (bookingDate && (!currentDate || bookingDate > currentDate))
      ) {
        map.set(booking.user_id, booking);
      }
    }
    return map;
  }, [allBookings]);

  const activeProfiles = useMemo(
    () =>
      profiles.filter(
        (p) => p.active && p.full_name?.trim() && p.saram?.trim(),
      ),
    [profiles],
  );

  // KPIs based on result_details (latest per military)
  const kpiApt = useMemo(
    () =>
      activeProfiles.filter(
        (p) => latestByUser.get(p.id)?.result_details === "apto",
      ).length,
    [activeProfiles, latestByUser],
  );
  const kpiInapt = useMemo(
    () =>
      activeProfiles.filter(
        (p) => latestByUser.get(p.id)?.result_details === "inapto",
      ).length,
    [activeProfiles, latestByUser],
  );
  const kpiEvaluated = useMemo(
    () => activeProfiles.filter((p) => latestByUser.has(p.id)).length,
    [activeProfiles, latestByUser],
  );
  const kpiNotEvaluated = useMemo(
    () => activeProfiles.filter((p) => !latestByUser.has(p.id)).length,
    [activeProfiles, latestByUser],
  );
  const fitnessPercent = useMemo(
    () => clampPercent(kpiEvaluated > 0 ? (kpiApt / kpiEvaluated) * 100 : 0),
    [kpiApt, kpiEvaluated],
  );

  // Period evaluations for trend
  const periodEvals = useMemo(
    () => bookings.filter((b) => b.result_details !== null),
    [bookings],
  );

  // Trend chart
  const trend = useMemo<TrendPoint[]>(() => {
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59`);
    const monthKeys: string[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (isBefore(cursor, addDays(end, 1))) {
      monthKeys.push(format(cursor, "yyyy-MM"));
      cursor.setMonth(cursor.getMonth() + 1);
    }
    const bucket = new Map<
      string,
      { apt: number; inapt: number; total: number }
    >();
    monthKeys.forEach((k) => bucket.set(k, { apt: 0, inapt: 0, total: 0 }));
    periodEvals.forEach((b) => {
      const ref = getReferenceDate(b);
      if (!ref) return;
      const key = format(new Date(ref), "yyyy-MM");
      const cur = bucket.get(key);
      if (!cur) return;
      cur.total += 1;
      if (b.result_details === "apto") cur.apt += 1;
      if (b.result_details === "inapto") cur.inapt += 1;
      bucket.set(key, cur);
    });
    return monthKeys.map((key) => {
      const m = bucket.get(key) ?? { apt: 0, inapt: 0, total: 0 };
      const percent = m.total > 0 ? clampPercent((m.apt / m.total) * 100) : 0;
      const [year, month] = key.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return { key, label: format(date, "MMM"), percent, ...m };
    });
  }, [fromDate, toDate, periodEvals]);

  const linePoints = useMemo(() => {
    if (trend.length === 0) return "";
    if (trend.length === 1) return `0,${200 - trend[0].percent * 2}`;
    return trend
      .map(
        (pt, i) => `${(i / (trend.length - 1)) * 500},${200 - pt.percent * 2}`,
      )
      .join(" ");
  }, [trend]);

  // Unit metrics
  const units = useMemo<UnitMetric[]>(() => {
    const map = new Map<
      string,
      { total: number; apt: number; inapt: number }
    >();
    activeProfiles.forEach((item) => {
      const booking = latestByUser.get(item.id);
      const unit = item.sector?.trim() || "--";
      const cur = map.get(unit) ?? { total: 0, apt: 0, inapt: 0 };
      cur.total += 1;
      if (booking?.result_details === "apto") cur.apt += 1;
      if (booking?.result_details === "inapto") cur.inapt += 1;
      map.set(unit, cur);
    });
    return Array.from(map.entries())
      .map(([unit, m]) => ({
        unit,
        total: m.total,
        apt: m.apt,
        inapt: m.inapt,
        pending: m.total - m.apt - m.inapt,
        percent: clampPercent(m.total > 0 ? (m.apt / m.total) * 100 : 0),
      }))
      .sort((a, b) => b.total - a.total);
  }, [activeProfiles, latestByUser]);

  // Pending rows
  const pendingRows = useMemo<PendingRow[]>(() => {
    const now = new Date();
    const q = pendingQuery.trim().toLowerCase();

    return activeProfiles
      .map((item) => {
        const latest = latestByUser.get(item.id);
        const latestDateRaw = latest
          ? (latest.test_date ?? latest.created_at ?? null)
          : null;
        const latestDate = latestDateRaw ? new Date(latestDateRaw) : null;
        const expirationDate = latestDate ? addYears(latestDate, 1) : null;

        const status: PendingRow["status"] = !expirationDate
          ? "Pendente"
          : isBefore(expirationDate, now)
            ? "Expirado"
            : isBefore(expirationDate, addDays(now, 60))
              ? "Pendente"
              : "Agendado";

        const priority: PendingRow["priority"] =
          status === "Expirado"
            ? "ALTA"
            : status === "Pendente"
              ? "MEDIA"
              : "BAIXA";

        return {
          id: item.id,
          priority,
          militaryName: item.full_name ?? "Sem nome",
          warName: item.war_name ?? null,
          identity: item.saram ?? "--",
          rank: item.rank ?? null,
          unit: item.sector?.trim() || "--",
          expiration: expirationDate
            ? format(expirationDate, "dd/MM/yyyy")
            : "--",
          status,
          lastResult:
            latest?.result_details === "apto" ||
            latest?.result_details === "inapto"
              ? (latest.result_details as "apto" | "inapto")
              : null,
        } satisfies PendingRow;
      })
      .filter((row) => row.status !== "Agendado")
      .filter(
        (row) =>
          !filterUnit ||
          row.unit.toLowerCase().includes(filterUnit.toLowerCase()),
      )
      .filter(
        (row) =>
          !filterRank ||
          (row.rank ?? "").toLowerCase().includes(filterRank.toLowerCase()),
      )
      .filter((row) => !filterStatus || row.status === filterStatus)
      .filter((row) => {
        if (!q) return true;
        return (
          (row.warName ?? row.militaryName).toLowerCase().includes(q) ||
          row.identity.toLowerCase().includes(q) ||
          row.unit.toLowerCase().includes(q)
        );
      })
      .sort((a, b) => {
        const diff = priorityOrder(a.priority) - priorityOrder(b.priority);
        return diff !== 0 ? diff : a.militaryName.localeCompare(b.militaryName);
      });
  }, [
    activeProfiles,
    latestByUser,
    pendingQuery,
    filterUnit,
    filterRank,
    filterStatus,
  ]);

  const unitOptions = useMemo(
    () =>
      [
        ...new Set(
          activeProfiles.map((p) => p.sector?.trim() || "--").filter(Boolean),
        ),
      ].sort(),
    [activeProfiles],
  );
  const rankOptions = useMemo(
    () =>
      [
        ...new Set(activeProfiles.map((p) => p.rank).filter(Boolean)),
      ].sort() as string[],
    [activeProfiles],
  );

  // CSV exports
  function exportPendingCSV() {
    const headers = [
      "Prioridade",
      "Nome de Guerra",
      "Nome Completo",
      "SARAM",
      "Graduacao",
      "Unidade",
      "Ultimo Resultado",
      "Validade",
      "Status",
    ];
    const rows = pendingRows.map((r) => [
      r.priority,
      r.warName ?? r.militaryName,
      r.militaryName,
      r.identity,
      r.rank ?? "--",
      r.unit,
      r.lastResult ?? "sem avaliacao",
      r.expiration,
      r.status,
    ]);
    downloadCSV(
      `revalidacao_pendente_${format(new Date(), "yyyy-MM-dd")}.csv`,
      rows,
      headers,
    );
    toast.success("Relatorio exportado com sucesso.");
  }

  function exportUnitsCSV() {
    const headers = [
      "Unidade",
      "Total",
      "Aptos",
      "Inaptos",
      "Pendentes",
      "% Aptidao",
    ];
    const rows = units.map((u) => [
      u.unit,
      String(u.total),
      String(u.apt),
      String(u.inapt),
      String(u.pending),
      `${u.percent.toFixed(1)}%`,
    ]);
    downloadCSV(
      `desempenho_por_unidade_${format(new Date(), "yyyy-MM-dd")}.csv`,
      rows,
      headers,
    );
    toast.success("Relatorio de unidades exportado.");
  }

  function exportFullCSV() {
    const now = new Date();
    const headers = [
      "Nome de Guerra",
      "Nome Completo",
      "SARAM",
      "Graduacao",
      "Unidade",
      "Ultimo Resultado",
      "Validade",
      "Status",
    ];
    const rows = activeProfiles.map((p) => {
      const latest = latestByUser.get(p.id);
      const latestDateRaw = latest
        ? (latest.test_date ?? latest.created_at ?? null)
        : null;
      const latestDate = latestDateRaw ? new Date(latestDateRaw) : null;
      const expiration = latestDate ? addYears(latestDate, 1) : null;
      const status = !expiration
        ? "Pendente"
        : isBefore(expiration, now)
          ? "Expirado"
          : isBefore(expiration, addDays(now, 60))
            ? "Pendente"
            : "Regular";
      return [
        p.war_name ?? p.full_name ?? "--",
        p.full_name ?? "--",
        p.saram ?? "--",
        p.rank ?? "--",
        p.sector?.trim() || "--",
        latest?.result_details ?? "sem avaliacao",
        expiration ? format(expiration, "dd/MM/yyyy") : "--",
        status,
      ];
    });
    downloadCSV(
      `efetivo_completo_${format(new Date(), "yyyy-MM-dd")}.csv`,
      rows,
      headers,
    );
    toast.success("Relatorio completo exportado.");
  }

  if (authLoading) {
    return (
      <Layout>
        <p className="text-sm text-text-muted">Carregando...</p>
      </Layout>
    );
  }

  if (!canManage) {
    return (
      <Layout>
        <div className="mx-auto mt-10 max-w-xl rounded-2xl border border-amber-300/30 bg-amber-50 p-6 text-amber-800 dark:border-amber-500/20 dark:bg-amber-500/10 dark:text-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="mt-0.5" size={20} />
            <div>
              <h1 className="text-lg font-bold">Acesso restrito</h1>
              <p className="mt-1 text-sm">
                Esta area de analytics esta disponivel apenas para
                administradores e coordenadores.
              </p>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-[1400px]">
        {/* Page header */}
        <header className="mb-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <h2 className="text-2xl font-bold text-primary">
                Relatorios Consolidados
              </h2>
              <p className="mt-1 text-sm text-text-muted">
                Desempenho fisico e prontidao operacional.
              </p>
            </div>
            <div className="grid w-full grid-cols-2 items-center gap-1.5 sm:grid-cols-4 sm:gap-2 md:flex md:w-auto md:flex-wrap">
              {(["month", "quarter", "year", "custom"] as DatePreset[]).map(
                (p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => applyPreset(p)}
                    className={`rounded-lg px-2 sm:px-3 py-1.5 text-[11px] sm:text-xs font-semibold transition-colors text-center ${
                      datePreset === p
                        ? "bg-primary text-primary-foreground"
                        : "bg-bg-card text-text-muted hover:bg-bg-card/90 dark:bg-bg-card"
                    }`}
                  >
                    <span className="sm:hidden">
                      {p === "month"
                        ? "Mês"
                        : p === "quarter"
                          ? "Trim."
                          : p === "year"
                            ? "Ano"
                            : "Custom"}
                    </span>
                    <span className="hidden sm:inline">
                      {p === "month"
                        ? "Este mes"
                        : p === "quarter"
                          ? "Trimestre"
                          : p === "year"
                            ? "Este ano"
                            : "Personalizado"}
                    </span>
                  </button>
                ),
              )}
              {datePreset === "custom" && (
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-border-default bg-bg-card px-3 py-1.5 text-xs">
                  <CalendarDays size={12} className="text-text-muted" />
                  <input
                    type="date"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                    className="bg-transparent text-text-body outline-none"
                  />
                  <span className="text-text-muted">—</span>
                  <input
                    type="date"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                    className="bg-transparent text-text-body outline-none"
                  />
                </div>
              )}
            </div>
          </div>

          {/* Tabs */}
          <div className="mt-5 grid grid-cols-2 gap-0 border-b border-border-default sm:flex sm:overflow-x-auto">
            {[
              {
                id: "overview" as ReportTab,
                label: "Visao Geral",
                icon: BarChart3,
                badge: undefined as number | undefined,
              },
              {
                id: "pending" as ReportTab,
                label: "Revalidacao Pendente",
                icon: ShieldAlert,
                badge: pendingRows.length,
              },
              {
                id: "units" as ReportTab,
                label: "Por Unidade",
                icon: Users,
                badge: undefined as number | undefined,
              },
              {
                id: "export" as ReportTab,
                label: "Exportar",
                icon: Download,
                badge: undefined as number | undefined,
              },
            ].map(({ id, label, icon: Icon, badge }) => (
              <button
                key={id}
                type="button"
                onClick={() => setActiveTab(id)}
                className={`flex w-full items-center justify-center gap-1 border-b-2 px-2 pb-3 pt-1 text-[11px] font-semibold transition-colors sm:w-auto sm:flex-shrink-0 sm:justify-start sm:gap-1.5 sm:px-4 sm:text-sm ${
                  activeTab === id
                    ? "border-primary text-primary"
                    : "border-transparent text-text-muted hover:text-text-body dark:hover:text-text-muted"
                }`}
              >
                <Icon size={13} />
                <span className="sm:hidden">
                  {id === "overview"
                    ? "Geral"
                    : id === "pending"
                      ? "Pendente"
                      : id === "units"
                        ? "Unidades"
                        : "Export"}
                </span>
                <span className="hidden sm:inline">{label}</span>
                {badge !== undefined && badge > 0 && (
                  <span className="rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                    {badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </header>

        {/* Tab: Visao Geral */}
        {activeTab === "overview" && (
          <>
            <div className="mb-8 grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <KpiCard
                label="Indice de Aptidao"
                value={loading ? null : `${fitnessPercent.toFixed(1)}%`}
                sub={
                  loading ? "" : `${kpiApt} aptos - ${kpiEvaluated} avaliados`
                }
                icon={<TrendingUp size={22} />}
                accent="success"
              />
              <KpiCard
                label="Efetivo Ativo"
                value={loading ? null : String(activeProfiles.length)}
                sub={loading ? "" : `${kpiNotEvaluated} sem avaliacao`}
                icon={<Users size={22} />}
                accent="primary"
              />
              <KpiCard
                label="Avaliacoes no Periodo"
                value={loading ? null : String(periodEvals.length)}
                sub={loading ? "" : `${bookings.length} agendamentos`}
                icon={<LineChart size={22} />}
                accent="secondary"
              />
              <KpiCard
                label="Inaptidoes Atuais"
                value={loading ? null : String(kpiInapt)}
                sub="ultimo resultado registrado"
                icon={<AlertTriangle size={22} />}
                accent="error"
              />
            </div>

            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-sm">
                <SectionTitle>Aptidao por Unidade</SectionTitle>
                <div className="mt-4 space-y-4">
                  {loading ? (
                    <Skeleton rows={4} />
                  ) : units.length === 0 ? (
                    <Empty text="Sem dados de unidade." />
                  ) : (
                    units.slice(0, 6).map((u) => (
                      <div key={u.unit}>
                        <div className="mb-1.5 flex justify-between text-xs font-semibold">
                          <span className="truncate pr-4 text-text-muted">
                            {u.unit}
                          </span>
                          <span className="text-text-body">
                            {u.percent.toFixed(0)}%{" "}
                            <span className="font-normal text-text-muted">
                              ({u.apt}/{u.total})
                            </span>
                          </span>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-bg-card">
                          <div
                            className={`h-full rounded-full transition-all duration-700 ${u.percent >= 80 ? "bg-success" : u.percent >= 60 ? "bg-military-gold" : "bg-red-400"}`}
                            style={{ width: `${u.percent}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="rounded-2xl border border-border-default bg-bg-card p-6 shadow-sm">
                <SectionTitle>Evolucao de Aptidao</SectionTitle>
                <div className="mt-4 h-[180px] w-full">
                  {loading ? (
                    <div className="h-full w-full animate-pulse rounded-xl bg-bg-card" />
                  ) : trend.length === 0 ? (
                    <Empty text="Sem dados no periodo." />
                  ) : (
                    <svg
                      className="h-full w-full"
                      viewBox="0 0 500 200"
                      preserveAspectRatio="none"
                    >
                      {[25, 50, 75].map((v) => (
                        <line
                          key={v}
                          x1="0"
                          y1={200 - v * 2}
                          x2="500"
                          y2={200 - v * 2}
                          stroke="currentColor"
                          strokeWidth="0.5"
                          className="text-text-muted"
                          strokeDasharray="4,6"
                        />
                      ))}
                      {linePoints && (
                        <polygon
                          points={`0,200 ${linePoints} 500,200`}
                          fill="currentColor"
                          className="text-primary/10"
                        />
                      )}
                      <polyline
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.5"
                        strokeLinejoin="round"
                        className="text-primary"
                        points={linePoints}
                      />
                      {trend.map((pt, i) => {
                        const x =
                          trend.length === 1
                            ? 250
                            : (i / (trend.length - 1)) * 500;
                        return (
                          <circle
                            key={pt.key}
                            cx={x}
                            cy={200 - pt.percent * 2}
                            r="4"
                            fill="currentColor"
                            className="text-primary"
                          />
                        );
                      })}
                    </svg>
                  )}
                </div>
                <div className="mt-3 flex justify-between text-[10px] font-bold uppercase text-text-muted">
                  {trend.map((pt) => (
                    <span key={pt.key}>{pt.label}</span>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {/* Tab: Revalidacao Pendente */}
        {activeTab === "pending" && (
          <div className="rounded-2xl border border-border-default bg-bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-default px-5 py-3">
              <div className="flex items-center gap-3">
                <ShieldAlert size={15} className="text-amber-500" />
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Revalidacao Pendente
                </span>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
                  {pendingRows.length}
                </span>
              </div>
              <div className="flex w-full flex-col items-stretch gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:justify-start md:w-auto md:justify-end">
                <div className="relative w-full sm:w-auto sm:min-w-[220px]">
                  <Search
                    className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-text-muted"
                    size={13}
                  />
                  <input
                    value={pendingQuery}
                    onChange={(e) => setPendingQuery(e.target.value)}
                    placeholder="Buscar nome ou SARAM..."
                    className="w-full rounded-lg border border-border-default bg-bg-card py-1.5 pl-7 pr-3 text-xs sm:w-auto"
                  />
                </div>
                <button
                  type="button"
                  onClick={() => setShowFilters((v) => !v)}
                  className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition-colors ${showFilters || filterUnit || filterRank || filterStatus ? "border-primary bg-primary/5 text-primary" : "border-border-default text-text-muted hover:border-border-default dark:text-text-muted"}`}
                >
                  <Filter size={12} />
                  Filtros
                  {(filterUnit || filterRank || filterStatus) && (
                    <span className="rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground">
                      {
                        [filterUnit, filterRank, filterStatus].filter(Boolean)
                          .length
                      }
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={exportPendingCSV}
                  className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary hover:text-primary transition-colors"
                >
                  <Download size={12} />
                  CSV
                </button>
              </div>
            </div>

            {showFilters && (
              <div className="flex flex-col items-stretch gap-3 border-b border-border-default bg-bg-card px-5 py-3 sm:flex-row sm:flex-wrap sm:items-end sm:gap-4">
                <FilterSelect
                  label="Unidade"
                  value={filterUnit}
                  onChange={setFilterUnit}
                  options={unitOptions}
                  placeholder="Todas"
                />
                <FilterSelect
                  label="Graduacao"
                  value={filterRank}
                  onChange={setFilterRank}
                  options={rankOptions}
                  placeholder="Todas"
                />
                <FilterSelect
                  label="Status"
                  value={filterStatus}
                  onChange={setFilterStatus}
                  options={["Expirado", "Pendente"]}
                  placeholder="Todos"
                />
                {(filterUnit || filterRank || filterStatus) && (
                  <button
                    type="button"
                    onClick={() => {
                      setFilterUnit("");
                      setFilterRank("");
                      setFilterStatus("");
                    }}
                    className="mb-0.5 text-xs font-semibold text-red-500 hover:underline"
                  >
                    Limpar filtros
                  </button>
                )}
              </div>
            )}

            <div className="space-y-2 px-4 py-3 md:hidden">
              {loading ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Carregando dados...
                </p>
              ) : pendingRows.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Nenhuma revalidacao pendente.
                </p>
              ) : (
                pendingRows.map((row) => {
                  const pClass =
                    row.priority === "ALTA"
                      ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                      : row.priority === "MEDIA"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400";
                  const sClass =
                    row.status === "Expirado"
                      ? "text-red-500 font-bold"
                      : "text-amber-500 font-bold";

                  return (
                    <article
                      key={row.id}
                      className="rounded-xl border border-border-default bg-bg-card p-3"
                    >
                      <div className="mb-2 flex items-center justify-between gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${pClass}`}
                        >
                          {row.priority}
                        </span>
                        <span className={`text-xs ${sClass}`}>
                          {row.status}
                        </span>
                      </div>
                      <p className="text-sm font-semibold text-text-body">
                        {row.warName ?? row.militaryName}
                      </p>
                      <p className="text-xs text-text-muted">
                        {row.rank ? `${row.rank} · ` : ""}
                        {row.identity}
                      </p>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                        <p className="text-text-muted">Unidade: {row.unit}</p>
                        <p className="text-text-muted">
                          Validade: {row.expiration}
                        </p>
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        {row.lastResult ? (
                          <span
                            className={`rounded-full px-2 py-1 text-[10px] font-bold uppercase ${row.lastResult === "apto" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"}`}
                          >
                            {row.lastResult}
                          </span>
                        ) : (
                          <span className="text-xs text-text-muted">
                            Sem resultado
                          </span>
                        )}
                        <button
                          type="button"
                          className="text-xs font-semibold text-primary hover:underline dark:text-secondary"
                        >
                          Notificar
                        </button>
                      </div>
                    </article>
                  );
                })
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-default text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {[
                      "Prioridade",
                      "Militar",
                      "Unidade",
                      "Ultimo Resultado",
                      "Validade",
                      "Status",
                      "",
                    ].map((h) => (
                      <th key={h} className="px-5 py-3">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-sm text-text-muted"
                      >
                        Carregando dados...
                      </td>
                    </tr>
                  ) : pendingRows.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="px-5 py-10 text-center text-sm text-text-muted"
                      >
                        Nenhuma revalidacao pendente.
                      </td>
                    </tr>
                  ) : (
                    pendingRows.map((row) => {
                      const pClass =
                        row.priority === "ALTA"
                          ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                          : row.priority === "MEDIA"
                            ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                            : "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400";
                      const sClass =
                        row.status === "Expirado"
                          ? "text-red-500 font-bold"
                          : "text-amber-500 font-bold";
                      const displayPriority =
                        row.priority === "MEDIA" ? "MEDIA" : row.priority;
                      return (
                        <tr
                          key={row.id}
                          className="transition-colors hover:bg-bg-card"
                        >
                          <td className="px-5 py-3.5">
                            <span
                              className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${pClass}`}
                            >
                              {displayPriority}
                            </span>
                          </td>
                          <td className="px-5 py-3.5">
                            <p className="font-semibold text-text-body">
                              {row.warName ?? row.militaryName}
                            </p>
                            <p className="text-xs text-text-muted">
                              {row.rank ? `${row.rank} · ` : ""}
                              {row.identity}
                            </p>
                          </td>
                          <td className="px-5 py-3.5 text-sm text-text-muted">
                            {row.unit}
                          </td>
                          <td className="px-5 py-3.5">
                            {row.lastResult ? (
                              <span
                                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${row.lastResult === "apto" ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300" : "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400"}`}
                              >
                                {row.lastResult}
                              </span>
                            ) : (
                              <span className="text-xs text-text-muted">—</span>
                            )}
                          </td>
                          <td className="px-5 py-3.5 font-mono text-xs text-text-muted">
                            {row.expiration}
                          </td>
                          <td className="px-5 py-3.5">
                            <span className={sClass}>{row.status}</span>
                          </td>
                          <td className="px-5 py-3.5 text-right">
                            <button
                              type="button"
                              className="text-xs font-semibold text-primary hover:underline dark:text-secondary"
                            >
                              Notificar
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            <div className="border-t border-border-default px-5 py-2 text-xs text-text-muted">
              {pendingRows.length} registro(s) exibidos
            </div>
          </div>
        )}

        {/* Tab: Por Unidade */}
        {activeTab === "units" && (
          <div className="rounded-2xl border border-border-default bg-bg-card shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border-default px-5 py-3">
              <div className="flex items-center gap-3">
                <Users size={15} className="text-primary" />
                <span className="text-xs font-bold uppercase tracking-widest text-text-muted">
                  Desempenho por Unidade
                </span>
              </div>
              <button
                type="button"
                onClick={exportUnitsCSV}
                className="flex items-center gap-1.5 rounded-lg border border-border-default px-3 py-1.5 text-xs font-semibold text-text-muted hover:border-primary hover:text-primary transition-colors"
              >
                <Download size={12} />
                CSV
              </button>
            </div>
            <div className="space-y-2 px-4 py-3 md:hidden">
              {loading ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Carregando...
                </p>
              ) : units.length === 0 ? (
                <p className="py-6 text-center text-sm text-text-muted">
                  Sem dados.
                </p>
              ) : (
                units.map((u) => (
                  <article
                    key={u.unit}
                    className="rounded-xl border border-border-default bg-bg-card p-3"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-text-body">
                        {u.unit}
                      </p>
                      <span className="text-xs font-bold text-text-muted">
                        {u.percent.toFixed(0)}%
                      </span>
                    </div>
                    <div className="grid grid-cols-4 gap-2 text-xs">
                      <p className="text-text-muted">Tot: {u.total}</p>
                      <p className="text-success">Apt: {u.apt}</p>
                      <p className="text-red-500">Inapt: {u.inapt}</p>
                      <p className="text-text-muted">Pend: {u.pending}</p>
                    </div>
                    <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-bg-card">
                      <div
                        className={`h-full rounded-full transition-all duration-700 ${u.percent >= 80 ? "bg-success" : u.percent >= 60 ? "bg-military-gold" : "bg-red-400"}`}
                        style={{ width: `${u.percent}%` }}
                      />
                    </div>
                  </article>
                ))
              )}
            </div>

            <div className="hidden overflow-x-auto md:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border-default text-[10px] font-bold uppercase tracking-widest text-text-muted">
                    {[
                      "Unidade",
                      "Total",
                      "Aptos",
                      "Inaptos",
                      "Pendentes",
                      "% Aptidao",
                    ].map((h, i) => (
                      <th
                        key={h}
                        className={`px-5 py-3 ${i > 0 && i < 5 ? "text-right" : ""}`}
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-default">
                  {loading ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-sm text-text-muted"
                      >
                        Carregando...
                      </td>
                    </tr>
                  ) : units.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-5 py-10 text-center text-sm text-text-muted"
                      >
                        Sem dados.
                      </td>
                    </tr>
                  ) : (
                    units.map((u) => (
                      <tr
                        key={u.unit}
                        className="hover:bg-bg-card transition-colors"
                      >
                        <td className="px-5 py-3.5 font-semibold text-text-body">
                          {u.unit}
                        </td>
                        <td className="px-5 py-3.5 text-right text-text-muted">
                          {u.total}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-success">
                          {u.apt}
                        </td>
                        <td className="px-5 py-3.5 text-right font-semibold text-red-500">
                          {u.inapt}
                        </td>
                        <td className="px-5 py-3.5 text-right text-text-muted">
                          {u.pending}
                        </td>
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <div className="h-2 flex-1 overflow-hidden rounded-full bg-bg-card">
                              <div
                                className={`h-full rounded-full transition-all duration-700 ${u.percent >= 80 ? "bg-success" : u.percent >= 60 ? "bg-military-gold" : "bg-red-400"}`}
                                style={{ width: `${u.percent}%` }}
                              />
                            </div>
                            <span className="w-10 text-right text-xs font-bold text-text-muted">
                              {u.percent.toFixed(0)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab: Exportar */}
        {activeTab === "export" && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <ExportCard
              title="Revalidacao Pendente"
              description={`${pendingRows.length} militares com expiracao proxima ou vencida.`}
              format="CSV"
              icon={<ShieldAlert size={20} className="text-amber-500" />}
              onExport={exportPendingCSV}
            />
            <ExportCard
              title="Desempenho por Unidade"
              description={`${units.length} unidades com resumo de aptos, inaptos e pendentes.`}
              format="CSV"
              icon={<BarChart3 size={20} className="text-primary" />}
              onExport={exportUnitsCSV}
            />
            <ExportCard
              title="Efetivo Completo"
              description={`${activeProfiles.length} militares ativos com situacao atual.`}
              format="CSV"
              icon={<FileText size={20} className="text-success" />}
              onExport={exportFullCSV}
            />
          </div>
        )}
      </div>
    </Layout>
  );
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
      {children}
    </h3>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="py-8 text-center text-sm text-text-muted">{text}</p>;
}

function Skeleton({ rows }: { rows: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="animate-pulse space-y-1.5">
          <div className="h-3 w-32 rounded bg-bg-card" />
          <div className="h-2 w-full rounded-full bg-bg-card" />
        </div>
      ))}
    </>
  );
}

type AccentColor = "primary" | "secondary" | "success" | "error";

function KpiCard({
  label,
  value,
  sub,
  icon,
  accent,
}: {
  label: string;
  value: string | null;
  sub: string;
  icon: React.ReactNode;
  accent: AccentColor;
}) {
  const borderMap: Record<AccentColor, string> = {
    primary: "border-primary/30",
    secondary: "border-secondary/30",
    success: "border-success/30",
    error: "border-red-500/30",
  };
  const bgMap: Record<AccentColor, string> = {
    primary: "bg-primary/10 text-primary",
    secondary: "bg-secondary/10 text-secondary",
    success: "bg-success/10 text-success",
    error: "bg-red-500/10 text-red-500",
  };
  return (
    <div
      className={`flex w-full flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border-b-4 bg-bg-card p-3 sm:p-5 shadow-[0_4px_20px_-8px_rgba(0,0,0,0.08)] overflow-hidden ${borderMap[accent]}`}
    >
      <div className="min-w-0 flex-1 pr-2">
        <p className="text-xs font-medium text-text-muted truncate">{label}</p>
        <p
          className={`mt-1 text-2xl sm:text-3xl font-bold text-text-body ${value === null ? "animate-pulse text-text-muted" : ""}`}
        >
          {value ?? "—"}
        </p>
        <p className="mt-0.5 text-[11px] text-text-muted truncate">{sub}</p>
      </div>
      <div
        className={`flex h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0 items-center justify-center rounded-xl ${bgMap[accent]}`}
      >
        {icon}
      </div>
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[10px] font-bold uppercase tracking-widest text-text-muted">
        {label}
      </label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="appearance-none rounded-lg border border-border-default bg-bg-card py-1.5 pl-3 pr-7 text-xs text-text-body"
        >
          <option value="">{placeholder}</option>
          {options.map((opt) => (
            <option key={opt} value={opt}>
              {opt}
            </option>
          ))}
        </select>
        <ChevronDown
          size={12}
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
        />
      </div>
    </div>
  );
}

function ExportCard({
  title,
  description,
  format,
  icon,
  onExport,
}: {
  title: string;
  description: string;
  format: string;
  icon: React.ReactNode;
  onExport: () => void;
}) {
  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border-default bg-bg-card p-6 shadow-sm">
      <div>
        <div className="mb-3 flex items-center gap-3">
          {icon}
          <h3 className="font-semibold text-text-body">{title}</h3>
        </div>
        <p className="text-sm text-text-muted">{description}</p>
      </div>
      <div className="mt-5 flex items-center justify-between">
        <span className="rounded-md bg-bg-card px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-text-muted">
          {format}
        </span>
        <button
          type="button"
          onClick={onExport}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Download size={12} />
          Baixar
        </button>
      </div>
    </div>
  );
}
