/**
 * @page AdminDashboard
 * @description Painel administrativo com métricas e atalhos.
 * @path src/pages/AdminDashboard.tsx
 */

import QuickAccessCard, {
  type AcaoRapidaAdmin,
} from "@/components/Admin/QuickAccessCard";
import AppIcon from "@/components/atomic/AppIcon";
import StatCard from "@/components/atomic/StatCard";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import useAuth from "@/hooks/useAuth";
import useSessions from "@/hooks/useSessions";
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
  const nomeExibicao = String(
    profile?.war_name || profile?.full_name || "Admin",
  );

  // Métricas
  const [totalInscritos, setTotalInscritos] = useState<number>(0);
  const [aptosNoMes, setAptosNoMes] = useState<number>(0);
  const [pendencias, setPendencias] = useState<number>(0);
  const [carregandoMetricas, setCarregandoMetricas] =
    useState<boolean>(true);
  const [erroMetricas, setErroMetricas] = useState<string | null>(null);
  const [panoramaGovernanca, setPanoramaGovernanca] =
    useState<AdminGovernanceSnapshot | null>(
    null,
  );

  // Sessões, usadas para capacidade restante e próximas turmas.
  const { sessions, loading: carregandoSessoes } = useSessions();

  const carregandoPagina = carregandoMetricas || carregandoSessoes;

  useEffect(() => {
    async function loadMetrics() {
      setCarregandoMetricas(true);
      setErroMetricas(null);
      try {
        const { totalInscritos, aptosMonth, pendencias } =
          await fetchAdminMetrics();
        const snapshotGovernanca = await fetchAdminGovernanceSnapshot();
        setTotalInscritos(totalInscritos);
        setAptosNoMes(aptosMonth);
        setPendencias(pendencias);
        setPanoramaGovernanca(snapshotGovernanca);
      } catch (error) {
        const message =
          error && typeof error === "object" && "message" in error
            ? String(error.message)
            : "Erro ao carregar métricas.";
        setErroMetricas(message);
      } finally {
        setCarregandoMetricas(false);
      }
    }

    loadMetrics();
  }, []);

  const capacidadeRestante = useMemo(() => {
    if (!sessions) return 0;
    return sessions.reduce((sum, s) => sum + (s.available_count ?? 0), 0);
  }, [sessions]);

  const alertaGovernanca = useMemo(() => {
    if (!panoramaGovernanca) return null;

    if (
      panoramaGovernanca.pendingSwapRequests > 0 &&
      panoramaGovernanca.oldestPendingSwapCreatedAt
    ) {
      const ageHours = Math.max(
        differenceInHours(
          new Date(),
          parseISO(panoramaGovernanca.oldestPendingSwapCreatedAt),
        ),
        0,
      );

      if (ageHours >= 24) {
        return `Existe solicitação de reagendamento pendente há ${ageHours}h.`;
      }
    }

    if (panoramaGovernanca.overdueSessions > 0) {
      return `${panoramaGovernanca.overdueSessions} turma(s) já passaram da data e ainda não foram encerradas.`;
    }

    if (panoramaGovernanca.pendingResults > 0) {
      return `${panoramaGovernanca.pendingResults} resultado(s) seguem pendentes em turmas vencidas.`;
    }

    return null;
  }, [panoramaGovernanca]);

  // Próximas 3 turmas abertas.
  const proximasTurmas = useMemo(() => {
    const now = new Date();
    return sessions
      .filter(
        (s) => isAfter(parseISO(s.date), now) && (s.available_count ?? 0) > 0,
      )
      .slice(0, 3);
  }, [sessions]);

  const acoesRapidas: AcaoRapidaAdmin[] = [
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

  if (carregandoPagina) {
    return <FullPageLoading message="Carregando painel administrativo" />;
  }

  return (
    <Layout>
      <div className="mx-auto w-full max-w-6xl" data-testid="admin-dashboard">
        {/* Cabeçalho principal */}
        <section className="mb-8">
          <div className="relative overflow-hidden bg-primary rounded-3xl p-5 md:p-8 lg:p-10 text-white shadow-2xl shadow-primary/20">
            <div className="absolute inset-0 opacity-10 pointer-events-none dashboard-hero-texture" />
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div>
                <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                  Olá, {nomeExibicao}
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
                      aria-label={`Avatar de ${nomeExibicao}`}
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

        {/* Grade de indicadores */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <StatCard
            title="Total Inscritos"
            value={totalInscritos}
            loading={carregandoMetricas}
            icon={Users}
          />

          <StatCard
            title="Aptos (Mês)"
            value={aptosNoMes}
            loading={carregandoMetricas}
            icon={CheckCircle}
            className="border-b-4 border-success/30"
            iconBg="bg-success/10"
            iconColor="text-success"
          />

          <StatCard
            title="Pendências"
            value={pendencias}
            loading={carregandoMetricas}
            icon={AlertTriangle}
            className="border-b-4 border-error/30"
            iconBg="bg-error/10"
            iconColor="text-error"
          />

          <StatCard
            title="Vagas Restante"
            value={capacidadeRestante}
            loading={carregandoSessoes}
            icon={BarChart2}
          />
        </div>

        <section className="mb-10">
          <div className="mb-4 flex items-center justify-between px-1">
            <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest">
              Governança Operacional
            </h3>
            {alertaGovernanca && (
              <span className="inline-flex items-center gap-2 rounded-full border border-alert/30 bg-alert/10 px-3 py-1 text-[11px] font-semibold text-alert">
                <AlertTriangle size={12} />
                Atenção SLA
              </span>
            )}
          </div>

          {alertaGovernanca && (
            <div className="mb-4 rounded-2xl border border-alert/30 bg-alert/10 px-4 py-3 text-sm text-alert">
              {alertaGovernanca}
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            <StatCard
              title="Turmas em Atraso"
              value={panoramaGovernanca?.overdueSessions ?? 0}
              loading={carregandoMetricas}
              icon={Shield}
              className="border-b-4 border-alert/30"
              iconBg="bg-alert/10"
              iconColor="text-alert"
            />
            <StatCard
              title="Resultados Pendentes"
              value={panoramaGovernanca?.pendingResults ?? 0}
              loading={carregandoMetricas}
              icon={ClipboardList}
              className="border-b-4 border-error/30"
              iconBg="bg-error/10"
              iconColor="text-error"
            />
            <StatCard
              title="Reagendamentos Abertos"
              value={panoramaGovernanca?.pendingSwapRequests ?? 0}
              loading={carregandoMetricas}
              icon={GitMerge}
              className="border-b-4 border-secondary/30"
              iconBg="bg-secondary/10"
              iconColor="text-secondary"
            />
            <StatCard
              title="Sessões Concluídas 7d"
              value={panoramaGovernanca?.completedSessionsLast7Days ?? 0}
              loading={carregandoMetricas}
              icon={CheckCircle}
              className="border-b-4 border-success/30"
              iconBg="bg-success/10"
              iconColor="text-success"
            />
          </div>
        </section>

        {/* Mensagem de erro das métricas */}
        {erroMetricas && (
          <div className="mb-6 rounded-2xl border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
            {erroMetricas}
          </div>
        )}

        {/* Cartões de acesso rápido */}
        <section className="mb-10">
          <h3 className="text-xs font-bold text-text-muted uppercase tracking-widest mb-4 px-1">
            Acesso Rápido
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
            {acoesRapidas.map((action) => (
              <QuickAccessCard
                key={action.path}
                action={action}
                onClick={() => navigate(action.path)}
              />
            ))}
          </div>
        </section>

        {/* Próximas turmas abertas */}
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
            {carregandoSessoes ? (
              Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className={`${sessionCardBaseClass} h-28 animate-pulse`}
                />
              ))
            ) : proximasTurmas.length === 0 ? (
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
              proximasTurmas.map((s) => {
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
