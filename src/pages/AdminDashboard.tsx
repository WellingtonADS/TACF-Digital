/**
 * @page AdminDashboard
 * @description Painel administrativo com métricas e atalhos.
 * @path src/pages/AdminDashboard.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import StatCard from "@/components/atomic/StatCard";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import useSessions from "@/hooks/useSessions";
import {
  AlertTriangle,
  BarChart2,
  Bell,
  CheckCircle,
  ClipboardList,
  GitMerge,
  Shield,
  Users,
} from "@/icons";
import {
  fetchAdminGovernanceSnapshot,
  fetchAdminMetrics,
  type AdminGovernanceSnapshot,
} from "@/services/bookings";
import { formatSessionPeriod } from "@/utils/booking";
import { differenceInHours, format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();
  const displayName = String(
    profile?.war_name || profile?.full_name || "Admin",
  );

  // metrics
  const [totalInscritos, setTotalInscritos] = useState<number>(0);
  const [aptosMonth, setAptosMonth] = useState<number>(0);
  const [pendencias, setPendencias] = useState<number>(0);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);
  const [governance, setGovernance] = useState<AdminGovernanceSnapshot | null>(
    null,
  );

  // sessions (somente para capacidade restante e próximas turmas)
  const { sessions, loading: sessionsLoading } = useSessions();

  useEffect(() => {
    async function loadMetrics() {
      setMetricsLoading(true);
      setMetricsError(null);
      try {
        const { totalInscritos, aptosMonth, pendencias } =
          await fetchAdminMetrics();
        const governanceSnapshot = await fetchAdminGovernanceSnapshot();
        setTotalInscritos(totalInscritos);
        setAptosMonth(aptosMonth);
        setPendencias(pendencias);
        setGovernance(governanceSnapshot);
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Erro ao carregar métricas.";
        setMetricsError(message);
      } finally {
        setMetricsLoading(false);
      }
    }

    loadMetrics();
  }, []);

  const capacidadeRestante = useMemo(() => {
    if (!sessions) return 0;
    return sessions.reduce((sum, s) => sum + (s.available_count ?? 0), 0);
  }, [sessions]);

  const governanceAlert = useMemo(() => {
    if (!governance) return null;

    if (
      governance.pendingSwapRequests > 0 &&
      governance.oldestPendingSwapCreatedAt
    ) {
      const ageHours = Math.max(
        differenceInHours(
          new Date(),
          parseISO(governance.oldestPendingSwapCreatedAt),
        ),
        0,
      );

      if (ageHours >= 24) {
        return `Existe solicitação de reagendamento pendente há ${ageHours}h.`;
      }
    }

    if (governance.overdueSessions > 0) {
      return `${governance.overdueSessions} turma(s) já passaram da data e ainda não foram encerradas.`;
    }

    if (governance.pendingResults > 0) {
      return `${governance.pendingResults} resultado(s) seguem pendentes em turmas vencidas.`;
    }

    return null;
  }, [governance]);

  // próximas 3 turmas abertas
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(
        (s) => isAfter(parseISO(s.date), now) && (s.available_count ?? 0) > 0,
      )
      .slice(0, 3);
  }, [sessions]);

  const sessionCardBaseClass =
    "h-full rounded-2xl border border-border-default bg-bg-card p-5";

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl" data-testid="admin-dashboard">
        {/* Greeting hero */}
        <section className="mb-8">
          <div className="relative overflow-hidden bg-primary rounded-3xl p-5 md:p-8 lg:p-10 text-white shadow-2xl shadow-primary/20">
            <div className="absolute inset-0 opacity-10 pointer-events-none dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  Olá, {displayName}
                </h2>
                <p className="text-white/80 mt-2 text-sm md:text-lg font-normal">
                  Visão Geral — TACF‑Digital.
                </p>
              </div>
              <div className="flex items-center gap-4">
                <button
                  className="p-2 bg-bg-card rounded-full shadow-sm text-text-muted hover:text-primary transition-colors"
                  aria-label="Notificações"
                  title="Notificações"
                >
                  <AppIcon icon={Bell} size="md" decorative />
                </button>
                {profile && (
                  <div className="flex items-center gap-2 ml-2">
                    <div
                      role="img"
                      aria-label={`Avatar de ${displayName}`}
                      className="flex h-9 w-9 items-center justify-center rounded-full border border-primary/30 bg-primary/20"
                    >
                      <span
                        aria-hidden="true"
                        className="text-xs font-bold text-primary-foreground"
                      >
                        {(profile.war_name ?? profile.full_name ?? "?")
                          .slice(0, 2)
                          .toUpperCase()}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* stats grid (DRY via StatCard) */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Inscritos"
            value={totalInscritos}
            loading={metricsLoading}
            icon={Users}
          />

          <StatCard
            title="Aptos (Mês)"
            value={aptosMonth}
            loading={metricsLoading}
            icon={CheckCircle}
            className="border-b-4 border-success/30"
            iconBg="bg-success/10"
            iconColor="text-success"
          />

          <StatCard
            title="Pendências"
            value={pendencias}
            loading={metricsLoading}
            icon={AlertTriangle}
            className="border-b-4 border-error/30"
            iconBg="bg-error/10"
            iconColor="text-error"
          />

          <StatCard
            title="Vagas Restante"
            value={capacidadeRestante}
            loading={sessionsLoading}
            icon={BarChart2}
          />
        </div>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Governança Operacional
            </h3>
            {governanceAlert && (
              <span className="inline-flex items-center gap-2 rounded-full border border-alert/30 bg-alert/10 px-3 py-1 text-[11px] font-semibold text-alert">
                <AlertTriangle size={12} />
                Atenção SLA
              </span>
            )}
          </div>

          {governanceAlert && (
            <div className="mb-4 rounded-2xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">
              {governanceAlert}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Turmas em Atraso"
              value={governance?.overdueSessions ?? 0}
              loading={metricsLoading}
              icon={Shield}
              className="border-b-4 border-alert/30"
              iconBg="bg-alert/10"
              iconColor="text-alert"
            />
            <StatCard
              title="Resultados Pendentes"
              value={governance?.pendingResults ?? 0}
              loading={metricsLoading}
              icon={ClipboardList}
              className="border-b-4 border-error/30"
              iconBg="bg-error/10"
              iconColor="text-error"
            />
            <StatCard
              title="Reagendamentos Abertos"
              value={governance?.pendingSwapRequests ?? 0}
              loading={metricsLoading}
              icon={GitMerge}
              className="border-b-4 border-secondary/30"
              iconBg="bg-secondary/10"
              iconColor="text-secondary"
            />
            <StatCard
              title="Sessões Concluídas 7d"
              value={governance?.completedSessionsLast7Days ?? 0}
              loading={metricsLoading}
              icon={CheckCircle}
              className="border-b-4 border-success/30"
              iconBg="bg-success/10"
              iconColor="text-success"
            />
          </div>
        </section>

        {/* sessions table */}
        {metricsError && (
          <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {metricsError}
          </div>
        )}

        {/* upcoming sessions strip */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Próximas Turmas Abertas
            </h3>
            <button
              type="button"
              onClick={() => navigate("/app/turmas")}
              className="text-xs text-primary font-semibold hover:underline"
            >
              Ver todas →
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {sessionsLoading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`${sessionCardBaseClass} h-28 animate-pulse`}
                />
              ))
            ) : upcomingSessions.length === 0 ? (
              <div className="md:col-span-2 xl:col-span-3 rounded-2xl border border-border-default bg-bg-card p-8 text-center">
                <AppIcon
                  icon={Shield}
                  size="lg"
                  className="mx-auto text-text-muted mb-2"
                  decorative
                />
                <p className="text-sm text-text-muted">
                  Nenhuma turma aberta nos próximos dias.
                </p>
              </div>
            ) : (
              upcomingSessions.map((s) => {
                const occupied = s.occupied_count;
                const max = s.max_capacity;
                const percent = max ? Math.round((occupied / max) * 100) : 0;
                const capacityColor =
                  percent >= 95
                    ? "border-l-error"
                    : percent >= 50
                      ? "border-l-secondary"
                      : "border-l-primary";
                return (
                  <div
                    key={s.session_id}
                    className={`${sessionCardBaseClass} border-l-4 ${capacityColor} flex flex-col gap-3`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-bold text-text-muted uppercase tracking-wider">
                          {s.session_id.slice(0, 8).toUpperCase()}
                        </p>
                        <p className="text-sm font-bold text-text-body mt-0.5">
                          {format(parseISO(s.date), "EEEE, dd 'de' MMMM", {
                            locale: ptBR,
                          })}
                        </p>
                      </div>
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full font-semibold">
                        {formatSessionPeriod(s.period)}
                      </span>
                    </div>
                    <div>
                      <div className="flex justify-between text-[10px] font-bold text-text-muted mb-1">
                        <span>Ocupação</span>
                        <span>
                          {occupied}/{max} — {percent}%
                        </span>
                      </div>
                      <div className="h-1.5 w-full bg-border-default rounded-full overflow-hidden">
                        <progress
                          value={occupied}
                          max={max || 1}
                          aria-label="Ocupação da turma"
                          className={`h-full w-full rounded-full [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all ${
                            percent >= 95
                              ? "[&::-webkit-progress-value]:bg-error"
                              : percent >= 50
                                ? "[&::-webkit-progress-value]:bg-secondary"
                                : "[&::-webkit-progress-value]:bg-primary"
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
};

export default AdminDashboard;
