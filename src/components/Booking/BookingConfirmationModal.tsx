import Button from "@/components/ui/Button";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Clock, Mail, MapPin, Phone } from "lucide-react";

interface SessionData {
  id: string;
  date: string;
  period: "morning" | "afternoon";
}

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  session: SessionData | null;
  loading?: boolean;
}

export default function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  session,
  loading = false,
}: BookingConfirmationModalProps) {
  if (!isOpen || !session) return null;

  const dateObj = parseISO(session.date);
  const formattedDate = format(dateObj, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const displayDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 pt-8 pb-4">
          <h2 className="text-2xl font-bold text-slate-900">Agendamento</h2>
          <p className="text-slate-500 text-sm mt-1">
            Confira os dados antes de confirmar.
          </p>
        </div>

        <div className="px-8 space-y-6">
          <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
            <div className="text-lg font-bold text-slate-800">
              {displayDate}
            </div>
            <div className="flex items-center gap-2 mt-1 text-slate-600 font-medium">
              <span className="capitalize">Tipo: TACF</span>
              <span>•</span>
              <span>
                Turno:{" "}
                {session.period === "morning"
                  ? "Manhã (08:00)"
                  : "Tarde (13:30)"}
              </span>
            </div>
          </div>

          <div className="space-y-4 text-sm text-slate-600">
            <div className="flex items-start gap-3">
              <MapPin className="w-5 h-5 text-primary shrink-0" />
              <div>
                <span className="block font-semibold text-slate-900">
                  Local:
                </span>
                Hospital de Aeronáutica de Manaus (HAMN)
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-primary shrink-0" />
              <div>
                <span className="block font-semibold text-slate-900">
                  Horário:
                </span>
                {session.period === "morning" ? "08:00hs" : "13:30hs"} / Por
                ordem de chegada
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Mail className="w-5 h-5 text-primary shrink-0" />
              <div>
                <span className="block font-semibold text-slate-900">
                  E-mail:
                </span>
                sac.hamn@fab.mil.br
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Phone className="w-5 h-5 text-primary shrink-0" />
              <div>
                <span className="block font-semibold text-slate-900">
                  Telefone:
                </span>
                (92) 3625-0000 (Ramal: 123)
              </div>
            </div>
          </div>
        </div>

        <div className="p-8 flex gap-3 flex-col sm:flex-row mt-2">
          <Button
            onClick={onConfirm}
            isLoading={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white rounded-xl py-6 text-base font-semibold shadow-xl shadow-blue-200"
          >
            Confirmar Agendamento
          </Button>

          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 rounded-xl py-6 text-base border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Cancelar
          </Button>
        </div>
      </div>
    </div>
  );
}
