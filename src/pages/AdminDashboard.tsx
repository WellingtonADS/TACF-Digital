/**
 * @page AdminDashboard
 * @description Painel administrativo com métricas e atalhos.
 * @path src/pages/AdminDashboard.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import { CARD_INTERACTIVE_CLASS } from "@/components/atomic/Card";
import StatCard from "@/components/atomic/StatCard";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import useSessions from "@/hooks/useSessions";
import type { LucideIcon } from "@/icons";
import {
  AlertTriangle,
  BarChart2,
  Bell,
  CheckCircle,
  ClipboardList,
  FileBarChart2,
  GitMerge,
  LayoutGrid,
  Settings,
  Shield,
  Users,
} from "@/icons";
import { formatSessionPeriod } from "@/utils/booking";
import { format, isAfter, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../services/supabase";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  const typedProfile = profile as Record<string, unknown> | null;

  const displayName = String(
    typedProfile?.full_name ?? typedProfile?.war_name ?? "Administrador",
  );

  const inspsau = typedProfile?.inspsau_valid_until as
    | string
    | null
    | undefined;
  let statusLabel = "Inapto";
  let statusColor = "text-white bg-error border border-error";

  if (inspsau) {
    const date = parseISO(inspsau);
    if (isValid(date) && isAfter(date, new Date())) {
      statusLabel = "Apto";
      statusColor = "text-white bg-success border border-success";
    }
  }

  // (clock removed) hero shows status chip instead to match OperationalDashboard

  // metrics
  const [totalInscritos, setTotalInscritos] = useState<number>(0);
  const [aptosMonth, setAptosMonth] = useState<number>(0);
  const [pendencias, setPendencias] = useState<number>(0);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // sessions (somente para capacidade restante e próximas turmas)
  const { sessions, loading: sessionsLoading } = useSessions();

  const isLoading = metricsLoading || sessionsLoading;

  type LocalAction = {
    icon: LucideIcon;
    label: string;
    description: string;
    path: string;
    accent?: string;
  };

  function QuickActionButton({ action }: { action: LocalAction }) {
    return (
      <button
        type="button"
        onClick={() => navigate(action.path)}
        className={`${CARD_INTERACTIVE_CLASS} group flex h-full min-h-[156px] w-full flex-col items-start justify-start gap-3 rounded-2xl p-4 text-left md:min-h-[168px] md:p-5`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.accent}`}
        >
          <AppIcon icon={action.icon} size="sm" ariaLabel={action.label} />
        </div>
        <div className="flex w-full flex-1 flex-col text-left">
          <p className="text-left text-base font-semibold leading-tight text-text-body line-clamp-2">
            {action.label}
          </p>
          <p className="mt-1 text-left text-xs leading-snug text-text-muted line-clamp-2">
            {action.description}
          </p>
        </div>
      </button>
    );
  }

  useEffect(() => {
    async function loadMetrics() {
      setMetricsLoading(true);
      setMetricsError(null);
      try {
        // total inscritos (all bookings)
        const { count: totalCount, error: totalError } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true });

        if (totalError) throw totalError;
        setTotalInscritos(totalCount ?? 0);

        // aptos no mês (bookings com score não nulo criados neste mês)
        const now = new Date();
        const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
        const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        const { count: aptosCount, error: aptosError } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .not("score", "is", null)
          .gte("created_at", firstDay.toISOString())
          .lt("created_at", nextMonth.toISOString());

        if (aptosError) throw aptosError;
        setAptosMonth(aptosCount ?? 0);

        // pendências: qualquer booking que não esteja agendado
        const { count: pendCount, error: pendError } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .not("status", "eq", "agendado");

        if (pendError) throw pendError;
        setPendencias(pendCount ?? 0);
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

  // próximas 3 turmas abertas
  const upcomingSessions = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(
        (s) => isAfter(parseISO(s.date), now) && (s.available_count ?? 0) > 0,
      )
      .slice(0, 3);
  }, [sessions]);

  const quickActions = [
    {
      icon: LayoutGrid,
      label: "Gerenciar Turmas",
      description: "Listar, criar e controlar sessões de avaliação",
      path: "/app/turmas",
      accent: "bg-primary/5 text-primary",
    },
    {
      icon: Users,
      label: "Efetivo",
      description: "Buscar e monitorar militares",
      path: "/app/efetivo",
      accent: "bg-primary/5 text-primary",
    },
    {
      icon: FileBarChart2,
      label: "Relatórios",
      description: "Analytics e exportação de dados",
      path: "/app/analytics",
      accent: "bg-primary/5 text-primary",
    },
    {
      icon: GitMerge,
      label: "Reagendamentos",
      description: "Deferir ou indeferir solicitações",
      path: "/app/reagendamentos",
      accent: "bg-primary/5 text-primary",
    },
    {
      icon: ClipboardList,
      label: "Lançar Índices",
      description: "Inserir resultados de avaliação",
      path: "/app/lancamento-indices",
      accent: "bg-primary/5 text-primary",
    },
    {
      icon: Settings,
      label: "Configurações",
      description: "Parâmetros globais e segurança",
      path: "/app/configuracoes",
      accent: "bg-bg-default text-text-muted",
    },
  ];

  const sessionCardBaseClass =
    "h-full rounded-2xl border border-border-default bg-bg-card p-5";

  if (isLoading) return <FullPageLoading message="Carregando dashboard" />;

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl">
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
                  Visão Greal — TACF‑Digital.
                </p>
                {statusLabel === "Apto" && (
                  <div
                    className={`mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${statusColor}`}
                  >
                    <AppIcon icon={CheckCircle} size="sm" ariaLabel="Status" />
                    <span className="text-xs font-bold uppercase tracking-widest">
                      Status: {statusLabel}
                    </span>
                  </div>
                )}
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
                      className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center border border-white/20"
                    >
                      <span
                        aria-hidden="true"
                        className="text-xs font-bold text-white"
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

        {/* sessions table */}
        {metricsError && (
          <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {metricsError}
          </div>
        )}

        {/* quick action cards */}
        <section className="mb-10">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 px-1">
            Acesso Rápido
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
            {quickActions.map((action) => (
              <QuickActionButton key={action.path} action={action} />
            ))}
          </div>
        </section>

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
