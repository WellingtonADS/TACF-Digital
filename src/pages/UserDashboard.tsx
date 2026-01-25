import DigitalPass from "@/components/Booking/DigitalPass";
import CalendarGrid from "@/components/Calendar/CalendarGrid";
import MainLayout from "@/components/Layout/MainLayout";
import { Body, Card, H1 } from "@/components/ui";
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
        <H1>Painel do Militar</H1>
        {loading ? (
          <Card>
            <Body>Carregando...</Body>
          </Card>
        ) : booking ? (
          <DigitalPass booking={booking} />
        ) : (
          <Card>
            <CalendarGrid onBookingSuccess={checkBooking} />
          </Card>
        )}
      </div>
    </MainLayout>
  );
}
