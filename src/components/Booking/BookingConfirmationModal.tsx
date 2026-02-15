import Button from "@/components/ui/Button";
import {
  Calendar as CalendarIcon,
  Mail,
  MapPin,
  X,
} from "@/components/ui/icons";
import useBookingConfirmation from "@/hooks/useBookingConfirmation";
import type { SessionWithBookings } from "@/types/database.types";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import PeriodSelector from "./PeriodSelector";
import TafSelector from "./TafSelector";

interface BookingConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (sessionId: string, tafType: "1" | "2") => void;
  date: string | null;
  availableSessions: SessionWithBookings[];
  loading?: boolean;
}

export default function BookingConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  date,
  availableSessions,
  loading = false,
}: BookingConfirmationModalProps) {
  const {
    selectedTaf,
    setSelectedTaf,
    selectedPeriod,
    setSelectedPeriod,
    hasMorning,
    hasAfternoon,
    getSelectedSession,
  } = useBookingConfirmation({ isOpen, date, availableSessions });

  if (!isOpen || !date) return null;

  const dateObj = parseISO(date);
  const formattedDate = format(dateObj, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const displayDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const handleConfirm = () => {
    const session = getSelectedSession();
    if (session) onConfirm(session.id, selectedTaf);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        <div className="bg-slate-50 px-8 py-6 border-b border-slate-100 flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">
              Confirmar Presença
            </h2>
            <p className="text-slate-500 text-sm mt-1 flex items-center gap-2">
              <CalendarIcon size={14} /> {displayDate}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto space-y-8">
          <TafSelector selectedTaf={selectedTaf} onSelect={setSelectedTaf} />

          <PeriodSelector
            selectedPeriod={selectedPeriod}
            onSelect={setSelectedPeriod}
            hasMorning={hasMorning}
            hasAfternoon={hasAfternoon}
          />

          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-primary" />
              <span className="font-semibold text-slate-800">Local:</span> HAAF
              - Pista de Atletismo
            </div>
            <div className="flex items-center gap-2">
              <Mail size={16} className="text-primary" />
              <span className="font-semibold text-slate-800">
                Dúvidas:
              </span>{" "}
              edfisica.haaf@fab.mil.br
            </div>
          </div>
        </div>

        <div className="p-6 border-t border-slate-100 flex gap-3 bg-white">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="flex-1 h-12 text-base"
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            isLoading={loading}
            disabled={!selectedPeriod}
            className="flex-[2] h-12 text-base bg-[#1B365D] hover:bg-[#1B365D]/90 shadow-lg shadow-blue-900/20"
          >
            Confirmar
          </Button>
        </div>
      </div>
    </div>
  );
}
