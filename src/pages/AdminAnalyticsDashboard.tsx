import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatCard } from "@/components/ui/StatCard";
import { Calendar, Hash, Users } from "@/components/ui/icons";
import type {
  AnalyticsBookingRow,
  AnalyticsSessionRow,
} from "@/services/admin";
import { fetchAnalyticsSnapshot } from "@/services/admin";
import { format, subDays } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type PeriodKey = "week" | "month" | "quarter" | "year";

const periodOptions: Array<{ key: PeriodKey; label: string; days: number }> = [
  { key: "week", label: "Ultima semana", days: 7 },
  { key: "month", label: "Ultimo mes", days: 30 },
  { key: "quarter", label: "Trimestre", days: 90 },
  { key: "year", label: "Ano", days: 365 },
];

type AnalyticsView = {
  totalSessions: number;
  occupancyRate: number;
  cancelledCount: number;
  pendingSwaps: number;
  averageAttendance: number;
  trendPercent: number;
  sessions: AnalyticsSessionRow[];
  bookings: AnalyticsBookingRow[];
};

type ChartPoint = { label: string; value: number };

export default function AdminAnalyticsDashboard() {
  const [period, setPeriod] = useState<PeriodKey>("month");
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AnalyticsView | null>(null);

  useEffect(() => {
    let mounted = true;
    const selected =
      periodOptions.find((p) => p.key === period) ?? periodOptions[1];
    const load = async () => {
      setLoading(true);
      try {
        const end = new Date();
        const start = subDays(end, selected.days - 1);
        const prevEnd = subDays(start, 1);
        const prevStart = subDays(prevEnd, selected.days - 1);

        const [currentRes, previousRes] = await Promise.all([
          fetchAnalyticsSnapshot(
            format(start, "yyyy-LL-dd"),
            format(end, "yyyy-LL-dd"),
          ),
          fetchAnalyticsSnapshot(
            format(prevStart, "yyyy-LL-dd"),
            format(prevEnd, "yyyy-LL-dd"),
          ),
        ]);

        if (!currentRes.data) {
          throw new Error(currentRes.error || "Falha ao carregar analytics");
        }

        const current = currentRes.data;
        const prev = previousRes.data;

        const totalSessions = current.sessions.length;
        const totalCapacity = current.sessions.reduce(
          (acc, s) => acc + (s.max_capacity ?? 0),
          0,
        );
        const confirmedCount = current.bookings.filter(
          (b) => b.status === "confirmed",
        ).length;
        const cancelledCount = current.bookings.filter(
          (b) => b.status === "cancelled",
        ).length;

        const occupancyRate = totalCapacity
          ? Math.round((confirmedCount / totalCapacity) * 100)
          : 0;
        const averageAttendance = totalSessions
          ? Number((confirmedCount / totalSessions).toFixed(1))
          : 0;

        const prevConfirmed = prev
          ? prev.bookings.filter((b) => b.status === "confirmed").length
          : 0;
        const trendPercent = prevConfirmed
          ? Math.round(((confirmedCount - prevConfirmed) / prevConfirmed) * 100)
          : confirmedCount > 0
            ? 100
            : 0;

        const nextView: AnalyticsView = {
          totalSessions,
          occupancyRate,
          cancelledCount,
          pendingSwaps: current.swapRequests,
          averageAttendance,
          trendPercent,
          sessions: current.sessions,
          bookings: current.bookings,
        };

        if (mounted) setView(nextView);
      } catch (error) {
        if (mounted) {
          toast.error(
            error instanceof Error
              ? error.message
              : "Erro ao carregar indicadores",
          );
          setView(null);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [period]);

  const chartPoints = useMemo<ChartPoint[]>(() => {
    if (!view) return [];

    const sessionMap = new Map<string, AnalyticsSessionRow>();
    view.sessions.forEach((session) => {
      sessionMap.set(session.id, session);
    });

    const confirmedByDate = new Map<string, number>();
    view.bookings.forEach((booking) => {
      if (booking.status !== "confirmed") return;
      const session = sessionMap.get(booking.session_id);
      if (!session) return;
      const dateKey = session.date;
      confirmedByDate.set(dateKey, (confirmedByDate.get(dateKey) ?? 0) + 1);
    });

    const points = Array.from(confirmedByDate.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, value]) => ({
        label: format(new Date(date), "dd/MM"),
        value,
      }));

    return points.slice(-10);
  }, [view]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Carregando indicadores...
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <PageHeader
        title="Painel de Analytics"
        description="Indicadores operacionais e tendencia de ocupacao das sessoes."
        icon={<Hash />}
        actions={
          <div className="flex flex-wrap gap-2">
            {periodOptions.map((option) => (
              <Button
                key={option.key}
                variant={option.key === period ? "primary" : "outline"}
                size="sm"
                onClick={() => setPeriod(option.key)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard
          title="Total de Sessoes"
          value={view?.totalSessions ?? 0}
          icon={<Calendar />}
        />
        <StatCard
          title="Taxa de Ocupacao"
          value={`${view?.occupancyRate ?? 0}%`}
          icon={<Hash />}
          variant="success"
          trend={{
            value: Math.abs(view?.trendPercent ?? 0),
            direction: (view?.trendPercent ?? 0) >= 0 ? "up" : "down",
          }}
        />
        <StatCard
          title="Cancelamentos"
          value={view?.cancelledCount ?? 0}
          icon={<Users />}
          variant="alert"
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <Card className="xl:col-span-2 border border-slate-200" padding="lg">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-lg font-bold text-slate-900">
                Presencas confirmadas
              </h2>
              <p className="text-sm text-slate-500">
                Evolucao de confirmacoes no periodo selecionado
              </p>
            </div>
            <div className="text-xs text-slate-400">Ultimos pontos</div>
          </div>

          {chartPoints.length === 0 ? (
            <div className="text-center text-slate-400 py-12">
              Sem dados suficientes para o grafico
            </div>
          ) : (
            <div className="flex items-end gap-3 h-40">
              {chartPoints.map((point) => (
                <div key={point.label} className="flex-1 text-center">
                  <div
                    className="bg-primary/20 border border-primary/30 rounded-lg"
                    style={{
                      height: `${Math.max(12, point.value * 6)}px`,
                    }}
                  />
                  <div className="mt-2 text-[10px] text-slate-400">
                    {point.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="border border-slate-200" padding="lg">
          <div className="space-y-5">
            <div>
              <h2 className="text-lg font-bold text-slate-900">Resumo</h2>
              <p className="text-sm text-slate-500">
                Visao consolidada do periodo
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Trocas pendentes</span>
                <span className="text-lg font-semibold text-slate-900">
                  {view?.pendingSwaps ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">
                  Media de presenca
                </span>
                <span className="text-lg font-semibold text-slate-900">
                  {view?.averageAttendance ?? 0}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-500">Tendencia</span>
                <span
                  className={`text-lg font-semibold ${
                    (view?.trendPercent ?? 0) >= 0
                      ? "text-emerald-600"
                      : "text-rose-600"
                  }`}
                >
                  {(view?.trendPercent ?? 0) >= 0 ? "+" : ""}
                  {view?.trendPercent ?? 0}%
                </span>
              </div>
            </div>

            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
              Indicadores baseados em sessoes e agendamentos confirmados.
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
