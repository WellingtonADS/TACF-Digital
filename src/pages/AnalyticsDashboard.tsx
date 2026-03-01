import useAuth from "@/hooks/useAuth";
import Layout from "@/layout/Layout";
import supabase from "@/services/supabase";
import type { Database } from "@/types/database.types";
import {
  addDays,
  addYears,
  endOfYear,
  format,
  isBefore,
  startOfYear,
} from "date-fns";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Download,
  Filter,
  LineChart,
  Search,
  ShieldAlert,
  TrendingUp,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type ProfileRow = Pick<
  Database["public"]["Tables"]["profiles"]["Row"],
  "id" | "full_name" | "saram" | "sector" | "active"
>;

type BookingRow = Pick<
  Database["public"]["Tables"]["bookings"]["Row"],
  "id" | "user_id" | "score" | "test_date" | "created_at" | "status"
>;

type UnitMetric = {
  unit: string;
  total: number;
  apt: number;
  percent: number;
};

type TrendPoint = {
  key: string;
  label: string;
  percent: number;
};

type PendingRow = {
  id: string;
  priority: "ALTA" | "MÉDIA" | "BAIXA";
  militaryName: string;
  identity: string;
  unit: string;
  expiration: string;
  status: "Expirado" | "Pendente" | "Agendado";
};

const APT_SCORE_THRESHOLD = 6;
function getReferenceDate(booking: BookingRow) {
  return booking.test_date ?? booking.created_at ?? null;
}

function clampPercent(value: number) {
  if (!Number.isFinite(value)) return 0;
  return Math.max(0, Math.min(100, value));
}

function priorityOrder(priority: PendingRow["priority"]) {
  if (priority === "ALTA") return 0;
  if (priority === "MÉDIA") return 1;
  return 2;
}

export default function AnalyticsDashboard() {
  const { profile, loading: authLoading } = useAuth();
  const canManage =
    profile?.role === "admin" || profile?.role === "coordinator";

  const yearStart = format(startOfYear(new Date()), "yyyy-MM-dd");
  const yearEnd = format(endOfYear(new Date()), "yyyy-MM-dd");

  const [fromDate, setFromDate] = useState<string>(yearStart);
  const [toDate, setToDate] = useState<string>(yearEnd);
  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [bookings, setBookings] = useState<BookingRow[]>([]);
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
        ] = await Promise.all([
          supabase
            .from("profiles")
            .select("id, full_name, saram, sector, active"),
          supabase
            .from("bookings")
            .select("id, user_id, score, test_date, created_at, status")
            .eq("status", "confirmed")
            .gte("created_at", fromTs)
            .lte("created_at", toTs),
        ]);

        if (profileError) throw profileError;
        if (bookingError) throw bookingError;

        setProfiles((profileData ?? []) as ProfileRow[]);
        setBookings((bookingData ?? []) as BookingRow[]);
      } catch (error) {
        console.error(error);
        setProfiles([]);
        setBookings([]);
        toast.error("Não foi possível carregar os dados analíticos.");
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [fromDate, toDate, canManage]);

  const scoredBookings = useMemo(
    () => bookings.filter((booking) => booking.score !== null),
    [bookings],
  );

  const aptCount = useMemo(
    () =>
      scoredBookings.filter(
        (booking) => (booking.score ?? 0) >= APT_SCORE_THRESHOLD,
      ).length,
    [scoredBookings],
  );

  const totalEvaluations = bookings.length;
  const averageScore = useMemo(() => {
    if (scoredBookings.length === 0) return 0;
    const total = scoredBookings.reduce(
      (sum, booking) => sum + Number(booking.score ?? 0),
      0,
    );
    return total / scoredBookings.length;
  }, [scoredBookings]);

  const fitnessIndexPercent = useMemo(() => {
    if (scoredBookings.length === 0) return 0;
    return clampPercent((aptCount / scoredBookings.length) * 100);
  }, [aptCount, scoredBookings]);

  const criticalInaptCount = useMemo(
    () =>
      scoredBookings.filter(
        (booking) => Number(booking.score ?? 0) < APT_SCORE_THRESHOLD,
      ).length,
    [scoredBookings],
  );

  const latestByUser = useMemo(() => {
    const map = new Map<string, BookingRow>();
    for (const booking of bookings) {
      const current = map.get(booking.user_id);
      const bookingDate = getReferenceDate(booking);
      const currentDate = current ? getReferenceDate(current) : null;

      if (!current) {
        map.set(booking.user_id, booking);
        continue;
      }

      if (bookingDate && (!currentDate || bookingDate > currentDate)) {
        map.set(booking.user_id, booking);
      }
    }
    return map;
  }, [bookings]);

  const units = useMemo<UnitMetric[]>(() => {
    const map = new Map<string, { total: number; apt: number }>();

    profiles.forEach((item) => {
      if (!item.active) return;

      const booking = latestByUser.get(item.id);
      if (!booking || booking.score === null) return;

      const unit = item.sector?.trim() || "Não informado";
      const current = map.get(unit) ?? { total: 0, apt: 0 };
      current.total += 1;
      if (Number(booking.score) >= APT_SCORE_THRESHOLD) current.apt += 1;
      map.set(unit, current);
    });

    return Array.from(map.entries())
      .map(([unit, metric]) => ({
        unit,
        total: metric.total,
        apt: metric.apt,
        percent: clampPercent((metric.apt / metric.total) * 100),
      }))
      .sort((a, b) => b.percent - a.percent)
      .slice(0, 6);
  }, [profiles, latestByUser]);

  const trend = useMemo<TrendPoint[]>(() => {
    const start = new Date(`${fromDate}T00:00:00`);
    const end = new Date(`${toDate}T23:59:59`);
    const monthKeys: string[] = [];
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);

    while (isBefore(cursor, addDays(end, 1))) {
      monthKeys.push(format(cursor, "yyyy-MM"));
      cursor.setMonth(cursor.getMonth() + 1);
    }

    const bucket = new Map<string, { total: number; apt: number }>();
    monthKeys.forEach((key) => bucket.set(key, { total: 0, apt: 0 }));

    scoredBookings.forEach((booking) => {
      const ref = getReferenceDate(booking);
      if (!ref) return;
      const key = format(new Date(ref), "yyyy-MM");
      const current = bucket.get(key);
      if (!current) return;
      current.total += 1;
      if (Number(booking.score) >= APT_SCORE_THRESHOLD) current.apt += 1;
      bucket.set(key, current);
    });

    return monthKeys.map((key) => {
      const metric = bucket.get(key) ?? { total: 0, apt: 0 };
      const percent =
        metric.total > 0 ? clampPercent((metric.apt / metric.total) * 100) : 0;
      const [year, month] = key.split("-");
      const date = new Date(Number(year), Number(month) - 1, 1);
      return {
        key,
        label: format(date, "MMM"),
        percent,
      };
    });
  }, [fromDate, toDate, scoredBookings]);

  const pendingRows = useMemo<PendingRow[]>(() => {
    const now = new Date();

    const rows = profiles
      .filter((item) => item.active)
      .map((item) => {
        const latest = latestByUser.get(item.id);
        const latestDateRaw = latest ? getReferenceDate(latest) : null;
        const latestDate = latestDateRaw ? new Date(latestDateRaw) : null;
        const expirationDate = latestDate ? addYears(latestDate, 1) : null;

        const status: PendingRow["status"] = !expirationDate
          ? "Pendente"
          : isBefore(expirationDate, now)
            ? "Expirado"
            : isBefore(expirationDate, addDays(now, 30))
              ? "Pendente"
              : "Agendado";

        const priority: PendingRow["priority"] =
          status === "Expirado"
            ? "ALTA"
            : status === "Pendente"
              ? "MÉDIA"
              : "BAIXA";

        return {
          id: item.id,
          priority,
          militaryName: item.full_name ?? "Sem nome",
          identity: item.saram ?? "--",
          unit: item.sector ?? "Não informado",
          expiration: expirationDate
            ? format(expirationDate, "dd/MM/yyyy")
            : "--",
          status,
        } satisfies PendingRow;
      })
      .sort((a, b) => {
        const priorityDiff =
          priorityOrder(a.priority) - priorityOrder(b.priority);
        if (priorityDiff !== 0) return priorityDiff;
        return a.militaryName.localeCompare(b.militaryName);
      })
      .slice(0, 12);

    return rows;
  }, [profiles, latestByUser]);

  const linePoints = useMemo(() => {
    if (trend.length === 0) return "";
    if (trend.length === 1) return `0,${200 - trend[0].percent * 2}`;

    return trend
      .map((point, index) => {
        const x = (index / (trend.length - 1)) * 500;
        const y = 200 - point.percent * 2;
        return `${x},${y}`;
      })
      .join(" ");
  }, [trend]);

  const scheduleCompletionPercent = useMemo(() => {
    if (totalEvaluations === 0) return 0;
    return clampPercent((scoredBookings.length / totalEvaluations) * 100);
  }, [scoredBookings.length, totalEvaluations]);

  const showMetrics = !loading;

  if (authLoading) {
    return (
      <Layout>
        <p className="text-sm text-slate-500">Carregando...</p>
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
                Esta área de analytics está disponível apenas para
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
      {/* header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-primary dark:text-white">
            Relatórios Consolidados
          </h2>
          <p className="text-slate-500 mt-1">
            Desempenho físico e prontidão operacional por período.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 rounded-xl px-4 py-2 text-sm">
            <CalendarDays size={14} className="text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 outline-none"
              aria-label="Data inicial"
            />
            <span className="text-slate-400">→</span>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="bg-transparent text-slate-700 dark:text-slate-300 outline-none"
              aria-label="Data final"
            />
          </div>
          <button
            type="button"
            className="inline-flex items-center gap-2 bg-primary hover:bg-slate-800 text-white px-5 py-2 rounded-xl text-sm font-bold transition-colors"
          >
            <Download size={14} />
            Exportar
          </button>
        </div>
      </header>

      {/* KPI cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between border-b-4 border-military-green/30">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Índice de Aptidão
            </p>
            <h3
              className={`text-3xl font-bold text-slate-800 dark:text-white ${loading ? "animate-pulse text-slate-400" : ""}`}
            >
              {showMetrics ? `${fitnessIndexPercent.toFixed(1)}%` : "—"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {showMetrics
                ? `${aptCount} aptos · ${scoredBookings.length} avaliados`
                : ""}
            </p>
          </div>
          <div className="w-14 h-14 bg-military-green/10 rounded-2xl flex items-center justify-center text-military-green">
            <TrendingUp size={28} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Total de Avaliações
            </p>
            <h3
              className={`text-3xl font-bold text-slate-800 dark:text-white ${loading ? "animate-pulse text-slate-400" : ""}`}
            >
              {showMetrics ? totalEvaluations : "—"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {showMetrics
                ? `${scheduleCompletionPercent.toFixed(0)}% com nota lançada`
                : ""}
            </p>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <BarChart3 size={28} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between border-b-4 border-primary/30">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">Média TAF</p>
            <h3
              className={`text-3xl font-bold text-slate-800 dark:text-white ${loading ? "animate-pulse text-slate-400" : ""}`}
            >
              {showMetrics ? averageScore.toFixed(1) : "—"}
            </h3>
            <p className="text-xs text-slate-400 mt-1">nota máxima: 10</p>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <LineChart size={28} />
          </div>
        </div>

        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between border-b-4 border-red-500/30">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Inaptidões
            </p>
            <h3
              className={`text-3xl font-bold text-red-500 ${loading ? "animate-pulse" : ""}`}
            >
              {showMetrics ? criticalInaptCount : "—"}
            </h3>
            <p className="text-xs text-red-400 mt-1 font-semibold">
              Atenção necessária
            </p>
          </div>
          <div className="w-14 h-14 bg-red-500/10 rounded-2xl flex items-center justify-center text-red-500">
            <AlertTriangle size={28} />
          </div>
        </div>
      </div>

      {/* charts */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 mb-10">
        {/* por unidade */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Desempenho por Unidade
            </h3>
            <span className="text-xs text-slate-400">% de aptidão</span>
          </div>
          <div className="space-y-4">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse space-y-1.5">
                  <div className="h-3 w-32 rounded bg-slate-100 dark:bg-slate-700" />
                  <div className="h-4 w-full rounded-full bg-slate-100 dark:bg-slate-700" />
                </div>
              ))
            ) : units.length === 0 ? (
              <p className="py-8 text-center text-sm text-slate-400">
                Sem dados de unidade no período.
              </p>
            ) : (
              units.map((unit) => (
                <div key={unit.unit}>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span className="truncate pr-4 text-slate-600 dark:text-slate-300">
                      {unit.unit}
                    </span>
                    <span className="text-slate-800 dark:text-white">
                      {unit.percent.toFixed(0)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${
                        unit.percent >= 80
                          ? "bg-military-green"
                          : unit.percent >= 60
                            ? "bg-military-gold"
                            : "bg-red-400"
                      }`}
                      style={{ width: `${unit.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* evolução mensal */}
        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 p-6 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Evolução de Aptidão
            </h3>
            <span className="text-xs text-slate-400">série mensal</span>
          </div>
          <div className="h-[200px] w-full">
            {loading ? (
              <div className="h-full w-full animate-pulse rounded-xl bg-slate-100 dark:bg-slate-700" />
            ) : trend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-400">
                Sem dados no período.
              </div>
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
                    className="text-slate-200 dark:text-slate-700"
                    strokeDasharray="4,6"
                  />
                ))}
                <line
                  x1="0"
                  y1="200"
                  x2="500"
                  y2="200"
                  stroke="currentColor"
                  strokeWidth="1"
                  className="text-slate-200 dark:text-slate-700"
                />
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
                {trend.map((point, index) => {
                  const x =
                    trend.length === 1
                      ? 250
                      : (index / (trend.length - 1)) * 500;
                  const y = 200 - point.percent * 2;
                  return (
                    <circle
                      key={point.key}
                      cx={x}
                      cy={y}
                      r="4"
                      fill="currentColor"
                      className="text-primary"
                    />
                  );
                })}
              </svg>
            )}
          </div>
          <div className="mt-3 flex justify-between text-[10px] font-bold uppercase text-slate-400">
            {trend.map((point) => (
              <span key={point.key}>{point.label}</span>
            ))}
          </div>
        </div>
      </div>

      {/* tabela de revalidação */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-100 dark:border-slate-700 overflow-hidden shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-700 px-6 py-4">
          <div className="flex items-center gap-3">
            <ShieldAlert size={16} className="text-amber-500" />
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              Revalidação Pendente
            </h3>
          </div>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Filtrar"
              className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <Filter size={14} />
            </button>
            <button
              type="button"
              aria-label="Buscar"
              className="p-2 rounded-lg text-slate-400 hover:text-primary hover:bg-primary/5 transition-colors"
            >
              <Search size={14} />
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-[10px] font-bold uppercase tracking-widest text-slate-400 border-b border-slate-100 dark:border-slate-700">
                <th className="px-6 py-3">Prioridade</th>
                <th className="px-6 py-3">Militar</th>
                <th className="px-6 py-3">Unidade</th>
                <th className="px-6 py-3">Expiração</th>
                <th className="px-6 py-3">Status</th>
                <th className="px-6 py-3 text-right">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Carregando dados…
                  </td>
                </tr>
              ) : pendingRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-10 text-center text-slate-400"
                  >
                    Nenhuma revalidação pendente.
                  </td>
                </tr>
              ) : (
                pendingRows.map((row) => {
                  const badgeClass =
                    row.priority === "ALTA"
                      ? "bg-red-100 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                      : row.priority === "MÉDIA"
                        ? "bg-amber-100 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
                        : "bg-sky-100 text-sky-600 dark:bg-sky-500/10 dark:text-sky-400";
                  const statusClass =
                    row.status === "Expirado"
                      ? "text-red-500 font-bold"
                      : row.status === "Pendente"
                        ? "text-amber-500 font-bold"
                        : "text-sky-500";
                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeClass}`}
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className="font-semibold text-slate-800 dark:text-white">
                          {row.militaryName}
                        </p>
                        <p className="text-xs text-slate-400">{row.identity}</p>
                      </td>
                      <td className="px-6 py-4 text-slate-500 dark:text-slate-400">
                        {row.unit}
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300 font-mono text-xs">
                        {row.expiration}
                      </td>
                      <td className="px-6 py-4">
                        <span className={statusClass}>{row.status}</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="text-xs font-bold text-primary hover:underline"
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
      </div>
    </Layout>
  );
}
