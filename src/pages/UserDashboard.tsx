import ComprovanteTicket from "@/components/Booking/ComprovanteTicket";
import CalendarGrid from "@/components/Calendar/CalendarGrid";
import { Body, H1 } from "@/components/ui/Typography";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveBooking } from "@/services/bookings";
import type { BookingWithDetails } from "@/types/database.types";
import React, { useEffect, useState } from "react";

const UserDashboard: React.FC = () => {
  const { user, profile } = useAuth();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    getActiveBooking(user.id)
      .then((b) => {
        if (mounted) setBooking(b);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading)
    return (
      <div className="p-8 text-center text-slate-500 animate-pulse">
        Carregando painel...
      </div>
    );

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col gap-1">
        <H1 className="text-3xl">
          Olá, {profile?.rank} {profile?.full_name?.split(" ")[0]}
        </H1>
        <Body className="text-slate-500">
          {booking
            ? "Você já possui um agendamento ativo. Veja os detalhes abaixo."
            : "Consulte a disponibilidade no calendário e realize seu agendamento."}
        </Body>
      </div>

      {booking ? (
        <ComprovanteTicket booking={booking} />
      ) : (
        <CalendarGrid onBookingSuccess={() => window.location.reload()} />
      )}
    </div>
  );
};

export default UserDashboard;
