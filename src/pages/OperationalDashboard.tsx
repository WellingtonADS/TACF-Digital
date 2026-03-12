/**
 * @page OperationalDashboard
 * @description Painel operacional com estado e ações rápidas.
 * @path src/pages/OperationalDashboard.tsx
 */

import AppIcon from "@/components/atomic/AppIcon";
import { CARD_INTERACTIVE_CLASS } from "@/components/atomic/Card";
import FullPageLoading from "@/components/FullPageLoading";
import Layout from "@/components/layout/Layout";
import RescheduleDrawer from "@/components/RescheduleDrawer";
import TicketsListModal from "@/components/TicketsListModal";
import useDashboard from "@/hooks/useDashboard";
import {
  Award,
  CalendarPlus,
  ClipboardList,
  FileText,
  Info,
  MoreHorizontal,
} from "@/icons";
import supabase from "@/services/supabase";
import type { Profile as DBProfile } from "@/types";
import { formatSessionPeriod } from "@/utils/booking";
import { prefetchRoute } from "@/utils/prefetchRoutes";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export const OperationalDashboard = () => {
  const {
    user,
    profile,
    loading,
    bookingsCount,
    resultsCount,
    nextSession,
    latestOrderNumber: _latestOrderNumber,
    notifications: derivedNotifications,
    inspsauStatus: _inspsauStatus,
    loading: dashboardLoading,
  } = useDashboard();

  const typedProfile = profile as DBProfile | null;

  const displayName =
    typedProfile?.full_name ||
    typedProfile?.war_name ||
    user?.email ||
    "Usuário";

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerBookingId, setDrawerBookingId] = useState<string | null>(null);
  const [pendingSwap, setPendingSwap] = useState(false);

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
          .eq("status", "agendado")
          .maybeSingle();
        const bid = bookingData?.id;
        if (bid) {
          setDrawerBookingId(bid);
          const { data: swapData } = await supabase
            .from("swap_requests")
            .select("id")
            .eq("booking_id", bid)
            .eq("status", "solicitado");
          setPendingSwap(Array.isArray(swapData) && swapData.length > 0);
        }
      } catch (err) {
        console.error(err);
      }
    }
    checkPending();
  }, [nextSession, user]);

  const navigate = useNavigate();

  type NextSessionWithOptionalDetails = NonNullable<typeof nextSession> & {
    time?: string | null;
    location?: string | null;
  };

  const nextSessionDetails =
    nextSession as NextSessionWithOptionalDetails | null;

  const actionCards = [
    {
      icon: CalendarPlus,
      label: "Novo Agendamento",
      title: "Marcar TACF",
      iconBg: "bg-primary/5",
      iconColor: "text-primary",
      to: "/app/agendamentos",
    },
    {
      icon: ClipboardList,
      label: "Meus Testes",
      title: "Histórico",
      iconBg: "bg-primary/5",
      iconColor: "text-primary",
      to: "/app/resultados",
      count: resultsCount,
    },
    {
      icon: Award,
      label: "Confirmação",
      title: "Agendado",
      iconBg: "bg-primary/5",
      iconColor: "text-primary",
      to: "/app/ticket",
      count: bookingsCount,
    },
    {
      icon: FileText,
      label: "Documentação",
      title: "Manuais e Normas",
      iconBg: "bg-primary/5",
      iconColor: "text-primary",
      to: "/app/documentos",
    },
  ];

  const notifications = derivedNotifications;
  const [showTicketsModal, setShowTicketsModal] = useState(false);

  return loading || dashboardLoading ? (
    <FullPageLoading message="Carregando dashboard" />
  ) : (
    <Layout>
      {/* Greeting Card */}
      <section className="mb-8">
        <div className="relative overflow-hidden bg-primary rounded-3xl p-5 md:p-8 lg:p-10 text-white shadow-2xl shadow-primary/20">
          <div className="absolute inset-0 opacity-10 pointer-events-none dashboard-hero-texture" />
          <div className="relative z-10">
            <div>
              <h2 className="text-xl md:text-2xl lg:text-3xl font-bold tracking-tight">
                Olá, {displayName}
              </h2>
              <p className="text-white/80 mt-2 text-sm md:text-lg font-normal">
                Seja bem-vindo ao portal de agendamento do HACO
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Action Grid */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {actionCards.map((card, index) => (
          <button
            key={index}
            onClick={() => {
              if (card.to === "/app/ticket") setShowTicketsModal(true);
              else navigate(card.to ?? "/");
            }}
            onMouseEnter={() => {
              if (card.to) prefetchRoute(card.to);
            }}
            className={`group ${CARD_INTERACTIVE_CLASS} p-4 text-left md:p-6 lg:p-8 rounded-3xl`}
          >
            <div
              className={`h-10 w-10 md:h-14 md:w-14 rounded-2xl ${card.iconBg} flex items-center justify-center mb-3 md:mb-6 ${card.iconColor} group-hover:bg-primary group-hover:text-white transition-colors`}
            >
              <AppIcon
                icon={card.icon}
                size="sm"
                className="md:hidden"
                ariaLabel={card.label}
              />
              <AppIcon
                icon={card.icon}
                size="lg"
                className="hidden md:block"
                ariaLabel={card.label}
              />
            </div>
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted mb-1 group-hover:text-primary transition-colors">
                  {card.label}
                </h3>
                <p className="text-text-body font-semibold text-lg">
                  {card.title}
                </p>
              </div>
              {typeof card.count === "number" && (
                <div className="ml-auto text-sm font-bold text-text-muted bg-bg-card px-3 py-2 rounded-full">
                  {card.count}
                </div>
              )}
            </div>
          </button>
        ))}
      </section>
      <TicketsListModal
        open={showTicketsModal}
        onClose={() => setShowTicketsModal(false)}
      />

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
        <div className="flex-1 bg-bg-card rounded-3xl p-4 md:p-6 lg:p-8 border border-border-default shadow-lg">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <AppIcon
                icon={CalendarPlus}
                size="md"
                className="text-primary"
                ariaLabel="Proximo evento"
                decorative={false}
              />
              <h4 className="text-sm font-bold uppercase tracking-widest text-text-muted">
                Próximo Evento
              </h4>
            </div>
            <AppIcon
              icon={MoreHorizontal}
              size="md"
              className="text-text-muted"
              ariaLabel="Mais opcoes"
              decorative={true}
            />
          </div>
          <div className="flex flex-col items-center justify-center py-6 md:py-8 rounded-2xl">
            {dashboardLoading ? (
              <div className="flex flex-col items-center">
                <div className="h-12 w-12 rounded-full bg-bg-default flex items-center justify-center text-text-muted mb-4">
                  <AppIcon icon={Info} size="md" decorative={true} />
                </div>
                <p className="text-text-muted font-medium">Carregando...</p>
              </div>
            ) : nextSession ? (
              <div className="w-full">
                <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6">
                  <div className="flex-shrink-0 w-28 h-28 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 border border-border-default flex items-center justify-center">
                    <div className="text-center">
                      <div className="text-2xl md:text-3xl font-extrabold text-primary">
                        {format(parseISO(nextSession.date), "dd", {
                          locale: ptBR,
                        })}
                      </div>
                      <div className="text-xs md:text-sm uppercase text-text-muted">
                        {format(parseISO(nextSession.date), "MMM", {
                          locale: ptBR,
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="flex-1 text-center md:text-left">
                    <p className="text-lg md:text-xl font-extrabold text-text-body">
                      {format(
                        parseISO(nextSession.date),
                        "EEEE, dd 'de' MMMM",
                        { locale: ptBR },
                      )}
                    </p>
                    <p className="text-sm text-text-muted mt-1">
                      {nextSessionDetails?.time ??
                        `Turno: ${formatSessionPeriod(nextSession.period)}`}
                    </p>
                    {nextSessionDetails?.location && (
                      <p className="text-sm text-text-muted mt-1">
                        {nextSessionDetails.location}
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
                        <span className="inline-flex items-center text-xs bg-red-100 text-red-700 px-3 py-1 rounded-full font-semibold">
                          Reagendamento Pendente
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="h-12 w-12 rounded-full bg-bg-default flex items-center justify-center text-text-muted mb-4">
                  <Info size={24} />
                </div>
                <p className="text-text-muted font-medium">
                  Nenhum agendamento pendente
                </p>
                <a
                  href="/app/agendamentos"
                  className="mt-4 inline-block text-primary text-sm font-bold uppercase tracking-wider hover:underline"
                >
                  Ver calendário completo
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Info Section */}
        <div className="w-full xl:w-96 bg-primary/5 rounded-3xl p-4 md:p-6 lg:p-8 border border-primary/10">
          <h4 className="text-sm font-bold uppercase tracking-widest text-primary mb-6 flex items-center gap-2">
            <Info size={20} />
            Avisos Importantes
          </h4>
          <div className="space-y-4">
            {notifications.map((n, idx) => (
              <div
                key={idx}
                className="flex gap-4 p-4 rounded-2xl bg-bg-card border border-border-default shadow-sm"
              >
                <div className="w-10 h-10 rounded-full bg-bg-default flex items-center justify-center text-primary">
                  <AppIcon icon={Info} size="sm" decorative={true} />
                </div>
                <div>
                  <p className="text-xs font-bold text-text-body tracking-tight">
                    {n.title}
                  </p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">
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
