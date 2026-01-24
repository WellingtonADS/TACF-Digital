import SwapRequestModal from "@/components/Booking/SwapRequestModal";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { useState } from "react";
import QRCode from "react-qr-code";

export interface BookingForUI {
  id: string;
  sessions: {
    id: string;
    date: string;
    period: "morning" | "afternoon";
    max_capacity: number;
  };
  profiles: { id: string; saram: string; full_name: string; rank: string };
  status?: "confirmed" | "pending_swap" | "pending" | string;
}

export interface DigitalPassProps {
  booking: BookingForUI;
  onSwapRequested?: () => void;
}

export default function DigitalPass({
  booking,
  onSwapRequested,
}: DigitalPassProps) {
  const session = booking.sessions;
  const profile = booking.profiles;
  const date = session?.date;
  const period = session?.period;
  const bookingId = booking.id;
  const code = JSON.stringify({ saram: profile?.saram ?? "", bookingId });

  // format date DD/MM/YYYY for display
  const formattedDate = date ? new Date(date).toLocaleDateString("pt-BR") : "";

  const [modalOpen, setModalOpen] = useState(false);
  const pending =
    booking.status === "pending_swap" || booking.status === "pending";
  return (
    <div className="max-w-md mx-auto mt-12">
      <Card>
        <div className="text-center">
          <h3 className="text-xl font-semibold mb-2">Agendamento Confirmado</h3>
          <div className="text-sm text-slate-600 mb-4">
            {profile?.full_name} — {profile?.saram}
          </div>

          <div className="bg-slate-50 p-4 rounded-lg mb-4">
            <div className="text-sm text-slate-500">Data</div>
            <div className="text-lg font-bold">{formattedDate}</div>
            <div className="text-sm text-slate-500">Turno</div>
            <div className="text-lg font-bold">
              {period === "morning" ? "Manhã" : "Tarde"}
            </div>
          </div>

          <div className="flex justify-center mb-4">
            <QRCode value={code} size={128} />
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(true)}
              disabled={pending}
            >
              Solicitar Troca de Data
            </Button>
          </div>
        </div>
      </Card>

      <SwapRequestModal
        bookingId={booking.id}
        currentSessionId={session.id}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => {
          setModalOpen(false);
          onSwapRequested?.();
        }}
      />
    </div>
  );
}
