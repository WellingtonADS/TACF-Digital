import useAuth from "@/hooks/useAuth";
import useSessions from "@/hooks/useSessions";
import { format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
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
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "../layout/Layout";
import { supabase } from "../services/supabase";

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { profile } = useAuth();

  // clock for session display
  const [clock, setClock] = useState(() => {
    const now = new Date();
    return now.toLocaleTimeString("pt-BR", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  });

  useEffect(() => {
    const id = setInterval(() => {
      setClock(
        new Date().toLocaleTimeString("pt-BR", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      );
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // metrics
  const [totalInscritos, setTotalInscritos] = useState<number>(0);
  const [aptosMonth, setAptosMonth] = useState<number>(0);
  const [pendencias, setPendencias] = useState<number>(0);
  const [metricsLoading, setMetricsLoading] = useState<boolean>(true);
  const [metricsError, setMetricsError] = useState<string | null>(null);

  // sessions (somente para capacidade restante e próximas turmas)
  const { sessions, loading: sessionsLoading } = useSessions();

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

        // pendências: qualquer booking que não esteja confirmado
        const { count: pendCount, error: pendError } = await supabase
          .from("bookings")
          .select("id", { count: "exact", head: true })
          .neq("status", "confirmed");

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
      accent: "bg-primary/10 text-primary dark:bg-primary/20",
    },
    {
      icon: Users,
      label: "Efetivo",
      description: "Buscar e monitorar militares",
      path: "/app/efetivo",
      accent: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300",
    },
    {
      icon: FileBarChart2,
      label: "Relatórios",
      description: "Analytics e exportação de dados",
      path: "/app/analytics",
      accent:
        "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
    },
    {
      icon: GitMerge,
      label: "Reagendamentos",
      description: "Deferir ou indeferir solicitações",
      path: "/app/reagendamentos",
      accent:
        "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
    },
    {
      icon: ClipboardList,
      label: "Lançar Índices",
      description: "Inserir resultados de avaliação",
      path: "/app/lancamento-indices",
      accent:
        "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300",
    },
    {
      icon: Settings,
      label: "Configurações",
      description: "Parâmetros globais e segurança",
      path: "/app/configuracoes",
      accent:
        "bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300",
    },
  ];

  return (
    <Layout>
      {/* header */}
      <header className="flex justify-between items-center mb-10">
        <div>
          <h2 className="text-3xl font-bold text-primary dark:text-white">
            Dashboard Administrativo
          </h2>
          <p className="text-slate-500 mt-1">
            Bem-vindo ao centro de controle TACF‑Digital.
          </p>
        </div>
        <div className="flex items-center gap-4">
          <button
            className="p-2 bg-white dark:bg-slate-800 rounded-full shadow-sm text-slate-400 hover:text-primary transition-colors"
            aria-label="Notificações"
            title="Notificações"
          >
            <Bell size={20} />
          </button>
          <div className="h-10 w-px bg-slate-200 dark:bg-slate-700 mx-1" />
          <div className="text-right">
            <p className="text-xs text-slate-400 font-medium uppercase tracking-widest">
              Sessão Ativa
            </p>
            <p className="text-sm font-bold text-primary dark:text-white font-mono">
              {clock}
            </p>
          </div>
          {profile && (
            <div className="flex items-center gap-2 ml-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center border border-primary/20">
                <span className="text-xs font-bold text-primary">
                  {(profile.war_name ?? profile.full_name ?? "?")
                    .slice(0, 2)
                    .toUpperCase()}
                </span>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* stats grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {/* Total inscritos */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Total Inscritos
            </p>
            <h3
              className={`text-3xl font-bold text-slate-800 dark:text-white ${metricsLoading ? "animate-pulse text-slate-400" : ""}`}
            >
              {metricsLoading ? "—" : totalInscritos}
            </h3>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <Users size={28} />
          </div>
        </div>

        {/* Aptos mês */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between border-b-4 border-military-green/30">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Aptos (Mês)
            </p>
            <h3
              className={`text-3xl font-bold text-slate-800 dark:text-white ${metricsLoading ? "animate-pulse text-slate-400" : ""}`}
            >
              {metricsLoading ? "—" : aptosMonth}
            </h3>
          </div>
          <div className="w-14 h-14 bg-military-green/10 rounded-2xl flex items-center justify-center text-military-green">
            <CheckCircle size={28} />
          </div>
        </div>

        {/* Pendências */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between border-b-4 border-military-gold/30">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Pendências
            </p>
            <h3
              className={`text-3xl font-bold text-slate-800 dark:text-white ${metricsLoading ? "animate-pulse text-slate-400" : ""}`}
            >
              {metricsLoading ? "—" : pendencias}
            </h3>
          </div>
          <div className="w-14 h-14 bg-military-gold/10 rounded-2xl flex items-center justify-center text-military-gold">
            <AlertTriangle size={28} />
          </div>
        </div>

        {/* Capacidade restante */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-[0_10px_40px_-15px_rgba(0,0,0,0.1)] flex items-center justify-between">
          <div>
            <p className="text-slate-400 text-sm font-medium mb-1">
              Capacidade Restante
            </p>
            <h3
              className={`text-3xl font-bold text-slate-800 dark:text-white ${sessionsLoading ? "animate-pulse text-slate-400" : ""}`}
            >
              {sessionsLoading ? "—" : capacidadeRestante}
            </h3>
          </div>
          <div className="w-14 h-14 bg-primary/10 rounded-2xl flex items-center justify-center text-primary">
            <BarChart2 size={28} />
          </div>
        </div>
      </div>

      {/* sessions table */}
      {metricsError && (
        <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-700 dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200">
          {metricsError}
        </div>
      )}

      {/* quick action cards */}
      <section className="mb-10">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-4 px-1">
          Acesso Rápido
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {quickActions.map((action) => (
            <button
              key={action.path}
              type="button"
              onClick={() => navigate(action.path)}
              className="group flex flex-col items-start gap-3 bg-white dark:bg-slate-800 p-5 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-700 hover:shadow-md hover:-translate-y-0.5 transition-all text-left"
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center ${action.accent}`}
              >
                <action.icon size={20} />
              </div>
              <div>
                <p className="text-sm font-bold text-slate-800 dark:text-slate-100 leading-tight">
                  {action.label}
                </p>
                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug line-clamp-2">
                  {action.description}
                </p>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* upcoming sessions strip */}
      <section>
        <div className="flex items-center justify-between mb-4 px-1">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Próximas Turmas Abertas
          </h3>
          <button
            type="button"
            onClick={() => navigate("/app/turmas")}
            className="text-xs text-primary dark:text-sky-400 font-semibold hover:underline"
          >
            Ver todas →
          </button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {sessionsLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 rounded-2xl p-5 animate-pulse h-28 border border-slate-100 dark:border-slate-700"
              />
            ))
          ) : upcomingSessions.length === 0 ? (
            <div className="col-span-3 bg-white dark:bg-slate-800 rounded-2xl p-8 text-center border border-slate-100 dark:border-slate-700">
              <Shield size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-sm text-slate-400">
                Nenhuma turma aberta nos próximos dias.
              </p>
            </div>
          ) : (
            upcomingSessions.map((s) => {
              const occupied = s.occupied_count;
              const max = s.max_capacity;
              const percent = max ? Math.round((occupied / max) * 100) : 0;
              const statusColor =
                percent >= 95
                  ? "border-l-slate-400"
                  : percent >= 50
                    ? "border-l-military-gold"
                    : "border-l-primary";
              return (
                <div
                  key={s.session_id}
                  className={`bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 border-l-4 ${statusColor} flex flex-col gap-3`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                        {s.session_id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="text-sm font-bold text-slate-800 dark:text-white mt-0.5">
                        {format(parseISO(s.date), "EEEE, dd 'de' MMMM", {
                          locale: ptBR,
                        })}
                      </p>
                    </div>
                    <span className="text-xs bg-primary/10 text-primary dark:bg-primary/20 px-2 py-0.5 rounded-full font-semibold">
                      {s.period}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-[10px] font-bold text-slate-400 mb-1">
                      <span>Ocupação</span>
                      <span>
                        {occupied}/{max} — {percent}%
                      </span>
                    </div>
                    <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700 rounded-full overflow-hidden">
                      <progress
                        value={occupied}
                        max={max || 1}
                        aria-label="Ocupação da turma"
                        className={`h-full w-full rounded-full [&::-webkit-progress-bar]:bg-transparent [&::-webkit-progress-value]:rounded-full [&::-webkit-progress-value]:transition-all ${
                          percent >= 95
                            ? "[&::-webkit-progress-value]:bg-slate-400"
                            : percent >= 50
                              ? "[&::-webkit-progress-value]:bg-amber-400"
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
    </Layout>
  );
};

export default AdminDashboard;
