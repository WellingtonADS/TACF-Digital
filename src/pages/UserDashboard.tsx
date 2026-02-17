import {
  AlertTriangle,
  Award,
  Bell,
  Calendar,
  CalendarDays,
  ChevronRight,
  ClipboardList,
  FileText,
  Info,
  LayoutDashboard,
  LogOut,
  MoreHorizontal,
  ShieldCheck,
  User,
} from "lucide-react";
import React from "react";

type IconType = React.ComponentType<any>;

const SidebarItem: React.FC<{
  icon: IconType;
  label: string;
  active?: boolean;
}> = ({ icon: Icon, label, active = false }) => (
  <button
    type="button"
    aria-current={active || undefined}
    className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl transition-all duration-200 group ${
      active
        ? "bg-white/10 text-white shadow-lg"
        : "text-white/50 hover:bg-white/5 hover:text-white"
    }`}
  >
    <Icon
      size={20}
      className={active ? "text-white" : "group-hover:text-white"}
    />
    <span className="font-semibold text-sm tracking-tight">{label}</span>
  </button>
);

const QuickActionCard: React.FC<{
  icon: IconType;
  label: string;
  title: string;
}> = ({ icon: Icon, label, title }) => (
  <button
    type="button"
    className="flex flex-col items-start p-8 bg-white rounded-[2rem] shadow-xl shadow-slate-200/50 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 text-left group"
  >
    <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors mb-6">
      <Icon size={24} className="text-[#1B365D]" />
    </div>
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em] mb-1">
      {label}
    </span>
    <span className="text-xl font-bold text-slate-900 leading-tight">
      {title}
    </span>
  </button>
);

const NotificationCard: React.FC<{
  icon: IconType;
  title: string;
  description: string;
  type?: "info" | "warning";
}> = ({ icon: Icon, title, description, type = "info" }) => (
  <div className="flex gap-4 p-5 bg-white rounded-2xl shadow-sm border border-slate-100 hover:border-slate-200 transition-colors cursor-default">
    <div
      className={`p-2 rounded-lg shrink-0 h-fit ${
        type === "warning"
          ? "bg-amber-50 text-amber-600"
          : "bg-blue-50 text-blue-600"
      }`}
    >
      <Icon size={20} />
    </div>
    <div className="flex flex-col">
      <span className="text-sm font-bold text-slate-900 leading-tight mb-1">
        {title}
      </span>
      <p className="text-xs text-slate-500 leading-relaxed">{description}</p>
    </div>
  </div>
);

export default function UserDashboard(): JSX.Element {
  return (
    <div className="flex h-screen bg-[#F4F7F9] font-sans selection:bg-blue-100">
      <aside className="w-72 bg-[#1B365D] flex flex-col shrink-0">
        <div className="p-8 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
            <ShieldCheck className="text-white" size={24} />
          </div>
          <div className="flex flex-col">
            <span className="text-white font-bold tracking-tight leading-none uppercase">
              TACF-Digital
            </span>
            <span className="text-white/40 text-[9px] font-medium uppercase tracking-widest mt-1">
              Força Aérea Brasileira
            </span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-1">
          <SidebarItem icon={LayoutDashboard} label="Dashboard" active />
          <SidebarItem icon={CalendarDays} label="Agendamentos" />
          <SidebarItem icon={FileText} label="Documentos" />
          <SidebarItem icon={User} label="Perfil" />
        </nav>

        <div className="p-6">
          <button className="w-full flex items-center justify-center gap-3 py-4 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white rounded-2xl transition-all border border-white/5">
            <LogOut size={18} />
            <span className="font-bold text-xs uppercase tracking-widest">
              Sair
            </span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-y-auto p-12 scroll-smooth">
        <header
          className="relative overflow-hidden bg-[#1B365D] rounded-[2.5rem] p-12 text-white shadow-2xl shadow-blue-900/20 mb-12 flex flex-col justify-center min-h-[280px]"
          style={{
            backgroundImage:
              "linear-gradient(90deg, rgba(27, 54, 93, 0.95) 0%, rgba(27, 54, 93, 0.7) 100%), url('https://images.unsplash.com/photo-1544450173-8c8757a4888b?auto=format&fit=crop&q=80')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="relative z-10">
            <h1 className="text-5xl font-black mb-3 tracking-tight">
              Olá, Tenente Silva
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-lg font-medium opacity-90">
              Seja bem-vindo ao portal de agendamento do HACO. Seu status
              operacional está atualizado.
            </p>

            <div className="inline-flex items-center px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 bg-emerald-500 rounded-full mr-3 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">
                Status: Ativo / Apto
              </span>
            </div>
          </div>

          <div className="absolute right-12 top-1/2 -translate-y-1/2 w-32 h-32 bg-white/5 rounded-[2.5rem] flex items-center justify-center backdrop-blur-md border border-white/10">
            <Award className="text-white/20" size={64} />
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          <QuickActionCard
            icon={CalendarDays}
            label="Novo Agendamento"
            title="Marcar TACF"
          />
          <QuickActionCard
            icon={ClipboardList}
            label="Meus Testes"
            title="Histórico"
          />
          <QuickActionCard
            icon={Award}
            label="Resultados"
            title="Certificados"
          />
          <QuickActionCard
            icon={ShieldCheck}
            label="Documentação"
            title="Manuais"
          />
        </section>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          <div className="lg:col-span-2 bg-white rounded-[3rem] shadow-xl shadow-slate-200/50 p-10 flex flex-col">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <Calendar className="text-[#1B365D]" size={24} />
                <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Próximo Evento
                </h3>
              </div>
              <button
                className="text-slate-300 hover:text-slate-500 transition-colors"
                aria-label="Mais opções"
              >
                <MoreHorizontal size={24} />
              </button>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center py-16 border-2 border-dashed border-slate-100 rounded-[2.5rem] bg-slate-50/30">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-6">
                <Info className="text-slate-200" size={32} />
              </div>
              <p className="text-slate-400 font-bold mb-8 text-center max-w-xs">
                Nenhum agendamento pendente para as próximas 4 semanas.
              </p>
              <button className="px-8 py-3 bg-white text-[#1B365D] border border-slate-200 font-bold text-xs uppercase tracking-widest hover:bg-slate-50 hover:border-slate-300 transition-all rounded-xl shadow-sm flex items-center gap-2">
                Ver Calendário Completo
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <div className="bg-[#E9EEF5] rounded-[3rem] p-10 space-y-10">
            <div className="flex items-center gap-3">
              <Bell className="text-[#1B365D]" size={24} />
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-[#1B365D]/60">
                Avisos Importantes
              </h3>
            </div>

            <div className="space-y-5">
              <NotificationCard
                icon={AlertTriangle}
                type="warning"
                title="Inspeção de Saúde"
                description="Sua inspeção de saúde vence em 45 dias. Verifique os pré-requisitos no HACO."
              />
              <NotificationCard
                icon={FileText}
                title="Nova ICA 54-2"
                description="Publicada nova portaria sobre os índices mínimos de aptidão física para o corrente ano."
              />
            </div>

            <div className="pt-4">
              <button className="w-full py-4 text-center border-t border-slate-300/50 text-[10px] font-bold text-slate-500 uppercase tracking-widest hover:text-[#1B365D] transition-colors">
                Ver todas as notificações
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
