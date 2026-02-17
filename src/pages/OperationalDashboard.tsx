import {
  Award,
  CalendarPlus,
  CheckCircle,
  ClipboardList,
  FileText,
  Info,
  MoreHorizontal,
  Shield,
} from "lucide-react";
import Layout from "../layout/Layout";

export const OperationalDashboard = () => {
  const actionCards = [
    {
      icon: CalendarPlus,
      label: "Novo Agendamento",
      title: "Marcar TACF",
      iconBg: "bg-blue-50 dark:bg-primary/20",
      iconColor: "text-primary dark:text-blue-400",
    },
    {
      icon: ClipboardList,
      label: "Meus Testes",
      title: "Histórico",
      iconBg: "bg-blue-50 dark:bg-primary/20",
      iconColor: "text-primary dark:text-blue-400",
    },
    {
      icon: Award,
      label: "Resultados",
      title: "Certificados",
      iconBg: "bg-blue-50 dark:bg-primary/20",
      iconColor: "text-primary dark:text-blue-400",
    },
  ];

  const notifications = [
    {
      icon: Shield,
      iconColor: "text-amber-500",
      title: "Inspeção de Saúde",
      description:
        "Sua inspeção vence em 45 dias. Verifique os requisitos no HACO.",
    },
    {
      icon: FileText,
      iconColor: "text-blue-500",
      title: "Nova ICA 54-2",
      description:
        "Publicada nova portaria sobre os índices de aptidão física.",
    },
  ];

  return (
    <Layout>
      {/* Greeting Card */}
      <section className="mb-8">
        <div className="relative overflow-hidden bg-primary rounded-3xl p-10 text-white shadow-2xl shadow-primary/20">
          {/* Abstract Pattern Background */}
          <div
            className="absolute inset-0 opacity-10 pointer-events-none bg-cover bg-center"
            style={{
              backgroundImage:
                "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDurxoPOc3Gb_jppt_qbvSWXqBih_aeg1LoSiESxVH3iJGYCSoMaA9waLCd3MIT1EZ3FClUucmFoCyljmJkdLQYTPHfTNTpKHEYR_pax-Ze2Qan-F67pJLx0cCAAupmkCGWWM26S2qOhmzQi4Npm5BOwlMbb-oV9gyz5pQCblYHEOq2VLi6huOJgg8oNkSH9oop3-LoOVdgnr-fj24xfHvreAzGNpbVbN0mw9sq_DvUSA2yZuWRo7v1IRQUBXNlVa7p1PuHRcSx2Er5')",
            }}
          />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-3xl font-bold tracking-tight">
                Olá, Tenente Silva
              </h2>
              <p className="text-white/80 mt-2 text-lg font-normal">
                Seja bem-vindo ao portal de agendamento do HACO
              </p>
              {/* Status Chip */}
              <div className="mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                <CheckCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Status: Ativo / Apto
                </span>
              </div>
            </div>
            <div className="hidden lg:block">
              <div className="w-24 h-24 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center">
                <Shield size={48} className="text-white/40" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Action Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {actionCards.map((card, index) => (
          <button
            key={index}
            className="group bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 text-left hover:scale-[1.02] hover:border-primary transition-all duration-300"
          >
            <div
              className={`h-14 w-14 rounded-2xl ${card.iconBg} flex items-center justify-center mb-6 ${card.iconColor} group-hover:bg-primary group-hover:text-white transition-colors`}
            >
              <card.icon size={32} />
            </div>
            <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1 group-hover:text-primary transition-colors">
              {card.label}
            </h3>
            <p className="text-slate-900 dark:text-white font-semibold text-lg">
              {card.title}
            </p>
          </button>
        ))}
      </section>

      {/* Bottom Section: Status & Notifications */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Status Card */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-8 border border-slate-100 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CalendarPlus className="text-primary" size={20} />
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Próximo Evento
              </h4>
            </div>
            <MoreHorizontal className="text-slate-300" size={20} />
          </div>
          <div className="flex flex-col items-center justify-center py-10 border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
            <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
              <Info size={24} />
            </div>
            <p className="text-slate-600 dark:text-slate-400 font-medium">
              Nenhum agendamento pendente
            </p>
            <button className="mt-4 text-primary dark:text-blue-400 text-sm font-bold uppercase tracking-wider hover:underline">
              Ver calendário completo
            </button>
          </div>
        </div>

        {/* Info Section */}
        <div className="w-full xl:w-96 bg-primary/5 dark:bg-slate-800/30 rounded-3xl p-8 border border-primary/10 dark:border-slate-700">
          <h4 className="text-sm font-bold uppercase tracking-widest text-primary dark:text-blue-400 mb-6 flex items-center gap-2">
            <Info size={20} />
            Avisos Importantes
          </h4>
          <div className="space-y-4">
            {notifications.map((notification, index) => (
              <div
                key={index}
                className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className={notification.iconColor}>
                  <notification.icon size={24} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-tight">
                    {notification.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {notification.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
};

export default OperationalDashboard;
