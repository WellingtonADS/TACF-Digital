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
  CheckCircle2,
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

  const radialCircumference = 2 * Math.PI * 40;
  const radialOffset =
    radialCircumference - (fitnessIndexPercent / 100) * radialCircumference;

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
      <header className="mb-8 flex flex-col gap-4 rounded-2xl border border-slate-100 bg-white p-6 shadow-lg dark:border-slate-800 dark:bg-slate-900 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 dark:text-white">
            Relatórios Consolidados
          </h1>
          <p className="mt-1 text-sm text-slate-500">
            Visão geral do desempenho físico e prontidão operacional.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-700 dark:bg-slate-800/60">
          <div className="flex items-center gap-2 border-r border-slate-200 px-3 py-2 dark:border-slate-700">
            <CalendarDays size={16} className="text-slate-400" />
            <input
              type="date"
              value={fromDate}
              onChange={(event) => setFromDate(event.target.value)}
              className="bg-transparent text-sm outline-none"
            />
            <span className="text-xs text-slate-400">até</span>
            <input
              type="date"
              value={toDate}
              onChange={(event) => setToDate(event.target.value)}
              className="bg-transparent text-sm outline-none"
            />
          </div>

          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-white"
          >
            <Download size={14} />
            Exportar
          </button>
        </div>
      </header>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <article className="rounded-2xl border-b-4 border-military-green/40 bg-white p-6 shadow-xl dark:bg-slate-900">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Índice de Aptidão Geral
              </p>
              <h3 className="mt-1 text-4xl font-extrabold text-slate-900 dark:text-white">
                {fitnessIndexPercent.toFixed(1)}%
              </h3>
              <p className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-military-green">
                <TrendingUp size={14} />
                {aptCount} aptos em {scoredBookings.length} avaliações
              </p>
            </div>

            <div className="relative h-24 w-24">
              <svg className="h-full w-full -rotate-90" viewBox="0 0 100 100">
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="8"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  className="stroke-military-green"
                  strokeWidth="8"
                  strokeLinecap="round"
                  strokeDasharray={radialCircumference}
                  strokeDashoffset={radialOffset}
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-military-green">
                <CheckCircle2 size={20} />
              </div>
            </div>
          </div>
        </article>

        <article className="rounded-2xl border-b-4 border-primary/40 bg-white p-6 shadow-xl dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Total de Avaliações
              </p>
              <h3 className="mt-1 text-4xl font-extrabold text-slate-900 dark:text-white">
                {totalEvaluations}
              </h3>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <CheckCircle2 size={18} />
            </div>
          </div>
          <p className="mt-3 text-xs text-slate-400">Período filtrado atual</p>
          <p className="mt-1 text-xs font-semibold text-primary/80">
            {scheduleCompletionPercent.toFixed(0)}% com nota lançada
          </p>
        </article>

        <article className="rounded-2xl border-b-4 border-primary/30 bg-white p-6 shadow-xl dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Média de Notas (TAF)
              </p>
              <h3 className="mt-1 text-4xl font-extrabold text-slate-900 dark:text-white">
                {averageScore.toFixed(1)}
              </h3>
            </div>
            <div className="rounded-lg bg-primary/10 p-2 text-primary">
              <BarChart3 size={18} />
            </div>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-700">
            <div
              className="h-full rounded-full bg-primary"
              style={{ width: `${clampPercent((averageScore / 10) * 100)}%` }}
            />
          </div>
        </article>

        <article className="rounded-2xl border-b-4 border-red-500/40 bg-white p-6 shadow-xl dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-500">
                Inaptidões Críticas
              </p>
              <h3 className="mt-1 text-4xl font-extrabold text-red-600">
                {criticalInaptCount}
              </h3>
            </div>
            <div className="rounded-lg bg-red-500/10 p-2 text-red-500">
              <AlertTriangle size={18} />
            </div>
          </div>
          <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-red-500/80">
            Atenção necessária
          </p>
        </article>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-8 xl:grid-cols-2">
        <article className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">
          <div className="mb-8 flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Desempenho por Unidade/Setor
            </h4>
            <button type="button" className="text-sm font-bold text-primary">
              Ver detalhes
            </button>
          </div>

          <div className="space-y-5">
            {units.length === 0 ? (
              <p className="text-sm text-slate-500">
                Sem dados de unidade para o período.
              </p>
            ) : (
              units.map((unit) => (
                <div key={unit.unit} className="space-y-2">
                  <div className="flex items-center justify-between text-sm font-semibold">
                    <span className="truncate pr-4">{unit.unit}</span>
                    <span>{unit.percent.toFixed(0)}%</span>
                  </div>
                  <div className="h-5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${unit.percent}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </article>

        <article className="rounded-2xl bg-white p-8 shadow-2xl dark:bg-slate-900">
          <div className="mb-8 flex items-center justify-between">
            <h4 className="text-lg font-bold text-slate-900 dark:text-white">
              Evolução de Aptidão
            </h4>
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <LineChart size={14} />
              Série mensal
            </div>
          </div>

          <div className="h-[250px] w-full">
            {trend.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                Sem dados no período.
              </div>
            ) : (
              <svg
                className="h-full w-full"
                viewBox="0 0 500 220"
                preserveAspectRatio="none"
              >
                <line
                  x1="0"
                  y1="200"
                  x2="500"
                  y2="200"
                  className="stroke-slate-200 dark:stroke-slate-700"
                  strokeWidth="1"
                />
                <polyline
                  fill="none"
                  stroke="currentColor"
                  className="text-primary"
                  strokeWidth="4"
                  points={linePoints}
                />
                {trend.map((point, index) => {
                  const x =
                    trend.length === 1 ? 0 : (index / (trend.length - 1)) * 500;
                  const y = 200 - point.percent * 2;
                  return (
                    <circle
                      key={point.key}
                      cx={x}
                      cy={y}
                      r={4.5}
                      className="fill-primary"
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
        </article>
      </section>

      <section className="mt-8 overflow-hidden rounded-2xl bg-white shadow-2xl dark:bg-slate-900">
        <div className="flex items-center justify-between border-b border-slate-100 p-6 dark:border-slate-700">
          <h4 className="text-lg font-bold text-slate-900 dark:text-white">
            Militares com Revalidação Pendente
          </h4>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="rounded-lg bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Filter size={14} />
            </button>
            <button
              type="button"
              className="rounded-lg bg-slate-100 p-2 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700"
            >
              <Search size={14} />
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-xs font-bold uppercase tracking-widest text-slate-500 dark:bg-slate-900/50">
                <th className="px-6 py-4">Prioridade</th>
                <th className="px-6 py-4">Militar</th>
                <th className="px-6 py-4">Unidade</th>
                <th className="px-6 py-4">Data de Expiração</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm dark:divide-slate-700">
              {loading ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Carregando dados...
                  </td>
                </tr>
              ) : pendingRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Nenhuma revalidação pendente no período.
                  </td>
                </tr>
              ) : (
                pendingRows.map((row) => {
                  const priorityClass =
                    row.priority === "ALTA"
                      ? "bg-red-500/10 text-red-600 border-red-500/20"
                      : row.priority === "MÉDIA"
                        ? "bg-amber-500/10 text-amber-600 border-amber-500/20"
                        : "bg-blue-500/10 text-blue-600 border-blue-500/20";

                  const statusClass =
                    row.status === "Expirado"
                      ? "text-red-600"
                      : row.status === "Pendente"
                        ? "text-amber-600"
                        : "text-blue-600";

                  return (
                    <tr
                      key={row.id}
                      className="hover:bg-slate-50/60 dark:hover:bg-white/5"
                    >
                      <td className="px-6 py-4">
                        <span
                          className={`rounded-full border px-2.5 py-1 text-[10px] font-bold ${priorityClass}`}
                        >
                          {row.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-white">
                            {row.militaryName}
                          </p>
                          <p className="text-xs text-slate-500">
                            ID: {row.identity}
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{row.unit}</td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                        {row.expiration}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`font-semibold ${statusClass}`}>
                          {row.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="font-bold text-primary hover:underline"
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
      </section>
    </Layout>
  );
}
