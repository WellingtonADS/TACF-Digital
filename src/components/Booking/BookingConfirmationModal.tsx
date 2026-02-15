import Button from "@/components/ui/Button";
import {
  Calendar as CalendarIcon,
  CheckCircle2,
  Info,
  Mail,
  MapPin,
  Moon,
  Sun,
  X,
} from "@/components/ui/icons";
import type { SessionWithBookings } from "@/types/database.types";
import { cn } from "@/utils/cn";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useEffect, useState } from "react";

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
  const [selectedTaf, setSelectedTaf] = useState<"1" | "2">("1");
  const [selectedPeriod, setSelectedPeriod] = useState<
    "morning" | "afternoon" | null
  >(null);

  useEffect(() => {
    if (!isOpen) return;
    // Schedule reset on next tick to avoid synchronous setState in effect body
    const id = window.setTimeout(() => {
      setSelectedTaf("1");
      // Auto-select the only available period for convenience/tests
      const hasMorning = availableSessions.some((s) => s.period === "morning");
      const hasAfternoon = availableSessions.some(
        (s) => s.period === "afternoon",
      );
      if (hasMorning && !hasAfternoon) setSelectedPeriod("morning");
      else if (!hasMorning && hasAfternoon) setSelectedPeriod("afternoon");
      else setSelectedPeriod(null);
    }, 0);

    return () => window.clearTimeout(id);
  }, [isOpen, date, availableSessions]);

  if (!isOpen || !date) return null;

  const dateObj = parseISO(date);
  const formattedDate = format(dateObj, "EEEE, dd 'de' MMMM 'de' yyyy", {
    locale: ptBR,
  });
  const displayDate =
    formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1);

  const hasMorning = availableSessions.some((s) => s.period === "morning");
  const hasAfternoon = availableSessions.some((s) => s.period === "afternoon");

  const handleConfirm = () => {
    if (!selectedPeriod) return;
    const session = availableSessions.find((s) => s.period === selectedPeriod);
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
          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider flex items-center gap-2">
              1. Selecione a Referência{" "}
              <Info size={14} className="text-slate-400" />
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => setSelectedTaf("1")}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  selectedTaf === "1"
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20"
                    : "border-slate-100 hover:border-slate-200 bg-white",
                )}
              >
                <span className="block text-lg font-bold text-slate-900">
                  TAF 1
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  1º Semestre
                </span>
                {selectedTaf === "1" && (
                  <CheckCircle2 className="absolute top-4 right-4 text-blue-600 w-5 h-5" />
                )}
              </button>

              <button
                onClick={() => setSelectedTaf("2")}
                className={cn(
                  "relative p-4 rounded-xl border-2 text-left transition-all",
                  selectedTaf === "2"
                    ? "border-blue-600 bg-blue-50/50 ring-1 ring-blue-600/20"
                    : "border-slate-100 hover:border-slate-200 bg-white",
                )}
              >
                <span className="block text-lg font-bold text-slate-900">
                  TAF 2
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  2º Semestre
                </span>
                {selectedTaf === "2" && (
                  <CheckCircle2 className="absolute top-4 right-4 text-blue-600 w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-sm font-bold text-slate-700 uppercase tracking-wider">
              2. Escolha o Turno
            </label>
            <div className="space-y-3">
              <button
                onClick={() => hasMorning && setSelectedPeriod("morning")}
                disabled={!hasMorning}
                className={cn(
                  "w-full flex items-center p-4 rounded-xl border-2 transition-all group",
                  !hasMorning
                    ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100"
                    : selectedPeriod === "morning"
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-100 hover:border-blue-200 bg-white",
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-lg mr-4",
                    selectedPeriod === "morning"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Sun size={24} />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-slate-900">
                    Turno da Manhã
                  </span>
                  <span className="text-sm text-slate-500">
                    Início às 08:00hs
                  </span>
                </div>
                {!hasMorning && (
                  <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-50 rounded">
                    Indisponível
                  </span>
                )}
                {selectedPeriod === "morning" && (
                  <CheckCircle2 className="text-blue-600 w-6 h-6" />
                )}
              </button>

              <button
                onClick={() => hasAfternoon && setSelectedPeriod("afternoon")}
                disabled={!hasAfternoon}
                className={cn(
                  "w-full flex items-center p-4 rounded-xl border-2 transition-all group",
                  !hasAfternoon
                    ? "opacity-50 cursor-not-allowed bg-slate-50 border-slate-100"
                    : selectedPeriod === "afternoon"
                      ? "border-blue-600 bg-blue-50/50"
                      : "border-slate-100 hover:border-blue-200 bg-white",
                )}
              >
                <div
                  className={cn(
                    "p-3 rounded-lg mr-4",
                    selectedPeriod === "afternoon"
                      ? "bg-blue-100 text-blue-600"
                      : "bg-slate-100 text-slate-500",
                  )}
                >
                  <Moon size={24} />
                </div>
                <div className="text-left flex-1">
                  <span className="block font-bold text-slate-900">
                    Turno da Tarde
                  </span>
                  <span className="text-sm text-slate-500">
                    Início às 13:30hs
                  </span>
                </div>
                {!hasAfternoon && (
                  <span className="text-xs font-bold text-red-400 px-2 py-1 bg-red-50 rounded">
                    Indisponível
                  </span>
                )}
                {selectedPeriod === "afternoon" && (
                  <CheckCircle2 className="text-blue-600 w-6 h-6" />
                )}
              </button>
            </div>
          </div>

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
