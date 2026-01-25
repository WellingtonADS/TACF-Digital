import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { fetchFutureSessions, requestSwap } from "@/services/api";
import type { SessionWithBookings } from "@/types/database.types";
import toastUi from "@/utils/toast";
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
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    if (!isOpen) return;
    (async () => {
      setLoading(true);
      const res = await fetchFutureSessions();
      if (!mounted) return;
      if (res.error) setSessions([]);
      else {
        // filter out current session
        setSessions((res.data ?? []).filter((s) => s.id !== currentSessionId));
      }
      setLoading(false);
    })();
    return () => {
      mounted = false;
    };
  }, [isOpen, currentSessionId]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedSession) return toast.error("Selecione uma nova data");
    if (!reason.trim()) return toast.error("Preencha o motivo");

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
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitar Troca de Data">
      <form onSubmit={handleSubmit} className="space-y-3">
        {loading ? (
          <div>Carregando opções...</div>
        ) : (
          <div>
            <label className="text-sm font-medium">Selecione a nova data</label>
            <select
              className="w-full p-2 rounded border"
              value={selectedSession ?? ""}
              onChange={(e) => setSelectedSession(e.target.value)}
            >
              <option value="">-- selecione --</option>
              {sessions.map((s) => {
                const booked = s.bookings?.length ?? 0;
                const isFull = booked >= s.max_capacity;
                // Do not disable options client-side; backend enforces capacity/quorum.
                return (
                  <option key={s.id} value={s.id}>
                    {s.date} - {s.period === "morning" ? "Manhã" : "Tarde"}{" "}
                    {isFull ? "(Lotado)" : ""}
                  </option>
                );
              })}
            </select>
          </div>
        )}

        <div>
          <label className="text-sm font-medium">Motivo</label>
          <textarea
            className="w-full p-2 rounded border"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
        </div>

        <div className="flex gap-2">
          <Button type="submit" isLoading={submitting} disabled={submitting}>
            Enviar
          </Button>
          <Button variant="outline" onClick={onClose}>
            Fechar
          </Button>
        </div>
      </form>
    </Modal>
  );
}
