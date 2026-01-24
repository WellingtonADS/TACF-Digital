import DigitalPass from "@/components/Booking/DigitalPass";
import CalendarGrid from "@/components/Calendar/CalendarGrid";
import MainLayout from "@/components/Layout/MainLayout";
import { getUserBooking } from "@/services/api";
import { useEffect, useState } from "react";

export default function UserDashboard() {
  const [booking, setBooking] = useState<null | {
    id: string;
    sessions: {
      id: string;
      date: string;
      period: "morning" | "afternoon";
      max_capacity: number;
    };
    profiles: { id: string; saram: string; full_name: string; rank: string };
  } | null>(null);
  const [loading, setLoading] = useState(true);

  async function checkBooking() {
    setLoading(true);
    const res = await getUserBooking();
    if (!res.error && res.data) setBooking(res.data);
    else setBooking(null);
    setLoading(false);
  }

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!mounted) return;
      await checkBooking();
    })();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <MainLayout>
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold">Painel do Militar</h2>
        {loading ? (
          <div>Carregando...</div>
        ) : booking ? (
          <DigitalPass booking={booking} />
        ) : (
          <CalendarGrid onBookingSuccess={checkBooking} />
        )}
      </div>
    </MainLayout>
  );
}
