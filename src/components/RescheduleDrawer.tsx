/**
 * @page RescheduleDrawer
 * @description Drawer para solicitar ou visualizar trocas de sessão.
 * @path src/components/RescheduleDrawer.tsx
 */

import type { SessionAvailability } from "@/hooks/useSessions";
import { createSwapRequest } from "@/services/bookings";
import supabase from "@/services/supabase";
import { formatSessionPeriod } from "@/utils/booking";
import { useEffect, useState } from "react";
import { toast } from "sonner";

function getSwapErrorMessage(error: unknown): string {
  const raw =
    error instanceof Error
      ? error.message
      : typeof error === "string"
        ? error
        : "";
  const message = raw.toLowerCase();

  if (message.includes("ja existe solicitacao pendente")) {
    return "Já existe uma solicitação pendente para este agendamento.";
  }
  if (
    message.includes("reagendamento disponivel apenas para inapto ou falta")
  ) {
    return "Reagendamento disponível apenas para militar inapto ou com falta registrada.";
  }
  if (message.includes("nova sessao nao encontrada")) {
    return "Sessão de destino inválida. Selecione outra opção.";
  }

  return "Falha ao enviar solicitação";
}

interface Props {
  bookingId: string;
  currentDate: string;
  open: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function RescheduleDrawer({
  bookingId,
  currentDate,
  open,
  onClose,
  onSuccess,
}: Props) {
  const [newDate, setNewDate] = useState("");
  const [availableSessions, setAvailableSessions] = useState<
    SessionAvailability[]
  >([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState("");
  const [reason, setReason] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!open) {
      setNewDate("");
      setAvailableSessions([]);
      setSelectedSessionId("");
      setReason("");
      setFile(null);
    }
  }, [open]);

  async function fetchSessionsForDate(date: string) {
    setAvailableSessions([]);
    setSelectedSessionId("");
    if (!date) return;
    setLoadingSessions(true);
    try {
      const { data, error } = await supabase.rpc("get_sessions_availability", {
        p_start: date,
        p_end: date,
      });
      if (error) throw error;
      const sessions = ((data as SessionAvailability[] | null) ?? []).filter(
        (s) => s.available_count > 0,
      );
      setAvailableSessions(sessions);
    } catch (err) {
      console.error(err);
      toast.error("Erro ao carregar sessões disponíveis");
    } finally {
      setLoadingSessions(false);
    }
  }

  async function handleSubmit() {
    if (!newDate || !selectedSessionId || !reason) {
      toast.error("Data, sessão e justificativa são obrigatórios");
      return;
    }

    setSaving(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user?.id) throw new Error("Usuário não autenticado");

      await createSwapRequest({
        bookingId,
        requestedBy: user.id,
        newSessionId: selectedSessionId,
        newDate,
        reasonText: reason,
        attachment: file ?? undefined,
      });

      toast.success("Solicitação enviada");
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error(err);
      toast.error(getSwapErrorMessage(err));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className={`fixed inset-0 z-50 flex transition-opacity duration-300 ${
        open ? "opacity-100 visible" : "opacity-0 invisible"
      }`}
    >
      <div
        className="absolute inset-0 bg-text-body/45 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        className={`relative w-full max-w-md bg-bg-card border-l border-border-default shadow-2xl p-6 overflow-y-auto transform transition-transform duration-300 ease-in-out ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-text-body">
            Solicitar Reagendamento
          </h3>
          <button
            onClick={onClose}
            className="text-text-muted hover:text-text-body focus-ring rounded-md"
          >
            <span className="material-icons-round">close</span>
          </button>
        </div>
        <div className="space-y-4">
          <div>
            <label
              htmlFor="current-date"
              className="block text-sm font-medium text-text-body"
            >
              Data atual
            </label>
            <input
              id="current-date"
              type="text"
              readOnly
              value={currentDate}
              className="w-full mt-1 rounded-lg border border-border-default bg-bg-default text-text-body text-sm"
            />
          </div>
          <div>
            <label
              htmlFor="new-date"
              className="block text-sm font-medium text-text-body"
            >
              Nova data
            </label>
            <input
              id="new-date"
              type="date"
              value={newDate}
              onChange={(e) => {
                setNewDate(e.target.value);
                void fetchSessionsForDate(e.target.value);
              }}
              className="w-full mt-1 rounded-lg border border-border-default bg-bg-card text-text-body text-sm focus-ring"
            />
          </div>

          {newDate && (
            <div>
              <label
                htmlFor="session-select"
                className="block text-sm font-medium text-text-body"
              >
                Sessão disponível
              </label>
              {loadingSessions ? (
                <p className="mt-1 text-sm text-text-muted">
                  Carregando sessões...
                </p>
              ) : availableSessions.length === 0 ? (
                <p className="mt-1 text-sm text-error font-medium">
                  Nenhuma sessão disponível nessa data.
                </p>
              ) : (
                <select
                  id="session-select"
                  value={selectedSessionId}
                  onChange={(e) => setSelectedSessionId(e.target.value)}
                  className="w-full mt-1 rounded-lg border border-border-default bg-bg-card text-text-body text-sm focus-ring"
                >
                  <option value="">Selecione uma sessão</option>
                  {availableSessions.map((s) => (
                    <option key={s.session_id} value={s.session_id}>
                      {formatSessionPeriod(s.period)} — {s.available_count}{" "}
                      vaga(s) disponível(is)
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          <div>
            <label
              htmlFor="reason"
              className="block text-sm font-medium text-text-body"
            >
              Justificativa
            </label>
            <textarea
              id="reason"
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full mt-1 rounded-lg border border-border-default bg-bg-card text-text-body placeholder:text-text-muted text-sm focus-ring"
            />
          </div>
          <div>
            <label
              htmlFor="attachment"
              className="block text-sm font-medium text-text-body"
            >
              Comprovativo (opcional)
            </label>
            <input
              id="attachment"
              type="file"
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="mt-1 block w-full text-sm text-text-muted file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-1.5 file:font-semibold file:text-primary hover:file:bg-primary/20"
            />
          </div>
          <div className="flex justify-end gap-2 pt-4">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-border-default text-text-body text-sm hover:bg-bg-default transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || !selectedSessionId || !reason}
              className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm disabled:opacity-50"
            >
              {saving ? "Enviando..." : "Enviar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
