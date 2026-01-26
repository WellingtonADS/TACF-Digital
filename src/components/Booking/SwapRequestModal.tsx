import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/Select";
import { fetchFutureSessions, requestSwap } from "@/services/api";
import type { SessionWithBookings } from "@/types/database.types";
import toastUi from "@/utils/toast";
import { format, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";
import { AlertCircle, Calendar } from "lucide-react";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface SwapRequestModalProps {
  bookingId: string;
  currentSessionId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function SwapRequestModal({
  bookingId,
  currentSessionId,
  isOpen,
  onClose,
  onSuccess,
}: SwapRequestModalProps) {
  const [sessions, setSessions] = useState<SessionWithBookings[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [reason, setReason] = useState("");
  const [selectedSession, setSelectedSession] = useState<string>("");

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;

    const loadOptions = async () => {
      setLoading(true);
      const res = await fetchFutureSessions();
      if (mounted) {
        if (res.error) {
          toast.error("Erro ao carregar datas disponíveis");
          setSessions([]);
        } else {
          // Filtra a sessão atual para não aparecer na lista de troca
          setSessions(
            (res.data ?? []).filter((s) => s.id !== currentSessionId),
          );
        }
        setLoading(false);
      }
    };

    loadOptions();
    return () => {
      mounted = false;
    };
  }, [isOpen, currentSessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSession)
      return toast.error("Selecione uma nova data para o teste.");
    if (!reason.trim())
      return toast.error("É obrigatório informar o motivo da troca.");

    setSubmitting(true);
    const res = await requestSwap(bookingId, selectedSession, reason);
    setSubmitting(false);

    if (res.success) {
      toastUi.swapPending();
      onSuccess?.();
      onClose();
    } else {
      toastUi.genericError(res.error ?? "Erro ao enviar solicitação");
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Solicitar Troca de Data"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-6 pt-2">
        {/* Aviso */}
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex gap-3 text-sm text-blue-800">
          <AlertCircle size={20} className="shrink-0" />
          <p>
            A troca está sujeita à aprovação do coordenador e disponibilidade de
            vagas na nova data.
          </p>
        </div>

        {/* Seleção de Data */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Nova Data Desejada
          </label>
          {loading ? (
            <div className="h-12 w-full bg-slate-100 animate-pulse rounded-xl" />
          ) : (
            <Select value={selectedSession} onValueChange={setSelectedSession}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione um turno disponível..." />
              </SelectTrigger>
              <SelectContent>
                {sessions.length === 0 ? (
                  <div className="p-4 text-center text-sm text-slate-500">
                    Nenhuma data futura disponível.
                  </div>
                ) : (
                  sessions.map((s) => {
                    const booked = s.bookings?.length ?? 0;
                    const isFull = booked >= (s.max_capacity ?? 0);
                    const dateFormatted = format(
                      parseISO(s.date),
                      "dd/MM (EEEE)",
                      { locale: ptBR },
                    );
                    const period = s.period === "morning" ? "Manhã" : "Tarde";

                    return (
                      <SelectItem key={s.id} value={s.id} disabled={isFull}>
                        <span className="flex items-center gap-2">
                          <Calendar size={14} className="opacity-50" />
                          <span className="capitalize">{dateFormatted}</span>
                          <span className="text-slate-400 mx-1">•</span>
                          {period}
                          {isFull && (
                            <span className="ml-2 text-red-500 text-xs font-bold">
                              (LOTADO)
                            </span>
                          )}
                        </span>
                      </SelectItem>
                    );
                  })
                )}
              </SelectContent>
            </Select>
          )}
        </div>

        {/* Motivo */}
        <div className="space-y-2">
          <label className="text-sm font-semibold text-slate-700">
            Justificativa
          </label>
          <textarea
            className="w-full p-4 rounded-xl border border-slate-200 bg-slate-50 text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 min-h-[120px] resize-none"
            placeholder="Descreva o motivo da solicitação (Ex: Escala de serviço, dispensa médica...)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        {/* Ações */}
        <div className="flex gap-3 pt-4 border-t border-slate-50">
          <Button
            variant="outline"
            type="button"
            onClick={onClose}
            className="w-1/3"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            isLoading={submitting}
            disabled={submitting}
            className="w-2/3 shadow-lg shadow-primary/20"
          >
            Enviar Solicitação
          </Button>
        </div>
      </form>
    </Modal>
  );
}
