import BookingConfirmationModal from "@/components/Booking/BookingConfirmationModal";
import ComprovanteTicket from "@/components/Booking/ComprovanteTicket";
import CalendarGrid from "@/components/Calendar/CalendarGrid";
import { Card } from "@/components/ui/Card";
import { Body, H1 } from "@/components/ui/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { confirmBooking, fetchFutureSessions } from "@/services/api";
import { getActiveBooking } from "@/services/bookings";
import { upsertProfile } from "@/services/supabase";
import type {
  BookingWithDetails,
  SessionWithBookings,
} from "@/types/database.types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertTriangle, ArrowRight, History, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "sonner";

const UserDashboard: React.FC = () => {
  const { user, profile, loading: authLoading } = useAuth();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [allSessions, setAllSessions] = useState<SessionWithBookings[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Estados para o Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [daySessions, setDaySessions] = useState<SessionWithBookings[]>([]);
  const [confirmLoading, setConfirmLoading] = useState(false);

  // Verificação de cadastro completo
  const isProfileComplete = !!(
    profile?.full_name &&
    profile?.rank &&
    profile?.saram &&
    profile?.war_name &&
    profile?.sector
  );

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;

    const fetchData = async () => {
      try {
        // 1. Agendamento ativo
        const b = await getActiveBooking(user.id);
        if (mounted && b) setBooking(b as any);

        // 2. Sessões futuras para popular calendário
        const sessionsRes = await fetchFutureSessions();
        if (mounted && sessionsRes.data) {
          setAllSessions(sessionsRes.data as unknown as SessionWithBookings[]);
        }
      } catch (error) {
        console.error(error);
      } finally {
        if (mounted) setDataLoading(false);
      }
    };

    fetchData();
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  // Handler: Quando clica em uma data no Calendário
  const handleDateSelect = (date: string) => {
    if (booking) {
      toast.error("Você já possui um agendamento ativo.");
      return;
    }
    if (!isProfileComplete) {
      toast.error("Complete seu cadastro antes de agendar.");
      return;
    }

    const sessionsForDay = allSessions.filter(
      (s) => s.date === date && s.status === "open",
    );
    if (sessionsForDay.length === 0) {
      toast.info("Não há turnos disponíveis nesta data.");
      return;
    }

    setSelectedDate(date);
    setDaySessions(sessionsForDay);
    setIsModalOpen(true);
  };

  // Handler: Confirmação vinda do Modal
  const handleConfirmBooking = async (
    sessionId: string,
    tafType: "1" | "2",
  ) => {
    if (!user) return;
    setConfirmLoading(true);

    try {
      if (profile?.semester !== tafType) {
        await upsertProfile({ id: user.id, semester: tafType } as any);
      }

      const result = await confirmBooking(sessionId);
      if (result.success) {
        toast.success("Agendamento Confirmado!");
        setIsModalOpen(false);
        window.location.reload();
      } else {
        toast.error(result.error || "Erro ao agendar.");
      }
    } catch (error) {
      toast.error("Erro de conexão.");
    } finally {
      setConfirmLoading(false);
    }
  };

  if (authLoading || dataLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin mb-2" />
        <p className="text-sm">Carregando...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-12">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <H1 className="text-3xl">
          Olá,{" "}
          {profile?.war_name || profile?.full_name?.split(" ")[0] || "Militar"}
        </H1>
        <Body className="text-slate-500">
          Consulte a disponibilidade no calendário e realize seu agendamento.
        </Body>
      </div>

      {/* Alerta de Perfil Incompleto */}
      {!isProfileComplete && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-orange-100 text-orange-600 rounded-lg shrink-0">
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 className="font-bold text-orange-800 text-sm">
                Cadastro Pendente
              </h4>
              <p className="text-orange-700 text-xs mt-1">
                Seus dados (SARAM, Setor, Nome de Guerra) estão incompletos.
              </p>
            </div>
          </div>
          <Link
            to="/profile"
            className="text-sm font-bold text-orange-700 hover:text-orange-900 flex items-center gap-1 whitespace-nowrap bg-white/50 px-3 py-2 rounded-lg border border-orange-200"
          >
            Completar Agora <ArrowRight size={16} />
          </Link>
        </div>
      )}

      {/* LAYOUT PRINCIPAL: 2 COLUNAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* COLUNA ESQUERDA: Agendamento Atual ou Calendário (Ocupa 2/3) */}
        <div className="lg:col-span-2 space-y-6">
          {booking ? (
            <ComprovanteTicket booking={booking} />
          ) : (
            <CalendarGrid
              sessions={allSessions}
              onDateSelect={handleDateSelect}
              onBookingSuccess={() => window.location.reload()}
              isAdmin={false}
            />
          )}
        </div>

        {/* COLUNA DIREITA: Histórico / Resumo (Ocupa 1/3) */}
        <div className="space-y-6">
          <Card className="h-full border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-2 mb-6 text-slate-800">
              <History className="w-5 h-5 text-primary" />
              <h3 className="font-bold text-lg">Resumo de Agendamentos</h3>
            </div>

            <div className="space-y-6 relative">
              <div className="absolute left-[7px] top-2 bottom-2 w-[2px] bg-slate-100" />

              {booking && (
                <div className="relative pl-6">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-green-500 border-4 border-white shadow-sm" />
                  <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
                    Agendamento Atual
                  </div>
                  <div className="font-medium text-slate-900">
                    {format(
                      parseISO(booking.session.date),
                      "dd 'de' MMMM 'de' yyyy",
                      { locale: ptBR },
                    )}
                  </div>
                  <div className="text-sm text-slate-500 mt-0.5">
                    Turno:{" "}
                    {booking.session.period === "morning" ? "Manhã" : "Tarde"}
                  </div>
                  <div className="text-xs text-blue-600 font-bold mt-2 bg-blue-50 inline-block px-2 py-1 rounded">
                    Confirmado
                  </div>
                </div>
              )}

              {!booking && (
                <div className="relative pl-6 opacity-60">
                  <div className="absolute left-0 top-1.5 w-4 h-4 rounded-full bg-slate-300 border-4 border-white" />
                  <p className="text-sm text-slate-500 italic">
                    Nenhum agendamento ativo. Selecione uma data no calendário
                    para agendar.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* MODAL DE CONFIRMAÇÃO */}
      <BookingConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={handleConfirmBooking}
        date={selectedDate}
        availableSessions={daySessions}
        loading={confirmLoading}
      />
    </div>
  );
};

export default UserDashboard;
