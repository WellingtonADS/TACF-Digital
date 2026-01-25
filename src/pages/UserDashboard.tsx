import ComprovanteTicket from "@/components/Booking/ComprovanteTicket";
import CalendarGrid from "@/components/Calendar/CalendarGrid";
import { useAuth } from "@/contexts/AuthContext";
import { getActiveBooking } from "@/services/bookings";
import type { BookingWithDetails } from "@/types/database.types";
import React, { useEffect, useState } from "react";

const UserDashboard: React.FC = () => {
  const { user } = useAuth();
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.id) return;
    let mounted = true;
    setLoading(true);
    getActiveBooking(user.id)
      .then((b) => {
        if (!mounted) return;
        setBooking(b);
      })
      .finally(() => {
        if (!mounted) return;
        setLoading(false);
      });

    return () => {
      mounted = false;
    };
  }, [user?.id]);

  if (loading) return <div>Carregando...</div>;

  return (
    <div className="p-6">
      {booking ? (
        <ComprovanteTicket booking={booking} />
      ) : (
        <div>
          <h2 className="text-xl font-semibold mb-4">Agendar Sessão</h2>
          <CalendarGrid />
        </div>
      )}
    </div>
  );
};

export default UserDashboard;
