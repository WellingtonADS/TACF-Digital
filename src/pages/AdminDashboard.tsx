import StatsCard from "@/components/Admin/StatsCard";
import Button from "@/components/ui/Button";
import { Body, H1 } from "@/components/ui/Typography";
import { fetchDashboardStats } from "@/services/admin";
import {
  ArrowRight,
  CalendarCheck,
  RefreshCw,
  Settings,
  Users,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState<{
    totalUsers: number;
    totalScheduled: number;
    pendingSwaps: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetchDashboardStats();
        if (mounted) setStats(res);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Carregando métricas...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {/* Header da Página */}
      <div className="flex items-center justify-between">
        <div>
          <H1>Painel Administrativo</H1>
          <Body className="text-slate-500 mt-1">
            Visão geral do efetivo e agendamentos.
          </Body>
        </div>
        <div className="hidden sm:block">
          <Button variant="outline" size="sm" className="text-xs">
            <Settings size={14} className="mr-2" /> Configurações
          </Button>
        </div>
      </div>

      {/* Grid de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatsCard
          title="Efetivo Cadastrado"
          value={stats?.totalUsers ?? 0}
          icon={Users}
          description="Militares registrados no sistema"
        />
        <StatsCard
          title="Agendamentos Ativos"
          value={stats?.totalScheduled ?? 0}
          icon={CalendarCheck}
          description="Testes marcados para este ciclo"
        />
        <StatsCard
          title="Trocas Pendentes"
          value={stats?.pendingSwaps ?? 0}
          icon={RefreshCw}
          description="Solicitações aguardando aprovação"
        />
      </div>

      {/* Seção de Ações Rápidas */}
      <div className="pt-4">
        <h2 className="text-lg font-bold text-slate-800 mb-4">
          Gestão Operacional
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/admin/sessions">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 border border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/30 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-50 text-primary rounded-lg group-hover:bg-primary group-hover:text-white transition-colors">
                  <CalendarCheck size={20} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-800">
                    Gerenciar Sessões
                  </div>
                  <div className="text-xs text-slate-500">
                    Abrir datas e vagas
                  </div>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 group-hover:text-primary"
              />
            </Button>
          </Link>

          <Link to="/admin/swaps">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 border border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/30 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-orange-50 text-orange-600 rounded-lg group-hover:bg-orange-500 group-hover:text-white transition-colors">
                  <RefreshCw size={20} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-800">
                    Aprovar Trocas
                  </div>
                  <div className="text-xs text-slate-500">
                    {stats?.pendingSwaps ?? 0} solicitações pendentes
                  </div>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 group-hover:text-primary"
              />
            </Button>
          </Link>

          <Link to="/admin/users">
            <Button
              variant="ghost"
              className="w-full justify-between h-auto py-4 border border-slate-200 bg-white hover:bg-slate-50 hover:border-primary/30 group"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 text-slate-600 rounded-lg group-hover:bg-slate-800 group-hover:text-white transition-colors">
                  <Users size={20} />
                </div>
                <div className="text-left">
                  <div className="font-semibold text-slate-800">
                    Base de Usuários
                  </div>
                  <div className="text-xs text-slate-500">
                    Editar perfis e saram
                  </div>
                </div>
              </div>
              <ArrowRight
                size={16}
                className="text-slate-300 group-hover:text-primary"
              />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
