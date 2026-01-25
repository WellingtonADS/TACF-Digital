import type { BookingWithDetails } from "@/types/database.types";
import { cn } from "@/utils/cn";
import { format, parseISO } from "date-fns";

type Props = {
  booking: BookingWithDetails;
};

export default function ComprovanteTicket({ booking }: Props) {
  const session = booking.session;
  const sessionDate = session?.date
    ? format(parseISO(session.date), "dd/MM/yyyy")
    : "—";
  const periodLabel =
    session?.period === "morning"
      ? "Manhã"
      : session?.period === "afternoon"
        ? "Tarde"
        : "—";

  return (
    <div className={cn("max-w-xl mx-auto bg-white shadow-lg rounded-lg p-6")}>
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-semibold text-[#1B365D]">
            Comprovante de Agendamento
          </h3>
          <p className="text-sm text-gray-600">Número: {booking.id}</p>
        </div>
        <div className="text-right">
          <p className="text-sm text-gray-500">Status</p>
          <p className="text-lg font-medium text-green-600">
            {booking.status === "confirmed" ? "Confirmado" : booking.status}
          </p>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4">
        <div>
          <p className="text-xs text-gray-500">Nome</p>
          <p className="font-medium">{booking.user?.full_name ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">SARAM</p>
          <p className="font-medium">{booking.user?.saram ?? "—"}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Data</p>
          <p className="font-medium">{sessionDate}</p>
        </div>
        <div>
          <p className="text-xs text-gray-500">Turno</p>
          <p className="font-medium">{periodLabel}</p>
        </div>
      </div>

      <div className="mt-6 border-t pt-4 text-sm text-gray-600">
        <p>Apresente este comprovante no atendimento.</p>
      </div>
    </div>
  );
}
