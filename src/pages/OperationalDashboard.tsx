import RescheduleDrawer from "@/components/RescheduleDrawer";
import useDashboard from "@/hooks/useDashboard";
import supabase from "@/services/supabase";
import type { Profile as DBProfile } from "@/types";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { format, isAfter, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
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
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/layout/Layout";

export const OperationalDashboard = () => {
  const {
    user,
    profile,
    loading,
    bookingsCount,
    resultsCount,
    nextSession,
    latestOrderNumber,
    notifications: derivedNotifications,
    loading: dashboardLoading,
  } = useDashboard();

  const typedProfile = profile as DBProfile | null;

  const displayName =
    typedProfile?.full_name ||
    typedProfile?.war_name ||
    user?.email ||
    "Usuário";

  // derive status from inspsau_valid_until when available (client-side fallback only)
  const inspsau = (typedProfile as unknown as Record<string, unknown>)
    ?.inspsau_valid_until as string | null | undefined;
  let statusLabel = "Inapto";
  let statusColor = "text-amber-300 bg-amber-500/10 border-amber-500/20";

  if (inspsau) {
    try {
      const date = typeof inspsau === "string" ? parseISO(inspsau) : inspsau;
      if (isAfter(date, new Date())) {
        statusLabel = "Apto";
        statusColor =
          "text-emerald-300 bg-emerald-500/20 border-emerald-500/30";
      } else {
        statusLabel = "Inapto";
        statusColor = "text-amber-300 bg-amber-500/10 border-amber-500/20";
      }
    } catch {
      statusLabel = "Inapto";
    }
  }

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBookingId, setDrawerBookingId] = useState<string | null>(null);
  const [pendingSwap, setPendingSwap] = useState(false);

  function periodToLabel(period?: string | null) {
    if (!period) return "";
    const p = String(period).toLowerCase();
    if (p === "morning" || p === "manhã") return "Manhã";
    if (p === "afternoon" || p === "tarde") return "Tarde";
    if (p === "evening" || p === "noite") return "Noite";
    if (p === "full_day" || p === "full-day" || p === "dia")
      return "Dia inteiro";
    return p.charAt(0).toUpperCase() + p.slice(1);
  }

  // check booking and pending swap when nextSession changes
  useEffect(() => {
    async function checkPending() {
      setPendingSwap(false);
      setDrawerBookingId(null);
      if (!nextSession || !user?.id) return;
      try {
        // find booking id for this session
        const { data: bookingData } = await supabase
          .from("bookings")
          .select("id")
          .eq("user_id", user.id)
          .eq("session_id", nextSession.id)
          .eq("status", "confirmed")
          .maybeSingle();
        const bid = bookingData?.id;
        if (bid) {
          setDrawerBookingId(bid);
          const { data: swapData } = await supabase
            .from("swap_requests")
            .select("id")
            .eq("booking_id", bid)
            .eq("status", "pending");
          setPendingSwap(Array.isArray(swapData) && swapData.length > 0);
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkPending();
  }, [nextSession, user]);

  const navigate = useNavigate();

  const actionCards = [
    {
      icon: CalendarPlus,
      label: "Novo Agendamento",
      title: "Marcar TACF",
      iconBg: "bg-blue-50 dark:bg-primary/20",
      iconColor: "text-primary dark:text-blue-400",
      to: "/app/agendamentos",
    },
    {
      icon: ClipboardList,
      label: "Meus Testes",
      title: "Histórico",
      iconBg: "bg-blue-50 dark:bg-primary/20",
      iconColor: "text-primary dark:text-blue-400",
      to: "/app/resultados",
      count: resultsCount,
    },
    {
      icon: Award,
      label: "Resultados",
      title: "Certificados",
      iconBg: "bg-blue-50 dark:bg-primary/20",
      iconColor: "text-primary dark:text-blue-400",
      to: "/app/ticket",
      count: bookingsCount,
    },
    {
      icon: FileText,
      label: "Documentação",
      title: "Manuais e Normas",
      iconBg: "bg-blue-50 dark:bg-primary/20",
      iconColor: "text-primary dark:text-blue-400",
      to: "/app/documentos",
    },
  ];

  const notifications = derivedNotifications;

  return (
    <Layout>
      {/* Greeting Card */}
      <section className="mb-8">
        <div className="relative overflow-hidden bg-primary rounded-3xl p-5 md:p-8 lg:p-10 text-white shadow-2xl shadow-primary/20">
          <div className="absolute inset-0 opacity-10 pointer-events-none dashboard-hero-texture" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                Olá, {displayName}
              </h2>
              <p className="text-white/80 mt-2 text-sm md:text-lg font-normal">
                Seja bem-vindo ao portal de agendamento do HACO
              </p>
              {/* Status Chip */}
              <div
                className={`mt-6 inline-flex items-center gap-2 px-4 py-1.5 rounded-full ${statusColor}`}
              >
                <CheckCircle size={18} />
                <span className="text-xs font-bold uppercase tracking-widest">
                  Status: {loading ? "Carregando" : statusLabel}
                </span>
              </div>

              {/* Bilhete (se disponível) */}
              {latestOrderNumber && (
                <div className="mt-3 flex items-center gap-3">
                  <div className="px-3 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-sm">
                    Bilhete: {latestOrderNumber}
                  </div>
                  <button
                    onClick={() => navigate("/app/ticket")}
                    className="px-3 py-1 bg-white/10 border border-white/20 rounded-full text-xs font-semibold hover:bg-white/20 transition-colors"
                  >
                    Abrir Bilhete
                  </button>
                </div>
              )}
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
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {actionCards.map((card, index) => (
          <button
            key={index}
            onClick={() => navigate(card.to ?? "/")}
            onMouseEnter={() => {
              if (card.to) prefetchRoute(card.to);
            }}
            className="group bg-white dark:bg-slate-900 p-4 md:p-6 lg:p-8 rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-black/20 border border-slate-100 dark:border-slate-800 text-left hover:scale-[1.02] hover:border-primary transition-all duration-300"
          >
            <div
              className={`h-10 w-10 md:h-14 md:w-14 rounded-2xl ${card.iconBg} flex items-center justify-center mb-3 md:mb-6 ${card.iconColor} group-hover:bg-primary group-hover:text-white transition-colors`}
            >
              <card.icon size={20} className="md:hidden" />
              <card.icon size={32} className="hidden md:block" />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400 mb-1 group-hover:text-primary transition-colors">
                  {card.label}
                </h3>
                <p className="text-slate-900 dark:text-white font-semibold text-lg">
                  {card.title}
                </p>
              </div>
              {typeof card.count === "number" && (
                <div className="ml-auto text-sm font-bold text-slate-500 bg-slate-100 dark:bg-slate-800 px-3 py-2 rounded-full">
                  {card.count}
                </div>
              )}
            </div>
          </button>
        ))}
      </section>

      {/* Drawer for rescheduling */}
      <RescheduleDrawer
        open={drawerOpen}
        bookingId={drawerBookingId ?? ""}
        currentDate={nextSession?.date ?? ""}
        onClose={() => setDrawerOpen(false)}
        onSuccess={() => setPendingSwap(true)}
      />

      {/* Bottom Section: Status & Notifications */}
      <section className="flex flex-col xl:flex-row gap-6">
        {/* Status Card */}
        <div className="flex-1 bg-white dark:bg-slate-900 rounded-3xl p-4 md:p-6 lg:p-8 border border-slate-100 dark:border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <CalendarPlus className="text-primary" size={20} />
              <h4 className="text-sm font-bold uppercase tracking-widest text-slate-500">
                Próximo Evento
              </h4>
            </div>
            <MoreHorizontal className="text-slate-300" size={20} />
          </div>
          <div className="flex flex-col items-center justify-center py-6 md:py-8 rounded-2xl">
            {dashboardLoading ? (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                  <Info size={24} />
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Carregando...
                </p>
              </div>
            ) : nextSession ? (
              <div className="w-full">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                  <div className="flex-shrink-0 w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-extrabold text-primary dark:text-white">
                        {format(parseISO((nextSession as any).date), "dd", {
                          locale: ptBR,
                        })}
                      </div>
                      <div className="text-xs md:text-sm uppercase text-slate-500">
                        {format(parseISO((nextSession as any).date), "MMM", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <p className="text-lg md:text-xl font-extrabold text-slate-900 dark:text-white">
                      {format(
                        parseISO((nextSession as any).date),
                        "EEEE, dd 'de' MMMM",
                        { locale: ptBR },
                      )}
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {(nextSession as any).time ??
                        `Turno: ${periodToLabel((nextSession as any).period)}`}
                    </p>
                    {(nextSession as any).location && (
                      <p className="text-sm text-slate-500 mt-1">
                        {(nextSession as any).location}
                      </p>
                    )}

                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-start justify-center gap-3">
                      <a
                        href="/app/agendamentos"
                        className="inline-flex items-center justify-center px-4 py-2 bg-primary text-white rounded-lg font-semibold shadow-md hover:bg-primary/90 transition-colors"
                      >
                        Ver agendamento
                      </a>

                      {drawerBookingId && (
                        <button
                          onClick={() => setDrawerOpen(true)}
                          className="inline-flex items-center px-4 py-2 border border-primary text-primary rounded-lg font-semibold bg-white/5 hover:bg-white/10 transition-colors"
                        >
                          Solicitar Reagendamento
                        </button>
                      )}

                      {pendingSwap && (
                        <span className="inline-flex items-center text-xs bg-amber-100 text-amber-800 px-3 py-1 rounded-full font-semibold">
                          Reagendamento Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-4">
                  <Info size={24} />
                </div>
                <p className="text-slate-600 dark:text-slate-400 font-medium">
                  Nenhum agendamento pendente
                </p>
                <a
                  href="/app/agendamentos"
                  className="mt-4 inline-block text-primary dark:text-blue-400 text-sm font-bold uppercase tracking-wider hover:underline"
                >
                  Ver calendário completo
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="w-full xl:w-96 bg-primary/5 dark:bg-slate-800/30 rounded-3xl p-4 md:p-6 lg:p-8 border border-primary/10 dark:border-slate-700">
          <h4 className="text-sm font-bold uppercase tracking-widest text-primary dark:text-blue-400 mb-6 flex items-center gap-2">
            <Info size={20} />
            Avisos Importantes
          </h4>
          <div className="space-y-4">
            {notifications.map((n, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-primary">
                  <Info size={20} />
                </div>
                <div>
                  <p className="text-xs font-bold text-slate-900 dark:text-white tracking-tight">
                    {n.title}
                  </p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                    {n.description}
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
