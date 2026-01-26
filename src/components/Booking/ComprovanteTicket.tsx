import Button from "@/components/ui/Button";
import type { BookingWithDetails } from "@/types/database.types";
import { generateReceipt } from "@/utils/receipt/generateReceipt";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import {
  Calendar,
  Clock,
  Download,
  Hash,
  Plane,
  RefreshCw,
  User,
} from "lucide-react";
import { useState } from "react";
import QRCode from "react-qr-code";
import { toast } from "sonner";
import SwapRequestModal from "./SwapRequestModal";

type Props = {
  booking: BookingWithDetails;
};

export default function ComprovanteTicket({ booking }: Props) {
  const [swapModalOpen, setSwapModalOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const session = booking.session;
  const user = booking.user;

  const dateObj = session?.date ? parseISO(session.date) : null;
  const formattedDate = dateObj
    ? format(dateObj, "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
    : "—";
  const dayName = dateObj ? format(dateObj, "EEEE", { locale: ptBR }) : "";

  const periodLabel = session?.period === "morning" ? "MANHÃ" : "TARDE";
  const timeLabel =
    session?.period === "morning" ? "08:00h - 12:00h" : "13:00h - 17:00h";

  // Payload simples para o leitor
  const qrPayload = JSON.stringify({
    id: booking.id,
    saram: user?.saram,
  });

  const handleDownload = async () => {
    setDownloading(true);
    try {
      await generateReceipt({
        booking_id: booking.id,
        saram: user?.saram ?? "",
        full_name: user?.full_name ?? "",
        rank: user?.rank ?? "",
        date: session?.date ?? "",
        period: session?.period === "morning" ? "Manhã" : "Tarde",
      });
      toast.success("PDF gerado com sucesso!");
    } catch (error) {
      console.error(error);
      toast.error("Erro ao gerar PDF.");
    } finally {
      setDownloading(false);
    }
  };

  const isPendingSwap = booking.status === "pending_swap";

  return (
    <div className="w-full max-w-4xl mx-auto my-4 font-inter">
      {/* Ticket Container */}
      <div className="bg-white rounded-3xl shadow-xl overflow-hidden border border-slate-200 flex flex-col md:flex-row min-h-[400px]">
        {/* Lado Esquerdo: Informações do Militar (Azul) */}
        <div className="bg-[#1B365D] text-white p-8 md:w-[65%] relative overflow-hidden flex flex-col justify-between">
          {/* Marca d'água decorativa */}
          <Plane className="absolute -right-10 -bottom-10 w-64 h-64 text-white/5 rotate-[-15deg] pointer-events-none" />

          {/* Header do Ticket */}
          <div className="relative z-10 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-white/10 rounded-xl backdrop-blur-sm">
                <Plane className="w-6 h-6 -rotate-45 text-blue-200" />
              </div>
              <div>
                <h3 className="font-bold text-xl tracking-tight leading-none">
                  TACF DIGITAL
                </h3>
                <p className="text-[10px] text-blue-200 uppercase tracking-[0.2em] mt-1">
                  Boarding Pass
                </p>
              </div>
            </div>

            <div
              className={`px-3 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wide ${
                isPendingSwap
                  ? "bg-orange-500/20 text-orange-200 border-orange-500/30"
                  : "bg-green-500/20 text-green-300 border-green-500/30"
              }`}
            >
              {isPendingSwap ? "Troca Solicitada" : "Confirmado"}
            </div>
          </div>

          {/* Dados Principais */}
          <div className="relative z-10 space-y-8 mt-8">
            <div>
              <p className="text-blue-300 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                <User size={10} /> Militar
              </p>
              <h2 className="text-3xl font-bold truncate">{user?.full_name}</h2>
              <div className="flex items-center gap-3 mt-1 text-sm text-blue-100">
                <span className="font-medium bg-white/10 px-2 py-0.5 rounded">
                  {user?.rank}
                </span>
                <span className="flex items-center gap-1 opacity-80">
                  <Hash size={12} /> {user?.saram}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div>
                <p className="text-blue-300 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                  <Calendar size={10} /> Data do Teste
                </p>
                <p className="font-semibold text-xl capitalize">{dayName}</p>
                <p className="text-sm opacity-80">{formattedDate}</p>
              </div>
              <div>
                <p className="text-blue-300 text-[10px] uppercase font-bold tracking-wider mb-1 flex items-center gap-1">
                  <Clock size={10} /> Turno & Horário
                </p>
                <p className="font-semibold text-xl">{periodLabel}</p>
                <p className="text-sm opacity-80">{timeLabel}</p>
              </div>
            </div>
          </div>

          {/* Footer do Lado Azul */}
          <div className="relative z-10 mt-8 pt-6 border-t border-white/10 flex items-end justify-between">
            <div>
              <p className="text-[10px] text-blue-400 uppercase">Localização</p>
              <p className="text-sm font-medium">
                Pista de Atletismo • Ala Sul
              </p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-blue-400 uppercase">
                ID do Agendamento
              </p>
              <p className="font-mono text-sm tracking-widest opacity-80">
                {booking.id.slice(0, 8).toUpperCase()}
              </p>
            </div>
          </div>
        </div>

        {/* Lado Direito: QR Code e Ações (Branco) */}
        <div className="bg-white p-8 md:w-[35%] flex flex-col items-center justify-between border-t md:border-t-0 md:border-l-2 border-dashed border-slate-200 relative">
          {/* Efeito de "Picote" (Círculos) */}
          <div className="absolute -top-3 left-1/2 md:-left-3 md:top-1/2 w-6 h-6 bg-slate-50 rounded-full z-20" />
          <div className="absolute -bottom-3 left-1/2 md:-left-3 md:top-1/2 w-6 h-6 bg-slate-50 rounded-full z-20" />

          <div className="text-center w-full flex-1 flex flex-col justify-center">
            <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-4">
              Scan para Acesso
            </p>
            <div className="bg-white p-3 rounded-2xl border-2 border-slate-100 mx-auto">
              <QRCode value={qrPayload} size={140} className="w-full h-auto" />
            </div>
            <p className="mt-4 text-[10px] text-slate-400 leading-tight px-4">
              Apresente este código ao oficial aplicador na entrada do pátio.
            </p>
          </div>

          {/* Botões de Ação */}
          <div className="w-full space-y-2 mt-6">
            <Button
              onClick={handleDownload}
              isLoading={downloading}
              variant="outline"
              className="w-full text-xs h-9 border-slate-200"
            >
              <Download size={14} className="mr-2" /> Baixar PDF
            </Button>

            <Button
              onClick={() => setSwapModalOpen(true)}
              disabled={isPendingSwap}
              variant="ghost"
              className="w-full text-xs h-9 text-slate-500 hover:text-slate-800"
            >
              <RefreshCw size={14} className="mr-2" />
              {isPendingSwap ? "Troca em Análise" : "Solicitar Troca"}
            </Button>
          </div>
        </div>
      </div>

      <SwapRequestModal
        bookingId={booking.id}
        currentSessionId={session?.id ?? ""}
        isOpen={swapModalOpen}
        onClose={() => setSwapModalOpen(false)}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
}
