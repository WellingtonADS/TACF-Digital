import SwapRequestModal from "@/components/Booking/SwapRequestModal";
import Button from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useState } from "react";
import QRCode from "react-qr-code";

export interface BookingForUI {
  id: string;
  order_number?: string | null;
  sessions: {
    id: string;
    date: string;
    period: "morning" | "afternoon";
    max_capacity: number;
  };
  profiles: { id: string; full_name: string; rank: string };
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
  const dateStr = session?.date;
  const period = session?.period;
  const bookingId = booking.id;

  const code = JSON.stringify({
    order_number: booking.order_number ?? null,
    bookingId,
  });

  const formattedDate = dateStr
    ? format(parseISO(dateStr), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "—";

  const [modalOpen, setModalOpen] = useState(false);
  const pending =
    booking.status === "pending_swap" || booking.status === "pending";

  return (
    <div className="max-w-md mx-auto mt-8 animate-in fade-in slide-in-from-bottom-4">
      <Card shadow="lg" className="border border-slate-200">
        <div className="text-center p-6">
          <h3 className="text-xl font-bold text-primary mb-1">
            Agendamento Confirmado
          </h3>
          <p className="text-sm text-slate-500 mb-6 font-medium">
            {profile?.full_name} — {booking.order_number ?? "—"}
          </p>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Data
                </div>
                <div className="text-base font-bold text-slate-800 capitalize">
                  {formattedDate}
                </div>
              </div>
              <div>
                <div className="text-xs text-slate-400 uppercase font-bold tracking-wider">
                  Turno
                </div>
                <div className="text-base font-bold text-slate-800">
                  {period === "morning" ? "Manhã" : "Tarde"}
                </div>
              </div>
            </div>
          </div>

          <div className="mb-6 bg-white p-2 inline-block rounded-xl border border-slate-100 shadow-sm">
            <QRCode value={code} size={140} className="w-full h-auto" />
          </div>

          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => setModalOpen(true)}
              disabled={pending}
              className="w-full"
            >
              {pending ? "Troca Solicitada" : "Solicitar Troca de Data"}
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
